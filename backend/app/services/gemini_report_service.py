"""Optional Gemini JSON report writer.

Gemini never replaces CarTruth's rule engine. It receives structured facts from
DVLA, DVSA, and existing CarTruth analysis, then returns public-friendly wording.
Failures return None so the report can fall back to rule-based copy.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Optional

import aiohttp
from app.config import settings
from app.models.schemas import AIReport, VehicleReport

logger = logging.getLogger(__name__)

RETRYABLE_GEMINI_STATUSES = {503}
PRIMARY_BACKOFF_SECONDS = [0.5]
_gemini_ai_cache: dict[str, AIReport] = {}


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
        source="rule",
    )


def _latest_mot_date(report: VehicleReport) -> str:
    if not report.mot_history:
        return "none"
    latest = max(
        report.mot_history,
        key=lambda record: record.test_date,
    )
    return latest.test_date.isoformat()


def _gemini_cache_key(report: VehicleReport) -> str:
    return "|".join(
        [
            report.vehicle.registration.upper().replace(" ", ""),
            str(report.ownership_score.score),
            _latest_mot_date(report),
            str(len(report.mot_history)),
        ]
    )


def get_cached_gemini_ai_report(report: VehicleReport) -> Optional[AIReport]:
    if not settings.enable_gemini_cache:
        return None
    cache_key = _gemini_cache_key(report)
    cached = _gemini_ai_cache.get(cache_key)
    if cached:
        logger.info("Gemini cache hit key=%s", cache_key)
        return cached.model_copy(deep=True)
    logger.info("Gemini cache miss key=%s", cache_key)
    return None


def cache_gemini_ai_report(report: VehicleReport, ai_report: AIReport) -> None:
    if not settings.enable_gemini_cache:
        return
    cache_key = _gemini_cache_key(report)
    _gemini_ai_cache[cache_key] = ai_report.model_copy(deep=True)
    logger.info("Gemini AI report saved to in-memory cache key=%s", cache_key)


def clear_gemini_ai_cache() -> int:
    count = len(_gemini_ai_cache)
    _gemini_ai_cache.clear()
    logger.info("Gemini in-memory cache cleared count=%s", count)
    return count


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
        "Return ONLY valid raw JSON. Do not use markdown. Do not wrap response in ```json. "
        "Do not include explanations or extra text.\n"
        "Rules: do not invent accident history, service history, owner history, "
        "market value, or mechanical inspection findings. Only use DVLA, DVSA, "
        "and existing CarTruth analysis data. Mention that insights are estimates "
        "based on available official data. Return JSON only with this exact shape:\n"
        '{ "headline": "", "summary": "", "buyVerdict": "Buy | Inspect Carefully | Avoid", '
        '"topRisks": [], "positiveSigns": [], "ownershipAdvice": "", "confidenceNote": "" }\n\n'
        f"Structured data:\n{json.dumps(payload, sort_keys=True)}"
    )


def _strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_json_object(text: str) -> Optional[str]:
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    return match.group(0).strip()


def safe_parse_gemini_json(response_text: str) -> Optional[dict]:
    """Parse Gemini JSON even when the model adds fences or surrounding text."""
    candidates = [response_text.strip(), _strip_markdown_fences(response_text)]
    extracted = _extract_json_object(candidates[-1])
    if extracted:
        candidates.append(_strip_markdown_fences(extracted))

    seen: set[str] = set()
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            logger.info("Gemini JSON parse success")
            if candidate != response_text.strip():
                logger.info("Gemini JSON cleaned successfully")
            return parsed

    logger.warning("Gemini JSON parse failed")
    if settings.app_env == "development":
        logger.warning("Gemini raw response in development: %s", response_text[:4000])
    return None


def _extract_json(text: str) -> Optional[dict]:
    return safe_parse_gemini_json(text)


def _normalise_ai_report(data: dict) -> AIReport:
    return AIReport(
        headline=str(data.get("headline") or ""),
        summary=str(data.get("summary") or ""),
        buyVerdict=str(data.get("buyVerdict") or "Inspect Carefully"),
        topRisks=[str(item) for item in data.get("topRisks") or []][:5],
        positiveSigns=[str(item) for item in data.get("positiveSigns") or []][:5],
        ownershipAdvice=str(data.get("ownershipAdvice") or ""),
        confidenceNote=str(data.get("confidenceNote") or ""),
        source="gemini",
    )


async def generate_gemini_ai_report(report: VehicleReport) -> Optional[AIReport]:
    """Call Gemini once for a structured AI report, or return None on fallback."""
    logger.info(
        "Gemini enabled=%s key_present=%s model=%s fallback_model=%s version=%s timeout=%s",
        settings.enable_llm_report_writer,
        bool(settings.gemini_api_key),
        settings.gemini_model,
        settings.gemini_fallback_model,
        settings.ai_report_version,
        settings.gemini_timeout_seconds,
    )
    if not settings.enable_llm_report_writer:
        logger.info("Gemini skipped because disabled")
        return None
    if not settings.gemini_api_key:
        logger.info("Gemini skipped because key is missing")
        return None

    cached = get_cached_gemini_ai_report(report)
    if cached:
        return cached

    payload = {
        "contents": [{"role": "user", "parts": [{"text": _prompt(report)}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 700,
            "responseMimeType": "application/json",
        },
    }

    data = await _call_gemini_with_retries(
        model=settings.gemini_model,
        payload=payload,
        registration=report.vehicle.registration,
        is_fallback_model=False,
    )
    if data is None:
        return None

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        logger.warning("Gemini failed because response text was missing gemini_status=FAILED")
        return None

    logger.info("Gemini raw response received")
    parsed = _extract_json(text)
    if not parsed:
        logger.warning("Gemini failed because JSON parsing failed gemini_status=FAILED")
        return None

    ai_report = _normalise_ai_report(parsed)
    cache_gemini_ai_report(report, ai_report)
    logger.info("Gemini success registration=%s", report.vehicle.registration)
    return ai_report


async def _call_gemini_with_retries(
    *,
    model: str,
    payload: dict[str, Any],
    registration: str,
    is_fallback_model: bool,
) -> Optional[dict[str, Any]]:
    attempts = 1 if is_fallback_model else 1 + len(PRIMARY_BACKOFF_SECONDS)
    last_status: Optional[int] = None

    if is_fallback_model:
        logger.info("Gemini fallback model called registration=%s model=%s", registration, model)
    else:
        logger.info("Gemini primary model called registration=%s model=%s", registration, model)

    for attempt_index in range(attempts):
        if attempt_index > 0:
            backoff = PRIMARY_BACKOFF_SECONDS[attempt_index - 1]
            logger.info(
                "Gemini retry attempt %s/%s registration=%s wait_ms=%s",
                attempt_index,
                len(PRIMARY_BACKOFF_SECONDS),
                registration,
                int(backoff * 1000),
            )
            await asyncio.sleep(backoff)

        data, status = await _post_gemini(model=model, payload=payload)
        last_status = status
        if data is not None:
            return data
        if status not in RETRYABLE_GEMINI_STATUSES:
            return None

    if last_status in RETRYABLE_GEMINI_STATUSES:
        logger.warning(
            "Gemini unavailable registration=%s status=%s gemini_status=FALLBACK",
            registration,
            last_status,
        )
    return None


async def _post_gemini(
    *,
    model: str,
    payload: dict[str, Any],
) -> tuple[Optional[dict[str, Any]], Optional[int]]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

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
                    if response.status == 429:
                        logger.warning(
                            "Gemini quota exceeded, using fallback body=%s gemini_status=FALLBACK",
                            body[:1200],
                        )
                        return None, response.status
                    logger.warning(
                        "Gemini failed with status=%s body=%s gemini_status=FAILED",
                        response.status,
                        body[:1200],
                    )
                    return None, response.status
                return await response.json(), response.status
    except (aiohttp.ClientError, TimeoutError, asyncio.TimeoutError, ValueError) as exc:
        logger.warning(
            "Gemini failed error_type=%s gemini_status=FAILED",
            type(exc).__name__,
        )
        return None, 0
