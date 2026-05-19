"""Vehicle report orchestration service."""

from typing import Optional

from app.config import settings
from app.models.schemas import VehicleDetails, VehicleReport
from app.services import dvla_service, dvsa_service, mock_vehicle_service
from app.services.vehicle_analysis_service import (
    calculate_ownership_score,
    get_current_mot_status,
)


async def generate_vehicle_report(registration: str) -> Optional[VehicleReport]:
    """Generate a complete report with official API fallback to mock data."""
    registration_clean = dvla_service.normalise_registration(registration)
    warnings: list[str] = []
    data_source = "official"

    vehicle_data = await dvla_service.fetch_vehicle_from_dvla(registration_clean)
    if vehicle_data is None:
        data_source = "mock"
        vehicle_data = mock_vehicle_service.get_vehicle_by_registration(registration_clean)
        if not settings.use_mock_data:
            warnings.append("DVLA lookup unavailable, using mock vehicle data where possible.")

    if not vehicle_data:
        return None

    mot_history = await dvsa_service.fetch_mot_history(registration_clean)
    if not mot_history:
        if data_source == "official" and not settings.use_mock_data:
            warnings.append("DVSA MOT lookup unavailable, using mock MOT data where possible.")
        mock_mot_history = mock_vehicle_service.get_mot_history(registration_clean)
        if mock_mot_history:
            mot_history = mock_mot_history
            data_source = "mock" if data_source == "mock" else "official+mock"

    mileage_history = dvsa_service.mileage_from_mot_history(mot_history)
    if not mileage_history:
        mileage_history = mock_vehicle_service.get_mileage_history(registration_clean)

    mot_history = sorted(mot_history, key=lambda record: record.test_date, reverse=True)
    mileage_history = sorted(mileage_history, key=lambda record: record.date, reverse=True)

    vehicle = VehicleDetails(**vehicle_data)
    current_mot_status, mot_valid_until = get_current_mot_status(mot_history)
    ownership_score = calculate_ownership_score(vehicle, mot_history, mileage_history)

    if settings.use_mock_data and "mock" not in data_source:
        data_source = "mock"

    return VehicleReport(
        vehicle=vehicle,
        current_mot_status=current_mot_status,
        mot_valid_until=mot_valid_until,
        mot_history=mot_history,
        mileage_history=mileage_history,
        ownership_score=ownership_score,
        data_source=data_source,
        warnings=warnings,
    )
