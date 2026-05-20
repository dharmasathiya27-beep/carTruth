"""Rule-based CarTruth intelligence engine.

The MVP deliberately avoids external AI APIs. These functions turn DVLA and
mock data into consistent ownership, cost, reliability, and environmental
signals that the frontend can explain to users.
"""

from datetime import date, timedelta
from typing import Optional

from app.models.schemas import MileageRecord, MOTRecord, OwnershipScore, VehicleDetails

AVERAGE_ANNUAL_MILES = 12000


def get_current_mot_status(mot_history: list[MOTRecord]) -> tuple[str, Optional[date]]:
    if not mot_history:
        return "Unknown", None

    latest_mot = sorted(mot_history, key=lambda record: record.test_date, reverse=True)[0]
    if latest_mot.result != "PASSED":
        return "Expired", None

    expiry_date = latest_mot.expiryDate or latest_mot.test_date + timedelta(days=365)
    today = date.today()

    if today > expiry_date:
        return "Expired", expiry_date
    if (expiry_date - today).days <= 30:
        return "Due Soon", expiry_date
    return "Valid", expiry_date


def calculate_vehicle_age(vehicle: VehicleDetails) -> int:
    """Calculate vehicle age from year of manufacture."""
    if not vehicle.year:
        return 0
    return max(date.today().year - vehicle.year, 0)


def _fuel_type(vehicle: VehicleDetails) -> str:
    return (vehicle.fuel_type or "Unknown").strip().lower()


def _engine_litres(vehicle: VehicleDetails) -> float:
    if vehicle.engine_size:
        return vehicle.engine_size
    if vehicle.engine_capacity_cc:
        return round(vehicle.engine_capacity_cc / 1000, 1)
    return 0


def _latest_mileage(mileage_history: list[MileageRecord]) -> int:
    return max((record.mileage for record in mileage_history), default=0)


def _defect_text(mot_history: list[MOTRecord]) -> list[str]:
    return [defect.lower() for mot in mot_history for defect in mot.defects]


def detect_repeated_tyre_wear(mot_history: list[MOTRecord]) -> bool:
    return sum("tyre" in defect or "tire" in defect for defect in _defect_text(mot_history)) >= 2


def detect_repeated_brake_advisories(mot_history: list[MOTRecord]) -> bool:
    return sum("brake" in defect for defect in _defect_text(mot_history)) >= 2


def detect_mileage_inconsistencies(mileage_history: list[MileageRecord]) -> bool:
    chronological = sorted(mileage_history, key=lambda record: record.date)
    return any(
        current.mileage < previous.mileage
        for previous, current in zip(chronological, chronological[1:])
    )


def estimate_running_cost(
    vehicle: VehicleDetails,
    risk_level: str = "Medium",
    mileage_history: Optional[list[MileageRecord]] = None,
) -> int:
    """Estimate yearly UK running cost from powertrain, age, CO2, engine size, and risk."""
    age = calculate_vehicle_age(vehicle)
    fuel = _fuel_type(vehicle)
    engine_litres = _engine_litres(vehicle)
    latest_mileage = _latest_mileage(mileage_history or [])

    if fuel == "electric":
        fuel_cost = 300
    elif fuel == "hybrid":
        fuel_cost = 650
    elif fuel == "diesel":
        fuel_cost = 950
    else:
        fuel_cost = 1050

    if engine_litres >= 2.5:
        fuel_cost += 250
    elif engine_litres >= 1.8:
        fuel_cost += 100

    if vehicle.co2_emissions:
        if vehicle.co2_emissions >= 180:
            fuel_cost += 250
        elif vehicle.co2_emissions <= 75:
            fuel_cost -= 150

    maintenance_cost = 350
    if age >= 10:
        maintenance_cost += 450
    elif age >= 6:
        maintenance_cost += 250
    elif age <= 3:
        maintenance_cost -= 100

    if latest_mileage >= 100000:
        maintenance_cost += 300
    elif latest_mileage >= 70000:
        maintenance_cost += 150

    if risk_level == "High":
        maintenance_cost += 350
    elif risk_level == "Low":
        maintenance_cost -= 100

    tax_cost = 0
    if vehicle.tax_status.lower() not in {"taxed", "unknown"}:
        tax_cost += 150
    if vehicle.co2_emissions:
        if vehicle.co2_emissions >= 180:
            tax_cost += 250
        elif vehicle.co2_emissions >= 130:
            tax_cost += 120

    insurance_cost = 650 if age <= 5 else 800 if age <= 10 else 900
    return max(450, fuel_cost + maintenance_cost + tax_cost + insurance_cost)


