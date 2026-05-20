from datetime import date

from app.models.mot_schema import NormalizedMOTRecord
from app.models.schemas import MileageRecord
from app.services.mot_analysis_service import (
    calculate_issue_severity,
    classify_advisory,
    detect_repeated_issues,
    summarise_mot_risks,
)
from app.services.vehicle_analysis_service import detect_mileage_inconsistencies


def test_mot_analysis_detects_repeated_brake_and_tyres():
    history = [
        NormalizedMOTRecord(
            testDate=date(2025, 1, 1),
            result="PASS",
            mileage=50000,
            advisories=["Front brake pads worn", "Nearside tyre worn close to legal limit"],
        ),
        NormalizedMOTRecord(
            testDate=date(2024, 1, 1),
            result="PASS",
            mileage=42000,
            advisories=["Rear brake disc corroded", "Offside tyre tread low"],
        ),
    ]

    assert classify_advisory("Front brake pads worn") == "Brakes"
    assert calculate_issue_severity("Brake disc thickness below minimum") == "Critical"
    assert detect_repeated_issues(history) == ["Brakes", "Tyres"]

    summary = summarise_mot_risks(history)
    assert summary.highest_risk_category in {"Brakes", "Tyres"}
    assert "Brakes" in summary.repeated_issues
    assert "Tyres" in summary.repeated_issues


def test_mileage_inconsistency_is_detected():
    mileage_history = [
        MileageRecord(date=date(2023, 1, 1), mileage=40000),
        MileageRecord(date=date(2024, 1, 1), mileage=39000),
    ]

    assert detect_mileage_inconsistencies(mileage_history) is True


def test_mileage_consistency_passes_for_increasing_readings():
    mileage_history = [
        MileageRecord(date=date(2023, 1, 1), mileage=40000),
        MileageRecord(date=date(2024, 1, 1), mileage=45000),
    ]

    assert detect_mileage_inconsistencies(mileage_history) is False
