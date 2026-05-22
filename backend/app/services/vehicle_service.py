"""Vehicle report orchestration service."""

from __future__ import annotations

import logging
from typing import Optional

from app.config import settings
from app.models.mot_schema import NormalizedMOTRecord
from app.models.schemas import AIReport, MileageRecord, VehicleDetails, VehicleReport
from app.services import dvla_service, dvsa_service, mock_vehicle_service
from app.services.gemini_report_service import generate_gemini_ai_report
from app.services.mot_analysis_service import enrich_mot_history, summarise_mot_risks
from app.services.mot_data_normalizer import normalised_to_mot_record
from app.services.source_hash_service import generate_source_hash, normalise_source_payload
from app.services.supabase_cache_service import (
    get_ai_report_cache,
    get_latest_report_cache,
    get_report_cache,
    get_source_cache,
    is_report_fresh,
    update_last_checked_at,
    upsert_ai_cache,
    upsert_report_cache,
    upsert_source_cache,
)
from app.services.vehicle_analysis_service import (
    calculate_ownership_score,
    get_current_mot_status,
)

logger = logging.getLogger(__name__)


def _build_trust_metadata(
    vehicle: VehicleDetails,
    data_source: str,
    mot_history_count: int,
    mileage_history_count: int,
    warnings: list[str],
) -> tuple[str, list[str], list[str]]:
    unavailable: list[str] = []
    messages: list[str] = []

    has_dvla = data_source == "dvla"
    has_mot = mot_history_count > 0
    has_mileage = mileage_history_count > 0

    if has_dvla:
        messages.append("DVLA verified data")
    else:
        messages.append("Mock data mode")
        unavailable.append("Official DVLA vehicle data")

    if has_mot:
        messages.append("MOT history available")
    else:
        messages.append("MOT history pending")
        unavailable.append("Detailed MOT history")

    if has_mileage:
        messages.append("Mileage history available")
    else:
        unavailable.append("Mileage history")

    optional_fields = {
        "CO2 emissions": vehicle.co2_emissions,
        "Engine capacity": vehicle.engine_capacity_cc or vehicle.engine_size,
        "Month of first registration": vehicle.month_of_first_registration,
        "Wheelplan": vehicle.wheelplan,
        "Euro status": vehicle.euro_status,
        "Tax due date": vehicle.tax_due_date,
        "MOT expiry date": vehicle.mot_expiry_date,
    }
    missing_optional = [label for label, value in optional_fields.items() if value in {None, "", 0}]
    if missing_optional:
        unavailable.extend(missing_optional)
        messages.append("Some fields may be unavailable from official sources")

    if warnings:
        messages.extend(warnings)

    messages.append("Estimate based on available vehicle data")

    if has_dvla and has_mot:
        confidence = "High"
    elif has_dvla:
        confidence = "Medium"
    else:
        confidence = "Low"

    return confidence, messages, unavailable


def _build_mileage_history_from_mot(normalised_mot_history) -> list[MileageRecord]:
    """Use normalised MOT odometer readings as the report mileage trend."""
    return [
        MileageRecord(date=record.testDate, mileage=record.mileage)
        for record in normalised_mot_history
        if record.mileage is not None
    ]


def _enrich_vehicle_data_from_dvsa(vehicle_data: dict, vehicle_identity: dict) -> dict:
    """Fill gaps left by DVLA using non-sensitive DVSA vehicle identity fields."""
    enriched = vehicle_data.copy()

    field_map = {
        "model": "model",
        "make": "make",
        "fuel_type": "fuel_type",
        "colour": "colour",
        "registration": "registration",
    }
    unknown_values = {"", "unknown", "unknown model", "n/a", "none"}

    for target_field, identity_field in field_map.items():
        current_value = enriched.get(target_field)
        identity_value = vehicle_identity.get(identity_field)
        if str(current_value).strip().lower() in unknown_values and identity_value:
            enriched[target_field] = identity_value

    make = str(enriched.get("make") or "").strip().upper()
    model = str(enriched.get("model") or "").strip()
    fuel_type = str(enriched.get("fuel_type") or "").strip().lower()
    if make == "BMW" and model.isdigit() and len(model) == 3:
        suffix = "d" if fuel_type == "diesel" else "i" if fuel_type in {"petrol", "hybrid"} else ""
        if suffix:
            enriched["model"] = f"{model}{suffix}"

    return enriched