def calculate_risk_level(
    vehicle: VehicleDetails,
    mot_history: Optional[list[MOTRecord]] = None,
    mileage_history: Optional[list[MileageRecord]] = None,
) -> str:
    """Classify ownership risk using DVLA status plus available MOT/mileage signals."""
    mot_history = mot_history or []
    mileage_history = mileage_history or []
    age = calculate_vehicle_age(vehicle)
    fuel = _fuel_type(vehicle)
    engine_litres = _engine_litres(vehicle)
    latest_mileage = _latest_mileage(mileage_history)

    risk_points = 0
    risk_points += 3 if age >= 12 else 2 if age >= 8 else 1 if age >= 5 else 0
    risk_points += 2 if latest_mileage >= 100000 else 1 if latest_mileage >= 70000 else 0
    risk_points += 1 if engine_litres >= 2.0 else 0
    risk_points += 1 if fuel == "diesel" and age >= 7 else 0
    risk_points += 2 if vehicle.tax_status.lower() not in {"taxed", "unknown"} else 0
    risk_points += 3 if (vehicle.mot_status or "").lower() in {"expired", "not valid"} else 0
    risk_points += 2 if vehicle.co2_emissions and vehicle.co2_emissions >= 180 else 0
    risk_points += sum(record.result == "FAILED" for record in mot_history) * 2
    risk_points += 2 if detect_repeated_brake_advisories(mot_history) else 0
    risk_points += 1 if detect_repeated_tyre_wear(mot_history) else 0
    risk_points += 3 if detect_mileage_inconsistencies(mileage_history) else 0

    if risk_points >= 7:
        return "High"
    if risk_points >= 3:
        return "Medium"
    return "Low"


def estimate_reliability(
    vehicle: VehicleDetails,
    mot_history: Optional[list[MOTRecord]] = None,
    mileage_history: Optional[list[MileageRecord]] = None,
) -> str:
    age = calculate_vehicle_age(vehicle)
    risk_level = calculate_risk_level(vehicle, mot_history, mileage_history)
    latest_mileage = _latest_mileage(mileage_history or [])
    failed_tests = sum(record.result == "FAILED" for record in mot_history or [])

    if risk_level == "Low" and age <= 6 and failed_tests == 0:
        return "Strong"
    if risk_level == "High" or age >= 12 or latest_mileage >= 120000 or failed_tests >= 2:
        return "Caution"
    return "Average"


def estimate_environmental_impact(vehicle: VehicleDetails) -> str:
    fuel = _fuel_type(vehicle)
    co2 = vehicle.co2_emissions

    if fuel == "electric" or co2 == 0:
        return "Excellent"
    if fuel == "hybrid" or (co2 is not None and co2 <= 100):
        return "Good"
    if co2 is not None and co2 >= 180:
        return "Poor"
    if fuel == "diesel" and calculate_vehicle_age(vehicle) >= 8:
        return "Average"
    return "Average"


