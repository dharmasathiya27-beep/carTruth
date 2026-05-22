"""Optional Gemini JSON report writer.

Gemini never replaces CarTruth's rule engine. It receives structured facts from
DVLA, DVSA, and existing CarTruth analysis, then returns public-friendly wording.
Failures return None so the report can fall back to rule-based copy.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

import aiohttp
from app.config import settings
from app.models.schemas import AIReport, VehicleReport

logger = logging.getLogger(__name__)


def build_rule_based_ai_report(report: VehicleReport) -> AIReport:
    verdict_map = {
        "BUY": "Buy",
        "INSPECT": "Inspect Carefully",
        "AVOID": "Avoid",
    }
    risks = (
        report.ownership_score.risk_badges[:3] or report.mot_intelligence.maintenance_warnings[:3]
    )
    positives = [
        item.strip() for item in report.ownership_score.what_looks_good.split(";") if item.strip()
    ][:3]

    return AIReport(
        headline=f"{report.vehicle.make} {report.vehicle.model}: {report.ownership_score.verdict}",
        summary=report.ownership_score.ai_summary,
        buyVerdict=verdict_map.get(report.ownership_score.verdict, "Inspect Carefully"),
        topRisks=risks,
        positiveSigns=positives,
        ownershipAdvice=report.ownership_score.should_buy_recommendation,
        confidenceNote=(
            f"{report.confidence_level} confidence. Insights are estimates based on available "
            "DVLA, DVSA, and CarTruth analysis data, not a mechanical inspection."
        ),
    )


def _prompt(report: VehicleReport) -> str:
    vehicle = report.vehicle
    payload = {
        "vehicleDetails": {
            "registration": vehicle.registration,
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "colour": vehicle.colour,
            "fuelType": vehicle.fuel_type,
            "engineCapacityCc": vehicle.engine_capacity_cc,
            "co2Emissions": vehicle.co2_emissions,
            "wheelplan": vehicle.wheelplan,
            "euroStatus": vehicle.euro_status,
        },
        "dvlaStatus": {
            "taxStatus": vehicle.tax_status,
            "taxDueDate": str(vehicle.tax_due_date) if vehicle.tax_due_date else None,
            "motStatus": vehicle.mot_status,
            "motExpiryDate": str(vehicle.mot_expiry_date) if vehicle.mot_expiry_date else None,
        },
        "dvsaMotSummary": {
            "currentMotStatus": report.current_mot_status,
            "motValidUntil": str(report.mot_valid_until) if report.mot_valid_until else None,
            "motTestsAnalysed": len(report.mot_history),
            "latestMot": (
                report.mot_history[0].model_dump(mode="json") if report.mot_history else None
            ),
        },
        "motIntelligence": report.mot_intelligence.model_dump(mode="json"),
        "mileageAnalysis": {
            "records": [record.model_dump(mode="json") for record in report.mileage_history[:5]],
            "mileageInconsistency": report.ownership_score.mileage_inconsistency,
        },
        "ownershipScore": report.ownership_score.model_dump(mode="json"),
        "riskFactors": report.ownership_score.risk_badges,
        "positiveFactors": report.ownership_score.what_looks_good,
        "confidenceLevel": report.confidence_level,
    }

    return (
        "You are the optional CarTruth AI report writer. Rewrite the structured "
        "CarTruth analysis into concise wording for normal UK car buyers.\n"
        "Rules: do not invent accident history, service history, owner history, "
        "market value, or mechanical inspection findings. Only use DVLA, DVSA, "
        "and existing CarTruth analysis data. Mention that insights are estimates "
        "based on available official data. Return JSON only with this exact shape:\n"
        '{ "headline": "", "summary": "", "buyVerdict": "Buy | Inspect Carefully | Avoid", '
        '"topRisks": [], "positiveSigns": [], "ownershipAdvice": "", "confidenceNote": "" }\n\n'
        f"Structured data:\n{json.dumps(payload, sort_keys=True)}"
    )


def _extract_json(text: str) -> Optional[dict]:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _normalise_ai_report(data: dict) -> AIReport:
    return AIReport(
        headline=str(data.get("headline") or ""),
        summary=str(data.get("summary") or ""),
        buyVerdict=str(data.get("buyVerdict") or "Inspect Carefully"),
        topRisks=[str(item) for item in data.get("topRisks") or []][:5],
        positiveSigns=[str(item) for item in data.get("positiveSigns") or []][:5],
        ownershipAdvice=str(data.get("ownershipAdvice") or ""),
        confidenceNote=str(data.get("confidenceNote") or ""),
    )


async def generate_gemini_ai_report(report: VehicleReport) -> Optional[AIReport]:
    """Call Gemini once for a structured AI report, or return None on fallback."""
    logger.info(
        "Gemini config enabled=%s key_present=%s model=%s version=%s timeout=%s",
        settings.enable_llm_report_writer,
        bool(settings.gemini_api_key),
        settings.gemini_model,
        settings.ai_report_version,
        settings.gemini_timeout_seconds,
    )
    if not settings.enable_llm_report_writer:
        logger.info("Gemini skipped because disabled")
        return None
    if not settings.gemini_api_key:
        logger.info("Gemini skipped because key is missing")
        return None

    logger.info("Gemini called for registration=%s", report.vehicle.registration)
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": _prompt(report)}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 700,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=settings.gemini_timeout_seconds)
        ) as session:
            async with session.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
            ) as response:
                if response.status >= 400:
                    body = await response.text()
                    logger.warning(
                        "Gemini failed with status=%s body=%s gemini_status=FAILED",
                        response.status,
                        body[:1200],
                    )
                    return None
                data = await response.json()
    except (aiohttp.ClientError, TimeoutError, ValueError) as exc:
        logger.warning(
            "Gemini failed error_type=%s gemini_status=FAILED",
            type(exc).__name__,
        )
        return None

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        logger.warning("Gemini failed because response text was missing gemini_status=FAILED")
        return None

    parsed = _extract_json(text)
    if not parsed:
        logger.warning("Gemini failed because JSON parsing failed gemini_status=FAILED")
        return None

    return _normalise_ai_report(parsed)
