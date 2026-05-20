"""Mock vehicle data used for local development and resilient fallbacks."""

from datetime import date
from typing import Optional

from app.models.schemas import MOTRecord, MileageRecord
from app.models.mot_schema import NormalizedMOTRecord
from app.services.mot_data_normalizer import normalise_mock_mot_history

MOCK_VEHICLES = {
    "AB20OXY": {
        "make": "BMW",
        "model": "3 Series",
        "year": 2020,
        "colour": "Black",
        "fuel_type": "Diesel",
        "engine_size": 2.0,
        "engine_capacity_cc": 1995,
        "registration": "AB20OXY",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 6, 30),
        "mot_status": "Valid",
        "mot_expiry_date": date(2026, 11, 15),
        "co2_emissions": 119,
        "month_of_first_registration": "2020-03",
        "wheelplan": "2 AXLE RIGID BODY",
        "euro_status": "EURO 6",
    },
    "YM70EUH": {
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "colour": "Silver",
        "fuel_type": "Hybrid",
        "engine_size": 1.8,
        "engine_capacity_cc": 1798,
        "registration": "YM70EUH",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 8, 15),
        "mot_status": "Valid",
        "mot_expiry_date": date(2026, 10, 5),
        "co2_emissions": 92,
        "month_of_first_registration": "2020-09",
        "wheelplan": "2 AXLE RIGID BODY",
        "euro_status": "EURO 6",
    },
    "GX15EWS": {
        "make": "Ford",
        "model": "Fiesta",
        "year": 2015,
        "colour": "Red",
        "fuel_type": "Petrol",
        "engine_size": 1.25,
        "engine_capacity_cc": 1242,
        "registration": "GX15EWS",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 10, 25),
        "mot_status": "Valid",
        "mot_expiry_date": date(2026, 9, 12),
        "co2_emissions": 122,
        "month_of_first_registration": "2015-05",
        "wheelplan": "2 AXLE RIGID BODY",
        "euro_status": "EURO 5",
    },
    "MK22XYZ": {
        "make": "Tesla",
        "model": "Model 3",
        "year": 2022,
        "colour": "White Pearl",
        "fuel_type": "Electric",
        "engine_size": None,
        "engine_capacity_cc": None,
        "registration": "MK22XYZ",
        "tax_status": "Taxed",
        "tax_due_date": date(2026, 5, 12),
        "mot_status": "Valid",
        "mot_expiry_date": date(2026, 4, 20),
        "co2_emissions": 0,
        "month_of_first_registration": "2022-03",
        "wheelplan": "2 AXLE RIGID BODY",
        "euro_status": "N/A",
    },
}

MOCK_MOT_HISTORY = {
    "AB20OXY": [
        MOTRecord(
            test_date=date(2025, 11, 15),
            result="PASSED",
            mileage=52250,
            defects=["Nearside rear tyre worn close to legal limit"],
        ),
        MOTRecord(
            test_date=date(2024, 11, 15),
            result="PASSED",
            mileage=45230,
            defects=["Front brake pads worn but not excessively", "Windscreen washer fluid low"],
        ),
        MOTRecord(
            test_date=date(2023, 11, 20),
            result="PASSED",
            mileage=38500,
            defects=["Front brake pads worn", "Offside front suspension arm bush deteriorated"],
        ),
        MOTRecord(
            test_date=date(2022, 11, 18),
            result="PASSED",
            mileage=30200,
            defects=[],
        ),
    ],
    "YM70EUH": [
        MOTRecord(
            test_date=date(2025, 10, 5),
            result="PASSED",
            mileage=70400,
            defects=["Nearside front tyre worn close to legal limit", "Rear brake disc slightly corroded"],
        ),
        MOTRecord(
            test_date=date(2024, 10, 5),
            result="PASSED",
            mileage=62100,
            defects=["Exhaust emissions slightly high but within limit"],
        ),
        MOTRecord(
            test_date=date(2023, 10, 10),
            result="PASSED",
            mileage=52300,
            defects=["Nearside front tyre worn", "Front wiper blade deteriorated"],
        ),
    ],
    "GX15EWS": [
        MOTRecord(
            test_date=date(2025, 9, 12),
            result="PASSED",
            mileage=132200,
            defects=[
                "Front brake pads wearing thin",
                "Offside rear tyre worn close to legal limit",
                "Oil leak but not excessive",
            ],
        ),
        MOTRecord(
            test_date=date(2024, 9, 1),
            result="FAILED",
            mileage=118500,
            defects=[
                "Brake disc thickness below minimum",
                "Exhaust emissions exceed legal limit",
                "Engine oil level low",
                "Nearside front suspension ball joint excessive play",
            ],
        ),
        MOTRecord(
            test_date=date(2024, 9, 15),
            result="PASSED",
            mileage=118700,
            defects=["Brake imbalance slightly high", "Rear subframe surface corrosion"],
        ),
        MOTRecord(
            test_date=date(2023, 9, 10),
            result="PASSED",
            mileage=105200,
            defects=[
                "Front brake pads wearing thin",
                "Steering rack gaiter deteriorated",
                "Offside headlamp aim slightly low",
            ],
        ),
        MOTRecord(
            test_date=date(2022, 9, 8),
            result="PASSED",
            mileage=91250,
            defects=["Coolant leak monitor and repair if necessary", "Rear coil spring corroded"],
        ),
    ],
    "MK22XYZ": [
        MOTRecord(
            test_date=date(2025, 4, 20),
            result="PASSED",
            mileage=28600,
            defects=["Nearside rear tyre slightly worn", "Front wiper blade minor deterioration"],
        ),
    ],
}


def get_vehicle_by_registration(registration: str) -> Optional[dict]:
    return MOCK_VEHICLES.get(registration.upper().strip())


def get_mot_history(registration: str) -> list[MOTRecord]:
    return MOCK_MOT_HISTORY.get(registration.upper().strip(), [])


def get_normalized_mot_history(registration: str) -> list[NormalizedMOTRecord]:
    return normalise_mock_mot_history(get_mot_history(registration))


def get_mileage_history(registration: str) -> list[MileageRecord]:
    return [
        MileageRecord(date=mot.test_date, mileage=mot.mileage)
        for mot in get_mot_history(registration)
        if mot.mileage is not None
    ]