def _score_from_ratings(
    vehicle: VehicleDetails, risk_level: str, reliability: str, environmental: str
) -> int:
    score = 82
    age = calculate_vehicle_age(vehicle)
    fuel = _fuel_type(vehicle)
    engine_litres = _engine_litres(vehicle)

    score -= 18 if risk_level == "High" else 8 if risk_level == "Medium" else 0
    score += 7 if reliability == "Strong" else -12 if reliability == "Caution" else 0
    score += 6 if environmental in {"Excellent", "Good"} else -7 if environmental == "Poor" else 0
    score -= 10 if age >= 12 else 5 if age >= 8 else 0
    score += 4 if age <= 3 else 0
    score -= 6 if engine_litres >= 2.5 else 2 if engine_litres >= 2.0 else 0
    score -= 4 if fuel == "diesel" and age >= 8 else 0
    score -= 10 if vehicle.tax_status.lower() not in {"taxed", "unknown"} else 0
    score -= 12 if (vehicle.mot_status or "").lower() in {"expired", "not valid"} else 0

    return max(0, min(100, score))


def _rating_summary(score: int) -> str:
    if score >= 80:
        return "This vehicle appears suitable for reliable daily commuting."
    if score >= 60:
        return "This vehicle looks usable, but a few ownership factors deserve inspection before buying."
    if score >= 40:
        return "This vehicle carries noticeable ownership risk and should be inspected carefully."
    return "This vehicle shows high ownership risk based on the available data."


def generate_ai_summary(
    vehicle: VehicleDetails,
    score: int,
    risk_level: str,
    reliability: str,
    environmental: str,
    yearly_cost: int,
) -> str:
    """Generate natural language insight without external AI APIs."""
    fuel = _fuel_type(vehicle)
    age = calculate_vehicle_age(vehicle)
    sentences = [_rating_summary(score)]

    if fuel == "diesel" and age >= 7:
        sentences.append(
            "Older diesel vehicles may carry increased maintenance and emissions-related risks."
        )
    elif fuel in {"electric", "hybrid"}:
        sentences.append("The vehicle shows lower running cost characteristics for its class.")

    if risk_level == "Low":
        sentences.append(
            "The available DVLA and history signals point to a lower-risk ownership profile."
        )
    elif risk_level == "High":
        sentences.append(
            "Several factors increase the chance of higher maintenance or compliance costs."
        )

    if reliability == "Strong":
        sentences.append("Reliability indicators are positive for regular use.")
    elif reliability == "Caution":
        sentences.append(
            "Reliability should be confirmed with service history and a mechanical inspection."
        )

    if environmental in {"Excellent", "Good"}:
        sentences.append(
            "Environmental indicators are favourable compared with higher-emission vehicles."
        )
    elif environmental == "Poor":
        sentences.append(
            "Higher emissions may increase tax exposure and urban driving restrictions over time."
        )

    sentences.append(f"Estimated yearly running cost is around £{yearly_cost:,}.")
    return " ".join(sentences)


def _build_factor_list(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
    risk_level: str,
    reliability: str,
    environmental: str,
) -> list[str]:
    factors = [
        f"Vehicle age: {calculate_vehicle_age(vehicle)} years",
        f"Fuel type: {vehicle.fuel_type or 'Unknown'}",
        f"Risk level: {risk_level}",
        f"Reliability rating: {reliability}",
        f"Environmental rating: {environmental}",
    ]

    if vehicle.engine_capacity_cc:
        factors.append(f"Engine capacity: {vehicle.engine_capacity_cc:,} cc")
    elif vehicle.engine_size:
        factors.append(f"Engine size: {vehicle.engine_size}L")

    if vehicle.co2_emissions is not None:
        factors.append(f"CO2 emissions: {vehicle.co2_emissions} g/km")
    if vehicle.tax_status:
        factors.append(f"Tax status: {vehicle.tax_status}")
    if vehicle.mot_status:
        factors.append(f"MOT status: {vehicle.mot_status}")
    if mot_history:
        factors.append(f"MOT records analysed: {len(mot_history)}")
    if _latest_mileage(mileage_history):
        factors.append(f"Latest mileage signal: {_latest_mileage(mileage_history):,} miles")

    return factors


