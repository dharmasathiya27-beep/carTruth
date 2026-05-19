"""
Mock data service for vehicle information.
In production, this would connect to DVLA and DVSA APIs.
"""

from datetime import date, timedelta
from typing import Optional
import random
from app.models.schemas import (
    VehicleDetails, MOTRecord, MileageRecord, 
    OwnershipScore, VehicleReport
)

# Mock vehicle database
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
        "tax_due_date": date(2025, 6, 30),
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
        "tax_due_date": date(2025, 8, 15),
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
        "tax_due_date": date(2025, 10, 25),
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
        "tax_due_date": date(2025, 5, 12),
    },
}

# Mock MOT history data
MOCK_MOT_HISTORY = {
    "AB20OXY": [
        MOTRecord(
            test_date=date(2024, 11, 15),
            result="PASSED",
            mileage=45230,
            defects=[]
        ),
        MOTRecord(
            test_date=date(2023, 11, 20),
            result="PASSED",
            mileage=38500,
            defects=["Front brake pads worn"]
        ),
        MOTRecord(
            test_date=date(2022, 11, 18),
            result="PASSED",
            mileage=30200,
            defects=[]
        ),
    ],
    "YM70EUH": [
        MOTRecord(
            test_date=date(2024, 10, 5),
            result="PASSED",
            mileage=62100,
            defects=[]
        ),
        MOTRecord(
            test_date=date(2023, 10, 10),
            result="PASSED",
            mileage=52300,
            defects=["Nearside front tyre worn"]
        ),
    ],
    "GX15EWS": [
        MOTRecord(
            test_date=date(2024, 9, 1),
            result="FAILED",
            mileage=118500,
            defects=["Brake disc thickness below minimum", "Engine oil level low"]
        ),
        MOTRecord(
            test_date=date(2024, 9, 15),
            result="PASSED",
            mileage=118700,
            defects=[]
        ),
        MOTRecord(
            test_date=date(2023, 9, 10),
            result="PASSED",
            mileage=105200,
            defects=["Exhaust has a double tailpipe"]
        ),
    ],
}

# Mock mileage history
MOCK_MILEAGE_HISTORY = {
    "AB20OXY": [
        MileageRecord(date=date(2024, 11, 15), mileage=45230),
        MileageRecord(date=date(2023, 11, 20), mileage=38500),
        MileageRecord(date=date(2022, 11, 18), mileage=30200),
        MileageRecord(date=date(2021, 11, 15), mileage=15600),
    ],
    "YM70EUH": [
        MileageRecord(date=date(2024, 10, 5), mileage=62100),
        MileageRecord(date=date(2023, 10, 10), mileage=52300),
        MileageRecord(date=date(2022, 6, 20), mileage=40000),
    ],
    "GX15EWS": [
        MileageRecord(date=date(2024, 9, 15), mileage=118700),
        MileageRecord(date=date(2023, 9, 10), mileage=105200),
        MileageRecord(date=date(2022, 3, 5), mileage=85000),
    ],
}


def get_vehicle_by_registration(registration: str) -> Optional[dict]:
    """
    Fetch vehicle details by registration number.
    TODO: Replace with real DVLA API call
    """
    registration_clean = registration.upper().strip()
    return MOCK_VEHICLES.get(registration_clean)


def get_mot_history(registration: str) -> list[MOTRecord]:
    """
    Fetch MOT history for a vehicle.
    TODO: Replace with real DVSA API call
    """
    registration_clean = registration.upper().strip()
    return MOCK_MOT_HISTORY.get(registration_clean, [])


def get_mileage_history(registration: str) -> list[MileageRecord]:
    """
    Fetch mileage history from MOT records.
    TODO: Replace with real data source
    """
    registration_clean = registration.upper().strip()
    return MOCK_MILEAGE_HISTORY.get(registration_clean, [])


def get_current_mot_status(mot_history: list[MOTRecord]) -> tuple[str, Optional[date]]:
    """
    Calculate current MOT status.
    Valid MOT lasts 12 months from test date.
    """
    if not mot_history:
        return "Unknown", None
    
    latest_mot = mot_history[0]
    
    if latest_mot.result != "PASSED":
        return "Expired", None
    
    expiry_date = latest_mot.test_date + timedelta(days=365)
    today = date.today()
    
    if today > expiry_date:
        return "Expired", expiry_date
    elif (expiry_date - today).days <= 30:
        return "Due Soon", expiry_date
    else:
        return "Valid", expiry_date


