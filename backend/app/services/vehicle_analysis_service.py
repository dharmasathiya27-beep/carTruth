"""Rule-based vehicle analysis for the MVP report experience."""

from datetime import date, timedelta
from typing import Optional

from app.models.schemas import MOTRecord, MileageRecord, OwnershipScore, VehicleDetails


def get_current_mot_status(mot_history: list[MOTRecord]) -> tuple[str, Optional[date]]:
    if not mot_history:
        return "Unknown", None

    latest_mot = sorted(mot_history, key=lambda record: record.test_date, reverse=True)[0]
    if latest_mot.result != "PASSED":
        return "Expired", None

    expiry_date = latest_mot.test_date + timedelta(days=365)
    today = date.today()

    if today > expiry_date:
        return "Expired", expiry_date
    if (expiry_date - today).days <= 30:
        return "Due Soon", expiry_date
    return "Valid", expiry_date


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


def estimate_yearly_running_cost(vehicle: VehicleDetails, age: int, risk_level: str) -> int:
    fuel_cost = {
        "Electric": 250,
        "Hybrid": 550,
        "Diesel": 850,
        "Petrol": 900,
    }.get(vehicle.fuel_type, 850)

    maintenance_cost = 350
    if age > 8:
        maintenance_cost += 350
    elif age > 4:
        maintenance_cost += 150

    if risk_level == "High":
        maintenance_cost += 450
    elif risk_level == "Medium":
        maintenance_cost += 175

    insurance_cost = 650 if vehicle.year >= 2020 else 800
    return fuel_cost + maintenance_cost + insurance_cost


def estimate_maintenance_risk(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
) -> str:
    age = date.today().year - vehicle.year
    failed_tests = sum(record.result == "FAILED" for record in mot_history)
    advisory_count = sum(len(record.defects) for record in mot_history)
    latest_mileage = max((record.mileage for record in mileage_history), default=0)

    risk_points = 0
    risk_points += 2 if age >= 10 else 1 if age >= 6 else 0
    risk_points += 2 if latest_mileage >= 100000 else 1 if latest_mileage >= 70000 else 0
    risk_points += failed_tests * 2
    risk_points += 2 if advisory_count >= 5 else 1 if advisory_count >= 2 else 0
    risk_points += 2 if detect_repeated_brake_advisories(mot_history) else 0
    risk_points += 1 if detect_repeated_tyre_wear(mot_history) else 0
    risk_points += 3 if detect_mileage_inconsistencies(mileage_history) else 0

    if risk_points >= 6:
        return "High"
    if risk_points >= 3:
        return "Medium"
    return "Low"


def calculate_ownership_score(
    vehicle: VehicleDetails,
    mot_history: list[MOTRecord],
    mileage_history: list[MileageRecord],
) -> OwnershipScore:
    score = 86
    good_points: list[str] = []
    problems: list[str] = []
    risk_badges: list[str] = []
    analysis_notes: list[str] = []

    age = max(date.today().year - vehicle.year, 0)
    latest_mileage = max((record.mileage for record in mileage_history), default=0)
    expected_mileage = max(age, 1) * 12000
    failed_tests = sum(record.result == "FAILED" for record in mot_history)
    advisory_count = sum(len(record.defects) for record in mot_history)

    repeated_tyres = detect_repeated_tyre_wear(mot_history)
    repeated_brakes = detect_repeated_brake_advisories(mot_history)
    mileage_inconsistency = detect_mileage_inconsistencies(mileage_history)
    maintenance_risk = estimate_maintenance_risk(vehicle, mot_history, mileage_history)

    if age <= 3:
        score += 5
        good_points.append("Recent vehicle with lower age-related wear")
    elif age >= 10:
        score -= 12
        problems.append(f"Vehicle is {age} years old, so age-related maintenance is more likely")
        risk_badges.append("Older vehicle")

    if latest_mileage:
        if latest_mileage < expected_mileage * 0.8:
            score += 6
            good_points.append("Mileage is below average for age")
        elif latest_mileage > expected_mileage * 1.25:
            score -= 10
            problems.append(f"High mileage for age at {latest_mileage:,} miles")
            risk_badges.append("High mileage")

    if vehicle.fuel_type == "Electric":
        score += 7
        good_points.append("Electric powertrain should reduce routine running costs")
    elif vehicle.fuel_type == "Hybrid":
        score += 4
        good_points.append("Hybrid fuel type should help running costs")
    elif vehicle.fuel_type == "Diesel" and age >= 6:
        score -= 3
        analysis_notes.append("Older diesel vehicles can need extra checks around emissions and intake systems")

    if failed_tests:
        score -= failed_tests * 12
        problems.append(f"{failed_tests} failed MOT test(s) found")
        risk_badges.append("MOT failure history")

    if advisory_count >= 5:
        score -= 8
        problems.append("Multiple MOT advisories suggest deferred maintenance")
        risk_badges.append("Multiple advisories")
    elif advisory_count:
        score -= 3
        analysis_notes.append("Some advisory items were found in the MOT history")

    if repeated_tyres:
        score -= 6
        problems.append("Repeated tyre wear advisories detected")
        risk_badges.append("Tyre wear pattern")

    if repeated_brakes:
        score -= 8
        problems.append("Repeated brake advisories detected")
        risk_badges.append("Brake wear pattern")

    if mileage_inconsistency:
        score -= 20
        problems.append("Mileage appears to decrease between records")
        risk_badges.append("Mileage anomaly")

    if not mot_history:
        score -= 10
        problems.append("No MOT history available for maintenance assessment")
        risk_badges.append("Limited history")

    if not problems:
        good_points.append("No significant MOT or mileage red flags found")
    if not good_points:
        good_points.append("Limited positive indicators based on available data")

    score = max(0, min(100, score))
    yearly_cost = estimate_yearly_running_cost(vehicle, age, maintenance_risk)
    verdict = "BUY" if score >= 78 else "INSPECT" if score >= 50 else "AVOID"

    if verdict == "BUY":
        recommendation = "Buy candidate. The history looks strong, but still confirm condition and service records before paying."
    elif verdict == "INSPECT":
        recommendation = "Inspect before buying. The car may still be sensible, but the flagged areas need a closer look."
    else:
        recommendation = "Avoid unless priced very aggressively. The report shows enough risk to justify looking elsewhere first."

    return OwnershipScore(
        score=score,
        summary=f"Ownership Score: {score}/100",
        what_looks_good="; ".join(good_points),
        potential_problems="; ".join(problems) if problems else "No significant issues identified",
        expected_yearly_cost=f"£{yearly_cost:,}/year estimated running cost",
        should_buy_recommendation=recommendation,
        verdict=verdict,
        maintenance_risk=maintenance_risk,
        yearly_cost_estimate=yearly_cost,
        risk_badges=risk_badges,
        repeated_tyres=repeated_tyres,
        repeated_brakes=repeated_brakes,
        mileage_inconsistency=mileage_inconsistency,
        analysis_notes=analysis_notes,
    )