def calculate_ownership_score(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
) -> OwnershipScore:
    repeated_tyres = detect_repeated_tyre_wear(mot_history)
    repeated_brakes = detect_repeated_brake_advisories(mot_history)
    mileage_inconsistency = detect_mileage_inconsistencies(mileage_history)
    risk_level = calculate_risk_level(vehicle, mot_history, mileage_history)
    reliability = estimate_reliability(vehicle, mot_history, mileage_history)
    environmental = estimate_environmental_impact(vehicle)
    yearly_cost = estimate_running_cost(vehicle, risk_level, mileage_history)
    score = _score_from_ratings(vehicle, risk_level, reliability, environmental)

    risk_badges: list[str] = []
    problems: list[str] = []
    good_points: list[str] = []
    notes: list[str] = []

    age = calculate_vehicle_age(vehicle)
    if age <= 3:
        good_points.append("Recent vehicle with lower age-related wear")
    elif age >= 10:
        problems.append(f"Vehicle is {age} years old, so age-related maintenance is more likely")
        risk_badges.append("Older vehicle")

    if _fuel_type(vehicle) in {"electric", "hybrid"}:
        good_points.append("Powertrain should help reduce routine running costs")
    if vehicle.co2_emissions is not None and vehicle.co2_emissions <= 100:
        good_points.append("Lower CO2 emissions support a stronger environmental profile")
    if vehicle.tax_status.lower() not in {"taxed", "unknown"}:
        problems.append("Vehicle tax status needs attention")
        risk_badges.append("Tax status")
    if (vehicle.mot_status or "").lower() in {"expired", "not valid"}:
        problems.append("MOT status needs attention")
        risk_badges.append("MOT status")

    failed_tests = sum(record.result == "FAILED" for record in mot_history)
    if failed_tests:
        problems.append(f"{failed_tests} failed MOT test(s) found")
        risk_badges.append("MOT failure history")
    if repeated_tyres:
        problems.append("Repeated tyre wear advisories detected")
        risk_badges.append("Tyre wear pattern")
    if repeated_brakes:
        problems.append("Repeated brake advisories detected")
        risk_badges.append("Brake wear pattern")
    if mileage_inconsistency:
        problems.append("Mileage appears to decrease between records")
        risk_badges.append("Mileage anomaly")
    if not mot_history:
        notes.append("Detailed MOT timeline is not available from DVLA Vehicle Enquiry data")

    if not problems:
        good_points.append("No major ownership red flags found in available data")
    if not good_points:
        good_points.append("Limited positive indicators based on available data")

    verdict = "BUY" if score >= 78 else "INSPECT" if score >= 50 else "AVOID"
    recommendation = {
        "BUY": "Buy candidate. The available data supports a strong ownership case, but still confirm service history.",
        "INSPECT": "Inspect before buying. The vehicle may be sensible, but the flagged factors need checking.",
        "AVOID": "Avoid unless priced very aggressively. The available data points to elevated ownership risk.",
    }[verdict]

    ai_summary = generate_ai_summary(
        vehicle, score, risk_level, reliability, environmental, yearly_cost
    )
    factors = _build_factor_list(
        vehicle, mot_history, mileage_history, risk_level, reliability, environmental
    )

    return OwnershipScore(
        score=score,
        ownership_score=score,
        summary=f"Ownership Score: {score}/100",
        what_looks_good="; ".join(good_points),
        potential_problems="; ".join(problems) if problems else "No significant issues identified",
        expected_yearly_cost=f"£{yearly_cost:,}/year estimated running cost",
        should_buy_recommendation=recommendation,
        verdict=verdict,
        risk_level=risk_level,
        maintenance_risk=risk_level,
        yearly_running_cost=yearly_cost,
        yearly_cost_estimate=yearly_cost,
        reliability_rating=reliability,
        environmental_rating=environmental,
        ai_summary=ai_summary,
        score_explanation=(
            "The score combines vehicle age, fuel type, engine size, CO2 emissions, tax status, "
            "MOT status, estimated maintenance exposure, and running cost characteristics."
        ),
        affecting_factors=factors,
        data_basis="Estimated based on DVLA vehicle data and available mock MOT history where present",
        risk_badges=risk_badges,
        repeated_tyres=repeated_tyres,
        repeated_brakes=repeated_brakes,
        mileage_inconsistency=mileage_inconsistency,
        analysis_notes=notes,
    )
