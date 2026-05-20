"""Internal normalised MOT data schema.

This mirrors the shape CarTruth will use for both mock records and future DVSA
MOT History API responses.
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class NormalizedMOTRecord(BaseModel):
    testDate: date
    expiryDate: Optional[date] = None
    result: str
    mileage: Optional[int] = None
    advisories: list[str] = Field(default_factory=list)
    failures: list[str] = Field(default_factory=list)
    dangerousDefects: list[str] = Field(default_factory=list)
    majorDefects: list[str] = Field(default_factory=list)
    minorDefects: list[str] = Field(default_factory=list)
