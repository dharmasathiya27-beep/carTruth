"""Mock vehicle data used for local development and resilient fallbacks."""

from datetime import date
from typing import Optional

from app.models.schemas import MOTRecord, MileageRecord

MOCK_VEHICLES = {
    "AB20OXY": {
        "make": "BMW",
        "model": "3 Series",
        "year": 2020,
        "colour": "Black",
        "fuel_type": "Diesel",
        "engine_size": 2.0,
        "registration": "AB20OXY",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 6, 30),
    },
    "YM70EUH": {
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "colour": "Silver",
        "fuel_type": "Hybrid",
        "engine_size": 1.8,
        "registration": "YM70EUH",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 8, 15),
    },
    "GX15EWS": {
        "make": "Ford",
        "model": "Fiesta",
        "year": 2015,
        "colour": "Red",
        "fuel_type": "Petrol",
        "engine_size": 1.25,
        "registration": "GX15EWS",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 10, 25),
    },
    "MK22XYZ": {
        "make": "Tesla",
        "model": "Model 3",
        "year": 2022,
        "colour": "White Pearl",
        "fuel_type": "Electric",
        "engine_size": None,
        "registration": "MK22XYZ",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 5, 12),
    },
}

MOCK_MOT_HISTORY = {
    "AB20OXY": [
        MOTRecord(test_date=date(2025, 11, 15), result="PASSED", mileage=52250, defects=[]),
        MOTRecord(test_date=date(2024, 11, 15), result="PASSED", mileage=45230, defects=[]),
        MOTRecord(test_date=date(2023, 11, 20), result="PASSED", mileage=38500, defects=["Front brake pads worn"]),
        MOTRecord(test_date=date(2022, 11, 18), result="PASSED", mileage=30200, defects=[]),
    ],
    "YM70EUH": [
        MOTRecord(test_date=date(2025, 10, 5), result="PASSED", mileage=70400, defects=["Nearside front tyre worn close to legal limit"]),
        MOTRecord(test_date=date(2024, 10, 5), result="PASSED", mileage=62100, defects=[]),
        MOTRecord(test_date=date(2023, 10, 10), result="PASSED", mileage=52300, defects=["Nearside front tyre worn"]),
    ],
    "GX15EWS": [
        MOTRecord(test_date=date(2025, 9, 12), result="PASSED", mileage=132200, defects=["Front brake pads wearing thin", "Offside rear tyre worn close to legal limit"]),
        MOTRecord(test_date=date(2024, 9, 1), result="FAILED", mileage=118500, defects=["Brake disc thickness below minimum", "Engine oil level low"]),
        MOTRecord(test_date=date(2024, 9, 15), result="PASSED", mileage=118700, defects=[]),
        MOTRecord(test_date=date(2023, 9, 10), result="PASSED", mileage=105200, defects=["Front brake pads wearing thin"]),
    ],
    "MK22XYZ": [
        MOTRecord(test_date=date(2025, 4, 20), result="PASSED", mileage=28600, defects=[]),
    ],
}


def get_vehicle_by_registration(registration: str) -> Optional[dict]:
    return MOCK_VEHICLES.get(registration.upper().strip())


def get_mot_history(registration: str) -> list[MOTRecord]:
    return MOCK_MOT_HISTORY.get(registration.upper().strip(), [])


def get_mileage_history(registration: str) -> list[MileageRecord]:
    return [
        MileageRecord(date=mot.test_date, mileage=mot.mileage)
        for mot in get_mot_history(registration)
        if mot.mileage is not None
    ]