async def _fetch_source_data(
    registration_clean: str,
) -> Optional[tuple[dict, list[NormalizedMOTRecord], dict, str, list[str]]]:
    warnings: list[str] = []
    data_source = "dvla"

    vehicle_data = await dvla_service.fetch_vehicle_from_dvla(registration_clean)
    if vehicle_data is None:
        data_source = "mock"
        vehicle_data = mock_vehicle_service.get_vehicle_by_registration(registration_clean)
        if not settings.use_mock_data:
            logger.info(
                "Using mock vehicle fallback after DVLA lookup returned no usable data for registration=%s",
                registration_clean,
            )
            warnings.append("DVLA lookup unavailable, using mock vehicle data where possible.")

    if not vehicle_data:
        logger.info("Vehicle report could not be generated for registration=%s", registration_clean)
        return None

    dvsa_mot_data = await dvsa_service.fetch_vehicle_mot_data_from_dvsa(registration_clean)
    normalised_mot_history = dvsa_mot_data["mot_history"]

    if not normalised_mot_history and not settings.use_mock_data:
        warnings.append(
            "DVSA MOT data unavailable. MOT history and mileage insights may be limited."
        )
        if settings.allow_mock_mot_fallback:
            normalised_mot_history = mock_vehicle_service.get_normalized_mot_history(
                registration_clean
            )
            if normalised_mot_history:
                logger.info(
                    "Using development mock MOT fallback for registration=%s",
                    registration_clean,
                )
                warnings.append("Using development mock MOT history fallback.")

    return (
        vehicle_data,
        normalised_mot_history,
        dvsa_mot_data["vehicle_identity"],
        data_source,
        warnings,
    )


def _build_dvsa_source_payload(
    normalised_mot_history: list[NormalizedMOTRecord],
    vehicle_identity: dict,
) -> dict:
    return {
        "mot_history": [record.model_dump(mode="json") for record in normalised_mot_history],
        "vehicle_identity": vehicle_identity,
    }


def _build_report_from_source(
    vehicle_data: dict,
    normalised_mot_history: list[NormalizedMOTRecord],
    vehicle_identity: dict,
    data_source: str,
    warnings: list[str],
) -> VehicleReport:
    vehicle_data = _enrich_vehicle_data_from_dvsa(vehicle_data, vehicle_identity)
    mot_history = [normalised_to_mot_record(record) for record in normalised_mot_history]
    mileage_history = _build_mileage_history_from_mot(normalised_mot_history)

    mot_history = sorted(mot_history, key=lambda record: record.test_date, reverse=True)
    normalised_mot_history = sorted(
        normalised_mot_history, key=lambda record: record.testDate, reverse=True
    )
    mileage_history = sorted(mileage_history, key=lambda record: record.date, reverse=True)
    mot_history = enrich_mot_history(mot_history, normalised_mot_history)
    mot_intelligence = summarise_mot_risks(normalised_mot_history)

    vehicle = VehicleDetails(**vehicle_data)
    if mot_history:
        current_mot_status, mot_valid_until = get_current_mot_status(mot_history)
    else:
        current_mot_status = vehicle.mot_status or "Unknown"
        mot_valid_until = vehicle.mot_expiry_date

    ownership_score = calculate_ownership_score(vehicle, mot_history, mileage_history)

    if settings.use_mock_data and "mock" not in data_source:
        data_source = "mock"

    confidence_level, trust_messages, unavailable_data = _build_trust_metadata(
        vehicle=vehicle,
        data_source=data_source,
        mot_history_count=len(mot_history),
        mileage_history_count=len(mileage_history),
        warnings=warnings,
    )

    report = VehicleReport(
        vehicle=vehicle,
        current_mot_status=current_mot_status,
        mot_valid_until=mot_valid_until,
        mot_history=mot_history,
        mileage_history=mileage_history,
        mot_intelligence=mot_intelligence,
        ownership_score=ownership_score,
        data_source=data_source,
        confidence_level=confidence_level,
        trust_messages=trust_messages,
        unavailable_data=unavailable_data,
        warnings=warnings,
    )
    return report


