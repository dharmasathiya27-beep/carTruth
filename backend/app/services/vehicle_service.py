"""Vehicle report orchestration service."""

import logging
from typing import Optional

from app.config import settings
from app.models.schemas import MileageRecord, VehicleDetails, VehicleReport
from app.services import dvla_service, dvsa_service, mock_vehicle_service
from app.services.mot_analysis_service import enrich_mot_history, summarise_mot_risks
from app.services.mot_data_normalizer import normalised_to_mot_record
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


async def generate_vehicle_report(registration: str) -> Optional[VehicleReport]:
    """Generate a complete report with official API fallback to mock data."""
    registration_clean = dvla_service.normalise_registration(registration)
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
    vehicle_data = _enrich_vehicle_data_from_dvsa(vehicle_data, dvsa_mot_data["vehicle_identity"])

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

    return VehicleReport(
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
