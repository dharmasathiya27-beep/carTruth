"""Integration point for the DVSA MOT History API."""

from datetime import date
from typing import Optional

import aiohttp

from app.config import settings
from app.models.schemas import MOTRecord, MileageRecord


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return date.fromisoformat(value[:10])


def _normalise_mot_payload(payload: dict) -> list[MOTRecord]:
    tests = payload.get("motTests") or payload.get("mot_tests") or []
    records: list[MOTRecord] = []

    for test in tests:
        test_date = _parse_date(test.get("completedDate") or test.get("testDate"))
        if not test_date:
            continue

        defects = []
        for defect in test.get("defects", []):
            text = defect.get("text") or defect.get("dangerous") or defect.get("description")
            if text:
                defects.append(str(text))

        odometer = test.get("odometerValue") or test.get("mileage")
        records.append(
            MOTRecord(
                test_date=test_date,
                result=str(test.get("testResult", "UNKNOWN")).upper(),
                mileage=int(odometer) if odometer else None,
                defects=defects,
            )
        )

    return sorted(records, key=lambda record: record.test_date, reverse=True)


async def fetch_mot_history(registration: str) -> list[MOTRecord]:
    """Fetch MOT history from DVSA when configured, otherwise return an empty list."""
    if settings.use_mock_data or not settings.dvsa_api_key:
        return []

    try:
        url = f"{settings.dvsa_api_base_url}/{registration.upper().strip()}"
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as session:
            async with session.get(url, headers={"x-api-key": settings.dvsa_api_key}) as response:
                if response.status >= 400:
                    return []
                payload = await response.json()
                if isinstance(payload, list):
                    payload = payload[0] if payload else {}
                return _normalise_mot_payload(payload)
    except Exception:
        return []


def mileage_from_mot_history(mot_history: list[MOTRecord]) -> list[MileageRecord]:
    return [
        MileageRecord(date=record.test_date, mileage=record.mileage)
        for record in mot_history
        if record.mileage is not None
    ]