def _report_from_cache(row: dict) -> Optional[VehicleReport]:
    try:
        report_json = row.get("report_json") or {}
        return VehicleReport.model_validate(report_json)
    except (TypeError, ValueError) as exc:
        logger.warning("Cached report could not be parsed error_type=%s", type(exc).__name__)
        return None


def _ai_report_from_cache(row: dict | None) -> Optional[AIReport]:
    if not row:
        return None
    try:
        return AIReport.model_validate(row.get("ai_report_json") or {})
    except (TypeError, ValueError) as exc:
        logger.warning("Cached AI report could not be parsed error_type=%s", type(exc).__name__)
        return None


async def _attach_cached_ai_report(
    report: VehicleReport, registration: str, source_hash: str
) -> None:
    cached_ai = _ai_report_from_cache(await get_ai_report_cache(registration, source_hash))
    if cached_ai:
        report.ai_report = cached_ai


async def _cache_report_and_ai(
    registration: str,
    source_hash: str,
    report: VehicleReport,
    *,
    should_call_gemini: bool,
) -> None:
    if should_call_gemini:
        ai_report = await generate_gemini_ai_report(report)
        if ai_report:
            report.ai_report = ai_report
            await upsert_ai_cache(
                registration,
                source_hash,
                ai_report.model_dump(mode="json"),
            )
        else:
            logger.info("Gemini fallback used for registration=%s", registration)
    else:
        logger.info("Gemini skipped for unchanged source registration=%s", registration)

    await upsert_report_cache(
        registration,
        source_hash,
        report.model_dump(mode="json"),
    )


async def generate_vehicle_report(registration: str) -> Optional[VehicleReport]:
    """Generate a complete report with persistent cache and live fallback."""
    registration_clean = dvla_service.normalise_registration(registration)

    latest_cached_report = await get_latest_report_cache(registration_clean)
    if is_report_fresh(latest_cached_report):
        report = _report_from_cache(latest_cached_report)
        if report:
            logger.info("Supabase report cache hit registration=%s", registration_clean)
            return report

    if latest_cached_report:
        logger.info("Supabase report cache stale registration=%s", registration_clean)
    else:
        logger.info("Supabase report cache miss registration=%s", registration_clean)

    source_result = await _fetch_source_data(registration_clean)
    if not source_result:
        return None

    vehicle_data, normalised_mot_history, vehicle_identity, data_source, warnings = source_result
    dvsa_source_data = _build_dvsa_source_payload(normalised_mot_history, vehicle_identity)
    source_payload = normalise_source_payload(vehicle_data, dvsa_source_data)
    source_hash = generate_source_hash(vehicle_data, dvsa_source_data)

    previous_source = await get_source_cache(registration_clean)
    source_unchanged = bool(previous_source and previous_source.get("source_hash") == source_hash)

    if source_unchanged:
        logger.info("Source hash unchanged registration=%s", registration_clean)
        await update_last_checked_at(registration_clean)
        cached_report = _report_from_cache(
            await get_report_cache(registration_clean, source_hash) or {}
        )
        if cached_report:
            await _attach_cached_ai_report(cached_report, registration_clean, source_hash)
            return cached_report
        logger.info(
            "Source unchanged but cached rule report missing; rebuilding registration=%s",
            registration_clean,
        )
    else:
        logger.info("Source hash changed registration=%s", registration_clean)
        await upsert_source_cache(
            registration_clean,
            source_hash,
            source_payload["dvla"],
            source_payload["dvsa"],
        )

    report = _build_report_from_source(
        vehicle_data,
        normalised_mot_history,
        vehicle_identity,
        data_source,
        warnings,
    )
    if source_unchanged:
        await _attach_cached_ai_report(report, registration_clean, source_hash)

    await _cache_report_and_ai(
        registration_clean,
        source_hash,
        report,
        should_call_gemini=not source_unchanged,
    )
    return report
