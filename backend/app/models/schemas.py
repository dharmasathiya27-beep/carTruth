from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class MOTRecord(BaseModel):
    """MOT test result"""

    test_date: date
    testDate: Optional[date] = None
    expiryDate: Optional[date] = None
    result: str  # "PASSED", "FAILED"
    mileage: Optional[int] = None
    defects: List[str] = Field(default_factory=list)
    advisories: List[str] = Field(default_factory=list)
    failures: List[str] = Field(default_factory=list)
    dangerousDefects: List[str] = Field(default_factory=list)
    majorDefects: List[str] = Field(default_factory=list)
    minorDefects: List[str] = Field(default_factory=list)
    classified_defects: List["MOTAdvisory"] = Field(default_factory=list)


class MOTAdvisory(BaseModel):
    """Classified MOT advisory or failure item"""

    text: str
    category: str
    severity: str
    is_repeated: bool = False


class MOTIntelligence(BaseModel):
    """Aggregated MOT risk intelligence"""

    repeated_issues: List[str] = Field(default_factory=list)
    highest_risk_category: str = "None"
    highest_severity: str = "Low"
    maintenance_warnings: List[str] = Field(default_factory=list)
    future_concerns: List[str] = Field(default_factory=list)
    category_counts: dict[str, int] = Field(default_factory=dict)
    severity_counts: dict[str, int] = Field(default_factory=dict)
    summary: str = "No MOT intelligence available"


class MileageRecord(BaseModel):
    """Mileage reading at a specific date"""

    date: date
    mileage: int


class VehicleDetails(BaseModel):
    """Core vehicle information"""

    make: str
    model: str
    year: int
    colour: str
    fuel_type: str  # "Petrol", "Diesel", "Hybrid", "Electric"
    engine_size: Optional[float] = None
    engine_capacity_cc: Optional[int] = None
    registration: str
    tax_status: str  # "Taxed", "Not Taxed", "SORN"
    tax_due_date: Optional[date] = None
    mot_status: Optional[str] = None
    mot_expiry_date: Optional[date] = None
    co2_emissions: Optional[int] = None
    month_of_first_registration: Optional[str] = None
    wheelplan: Optional[str] = None
    euro_status: Optional[str] = None


class OwnershipScore(BaseModel):
    """AI-generated ownership assessment"""

    score: int  # 0-100
    ownership_score: int = 0
    summary: str
    what_looks_good: str
    potential_problems: str
    expected_yearly_cost: str
    should_buy_recommendation: str
    verdict: str = "INSPECT"
    risk_level: str = "Medium"
    maintenance_risk: str = "Medium"
    yearly_running_cost: int = 0
    yearly_cost_estimate: int = 0
    reliability_rating: str = "Average"
    environmental_rating: str = "Average"
    ai_summary: str = ""
    score_explanation: str = ""
    affecting_factors: List[str] = Field(default_factory=list)
    data_basis: str = "Estimated based on available vehicle data"
    risk_badges: List[str] = Field(default_factory=list)
    repeated_tyres: bool = False
    repeated_brakes: bool = False
    mileage_inconsistency: bool = False
    analysis_notes: List[str] = Field(default_factory=list)


class VehicleReport(BaseModel):
    """Complete vehicle report response"""

    vehicle: VehicleDetails
    current_mot_status: str  # "Valid", "Expired", "Due Soon"
    mot_valid_until: Optional[date] = None
    mot_history: List[MOTRecord] = Field(default_factory=list)
    mileage_history: List[MileageRecord] = Field(default_factory=list)
    mot_intelligence: MOTIntelligence = Field(default_factory=MOTIntelligence)
    ownership_score: OwnershipScore
    data_source: str = "mock"
    confidence_level: str = "Low"
    trust_messages: List[str] = Field(default_factory=list)
    unavailable_data: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class SearchQuery(BaseModel):
    """Search request"""

    registration: str
