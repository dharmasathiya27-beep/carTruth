from types import SimpleNamespace

import pytest
from app.services import mock_vehicle_service, vehicle_service


@pytest.mark.asyncio
async def test_api_failure_uses_mock_vehicle_when_available(monkeypatch):
    async def failed_dvla_lookup(registration):
        return None

    async def unavailable_dvsa_lookup(registration):
        return {"mot_history": [], "vehicle_identity": {}}

    monkeypatch.setattr(vehicle_service.dvla_service, "fetch_vehicle_from_dvla", failed_dvla_lookup)
    monkeypatch.setattr(
        vehicle_service.dvsa_service, "fetch_vehicle_mot_data_from_dvsa", unavailable_dvsa_lookup
    )
    monkeypatch.setattr(
        vehicle_service,
        "settings",
        SimpleNamespace(use_mock_data=False, allow_mock_mot_fallback=False),
    )

    report = await vehicle_service.generate_vehicle_report("AB20OXY")

    assert report is not None
    assert report.data_source == "mock"
    assert report.vehicle.registration == "AB20OXY"
    assert "DVLA lookup unavailable" in report.warnings[0]


@pytest.mark.asyncio
async def test_development_mock_mot_fallback_populates_history(monkeypatch):
    async def successful_dvla_lookup(registration):
        return mock_vehicle_service.get_vehicle_by_registration("GX15EWS")

    async def unavailable_dvsa_lookup(registration):
        return {"mot_history": [], "vehicle_identity": {}}

    monkeypatch.setattr(
        vehicle_service.dvla_service, "fetch_vehicle_from_dvla", successful_dvla_lookup
    )
    monkeypatch.setattr(
        vehicle_service.dvsa_service, "fetch_vehicle_mot_data_from_dvsa", unavailable_dvsa_lookup
    )
    monkeypatch.setattr(
        vehicle_service,
        "settings",
        SimpleNamespace(use_mock_data=False, allow_mock_mot_fallback=True),
    )

    report = await vehicle_service.generate_vehicle_report("GX15EWS")

    assert report is not None
    assert len(report.mot_history) > 0
    assert len(report.mileage_history) > 0
    assert "Using development mock MOT history fallback." in report.warnings
