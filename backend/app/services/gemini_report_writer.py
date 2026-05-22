"""Optional Gemini narrative enhancement for CarTruth reports.

The rule engine remains the source of truth for score, verdict, risk, MOT, and
cost signals. Gemini is only used, when configured, to rewrite those facts into
a concise buyer-friendly summary. Any API failure falls back to the rule-based
summary without affecting report generation.
"""

import logging
from typing import Optional

import aiohttp
from app.config import settings
from app.models.schemas import (
    MileageRecord,
    MOTIntelligence,
    MOTRecord,
    OwnershipScore,
    VehicleDetails,
)

logger = logging.getLogger(__name__)


def _latest_mileage(mileage_history: list[MileageRecord]) -> Optional[int]:
    if not mileage_history:
        return None
    return max(record.mileage for record in mileage_history)


def _build_prompt(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
    mot_intelligence: MOTIntelligence,
    ownership_score: OwnershipScore,
) -> str:
    latest_mot = mot_history[0] if mot_history else None
    latest_mileage = _latest_mileage(mileage_history)
    top_warnings = mot_intelligence.maintenance_warnings[:3]

    return (
        "Write a concise UK used-car buyer summary for CarTruth. "
        "Use only the facts provided. Do not add new claims, prices, faults, "
        "or inspection results. Keep it under 90 words and sound calm, premium, "
        "and practical.\n\n"
        f"Vehicle: {vehicle.year} {vehicle.make} {vehicle.model}\n"
        f"Fuel: {vehicle.fuel_type}\n"
        f"Tax status: {vehicle.tax_status}\n"
        f"MOT status: {vehicle.mot_status or 'Unknown'}\n"
        f"Latest MOT result: {latest_mot.result if latest_mot else 'Unavailable'}\n"
        f"Latest mileage: {latest_mileage if latest_mileage is not None else 'Unavailable'}\n"
        f"Ownership score: {ownership_score.score}/100\n"
        f"Verdict: {ownership_score.verdict}\n"
        f"Risk level: {ownership_score.risk_level}\n"
        f"Running cost estimate: £{ownership_score.yearly_running_cost:,}/year\n"
        f"Rule-based positives: {ownership_score.what_looks_good}\n"
        f"Rule-based concerns: {ownership_score.potential_problems}\n"
        f"MOT risk summary: {mot_intelligence.summary}\n"
        f"Top maintenance warnings: {'; '.join(top_warnings) if top_warnings else 'None'}"
    )


async def generate_llm_summary(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
    mot_intelligence: MOTIntelligence,
    ownership_score: OwnershipScore,
) -> Optional[str]:
    """Return a Gemini-written summary, or None when unavailable."""
    if not settings.enable_llm_report_writer or not settings.gemini_api_key:
        return None

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": _build_prompt(
                            vehicle, mot_history, mileage_history, mot_intelligence, ownership_score
                        )
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 140,
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
                    logger.warning("Gemini summary failed with status=%s", response.status)
                    return None

                data = await response.json()
    except (aiohttp.ClientError, TimeoutError, ValueError) as exc:
        logger.warning("Gemini summary unavailable error_type=%s", type(exc).__name__)
        return None

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError):
        logger.warning("Gemini summary response did not contain text")
        return None

    return text if text else None