def calculate_ownership_score(vehicle: VehicleDetails, mot_history: list[MOTRecord], mileage_history: list[MileageRecord]) -> OwnershipScore:
    """
    Generate an AI-style ownership score and summary.
    This is a rule-based system; in production, could use ML.
    """
    
    score = 85  # Start with a baseline
    problems = []
    good_points = []
    risk_areas = []
    
    # Age-based assessment
    current_year = date.today().year
    age = current_year - vehicle.year
    
    if age < 3:
        good_points.append("Recent model year")
        score += 5
    elif age > 10:
        problems.append(f"Vehicle is {age} years old - increased maintenance risk")
        score -= 15
        risk_areas.append("Older component wear and tear")
    
    # Mileage assessment
    if mileage_history:
        latest_mileage = mileage_history[0].mileage
        expected_mileage = age * 12000  # ~12k miles/year average
        
        if latest_mileage < expected_mileage * 0.8:
            good_points.append("Lower than average mileage for age")
            score += 8
        elif latest_mileage > expected_mileage * 1.3:
            problems.append(f"High mileage ({latest_mileage:,} miles) for age")
            score -= 12
            risk_areas.append("Increased wear on engine and drivetrain")
    
    # Fuel type assessment
    if vehicle.fuel_type == "Electric":
        good_points.append("Electric vehicle - lower running costs and minimal maintenance")
        score += 10
    elif vehicle.fuel_type == "Hybrid":
        good_points.append("Hybrid vehicle - good fuel economy")
        score += 5
    elif vehicle.fuel_type == "Diesel" and age > 5:
        risk_areas.append("Diesel engines may accumulate carbon deposits")
        score -= 3
    
    # MOT history assessment
    if mot_history:
        failed_count = sum(1 for mot in mot_history if mot.result == "FAILED")
        
        if failed_count > 0:
            problems.append(f"Has {failed_count} failed MOT test(s) - indicates maintenance issues")
            score -= 20
            risk_areas.append("Previous MOT failures suggest underlying problems")
        
        # Check for advisory patterns
        advisories_count = sum(len(mot.defects) for mot in mot_history)
        if advisories_count > 5:
            problems.append("Multiple advisory items on MOT records - consider inspection")
            score -= 8
            risk_areas.append("Recurring maintenance items")
    else:
        problems.append("No MOT history available - unable to assess maintenance record")
        score -= 10
    
    # Ensure score is within 0-100
    score = max(0, min(100, score))
    
    # Generate plain English text
    if score >= 80:
        recommendation = "This looks like a solid choice. The vehicle history is clean, and it appears well-maintained. Proceed with confidence, but always get an independent inspection."
    elif score >= 60:
        recommendation = "This car is reasonable value but has some concerns worth investigating. Get a pre-purchase inspection focusing on the flagged risk areas."
    elif score >= 40:
        recommendation = "There are several yellow flags here. Consider negotiating a lower price or looking for alternatives. Professional inspection strongly recommended."
    else:
        recommendation = "We'd recommend caution with this vehicle. Significant issues identified - consider looking at alternatives or factoring in repair costs."
    
    return OwnershipScore(
        score=score,
        summary=f"Ownership Score: {score}/100",
        what_looks_good="; ".join(good_points) if good_points else "Limited positive indicators based on available data",
        potential_problems="; ".join(problems) if problems else "No significant issues identified",
        expected_yearly_cost=estimate_yearly_cost(vehicle, age),
        should_buy_recommendation=recommendation,
    )


def estimate_yearly_cost(vehicle: VehicleDetails, age: int) -> str:
    """Estimate yearly ownership costs based on vehicle characteristics."""
    
    fuel_cost = 0
    maintenance_cost = 0
    insurance_cost = 0
    
    # Fuel cost estimate (10,000 miles/year)
    if vehicle.fuel_type == "Electric":
        fuel_cost = 200  # Minimal electricity cost
        maintenance_cost = 300
    elif vehicle.fuel_type == "Hybrid":
        fuel_cost = 400
        maintenance_cost = 400
    elif vehicle.fuel_type == "Diesel":
        fuel_cost = 600
        maintenance_cost = 500 if age > 5 else 300
    else:  # Petrol
        fuel_cost = 700
        maintenance_cost = 400 if age < 5 else 600
    
    # Insurance estimate (rough UK average)
    if vehicle.year > 2020:
        insurance_cost = 600
    elif vehicle.year > 2015:
        insurance_cost = 700
    else:
        insurance_cost = 800
    
    total = fuel_cost + maintenance_cost + insurance_cost
    
    return f"£{total:,}/year (estimated: fuel £{fuel_cost}, maintenance £{maintenance_cost}, insurance £{insurance_cost})"


def generate_vehicle_report(registration: str) -> Optional[VehicleReport]:
    """
    Generate a complete vehicle report.
    Main entry point for vehicle lookup.
    """
    
    vehicle_data = get_vehicle_by_registration(registration)
    if not vehicle_data:
        return None
    
    vehicle = VehicleDetails(**vehicle_data)
    mot_history = get_mot_history(registration)
    mileage_history = get_mileage_history(registration)
    
    current_mot_status, mot_valid_until = get_current_mot_status(mot_history)
    ownership_score = calculate_ownership_score(vehicle, mot_history, mileage_history)
    
    return VehicleReport(
        vehicle=vehicle,
        current_mot_status=current_mot_status,
        mot_valid_until=mot_valid_until,
        mot_history=mot_history,
        mileage_history=mileage_history,
        ownership_score=ownership_score,
    )
