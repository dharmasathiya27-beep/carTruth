"""Normalise mock and future DVSA MOT data into CarTruth's internal format."""

from datetime import date, timedelta
from typing import Any, Optional

from app.models.mot_schema import NormalizedMOTRecord
from app.models.schemas import MOTRecord


def _normalise_result(value: str) -> str:
    result = (value or "UNKNOWN").upper()
    if result in {"PASSED", "PASS"}:
        return "PASS"
    if result in {"FAILED", "FAIL"}:
        return "FAIL"
    return result


def _parse_int(value: Any) -> Optional[int]:
    if value in {None, ""}:
        return None
    try:
        return int(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None


def _parse_date(value: Any) -> Optional[str]:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:10]


def normalised_to_mot_record(record: NormalizedMOTRecord) -> MOTRecord:
    """Convert internal normalised MOT data to the public report model."""
    defects = [
        *record.advisories,
        *record.failures,
        *record.dangerousDefects,
        *record.majorDefects,
        *record.minorDefects,
    ]
    result = "PASSED" if record.result == "PASS" else "FAILED" if record.result == "FAIL" else record.result

    return MOTRecord(
        test_date=record.testDate,
        testDate=record.testDate,
        expiryDate=record.expiryDate,
        result=result,
        mileage=record.mileage,
        defects=defects,
        advisories=record.advisories,
        failures=record.failures,
        dangerousDefects=record.dangerousDefects,
        majorDefects=record.majorDefects,
        minorDefects=record.minorDefects,
    )


def mot_record_to_normalised(record: MOTRecord) -> NormalizedMOTRecord:
    """Convert legacy/mock MOTRecord objects into the internal normalised format."""
    result = _normalise_result(record.result)
    failures = record.failures
    advisories = record.advisories

    if not any([advisories, failures, record.dangerousDefects, record.majorDefects, record.minorDefects]):
        if result == "FAIL":
            failures = record.defects
        else:
            advisories = record.defects

    return NormalizedMOTRecord(
        testDate=record.testDate or record.test_date,
        expiryDate=record.expiryDate or (record.test_date + timedelta(days=365) if result == "PASS" else None),
        result=result,
        mileage=record.mileage,
        advisories=advisories,
        failures=failures,
        dangerousDefects=record.dangerousDefects,
        majorDefects=record.majorDefects,
        minorDefects=record.minorDefects,
    )


def normalise_mock_mot_history(records: list[MOTRecord]) -> list[NormalizedMOTRecord]:
    return [mot_record_to_normalised(record) for record in records]


def normalise_dvsa_mot_response(response: Any) -> list[NormalizedMOTRecord]:
    """Prepare DVSA API payloads for CarTruth analysis.

    Supports both the current CarTruth internal format and common DVSA MOT
    response shapes containing `motTests` and defect/comment arrays.
    """
    vehicles = response if isinstance(response, list) else [response]
    tests: list[dict[str, Any]] = []
    for vehicle in vehicles:
        if isinstance(vehicle, dict):
            vehicle_tests = (
                vehicle.get("motTests")
                or vehicle.get("mot_tests")
                or vehicle.get("motTestHistory")
                or []
            )
            if isinstance(vehicle_tests, list):
                tests.extend(vehicle_tests)

    if not tests and isinstance(response, dict):
        maybe_tests = response.get("motTests") or response.get("mot_tests") or response.get("motTestHistory")
        if isinstance(maybe_tests, list):
            tests.extend(maybe_tests)

    normalised: list[NormalizedMOTRecord] = []
    for test in tests:
        if not isinstance(test, dict):
            continue

        defects = test.get("defects") or test.get("rfrAndComments") or []
        advisories: list[str] = []
        dangerous: list[str] = []
        major: list[str] = []
        minor: list[str] = []
        failures: list[str] = []

        for defect in defects:
            if not isinstance(defect, dict):
                continue
            text = str(
                defect.get("text")
                or defect.get("description")
                or defect.get("comment")
                or ""
            ).strip()
            if not text:
                continue

            defect_type = str(defect.get("type") or defect.get("defectType") or "").upper()
            is_dangerous = bool(defect.get("dangerous"))

            if is_dangerous or defect_type == "DANGEROUS":
                dangerous.append(text)
            elif defect_type == "MAJOR":
                major.append(text)
            elif defect_type == "MINOR":
                minor.append(text)
            elif defect_type in {"FAIL", "FAILED", "PRS"}:
                failures.append(text)
            else:
                advisories.append(text)

        test_date = _parse_date(test.get("completedDate") or test.get("testDate"))
        if not test_date:
            continue

        normalised.append(
            NormalizedMOTRecord(
                testDate=test_date,
                expiryDate=_parse_date(test.get("expiryDate") or test.get("motTestExpiryDate")),
                result=_normalise_result(test.get("testResult")),
                mileage=_parse_int(test.get("odometerValue") or test.get("mileage")),
                advisories=advisories,
                failures=[*failures, *dangerous, *major],
                dangerousDefects=dangerous,
                majorDefects=major,
                minorDefects=minor,
            )
        )

    return sorted(normalised, key=lambda record: record.testDate, reverse=True)


def normalise_dvsa_mot_history(payload: Any) -> list[NormalizedMOTRecord]:
    """Backward-compatible alias for older service imports."""
    return normalise_dvsa_mot_response(payload)
