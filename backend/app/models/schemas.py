from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class MOTRecord(BaseModel):
    """MOT test result"""
    test_date: date
    result: str  # "PASSED", "FAILED"
    mileage: Optional[int] = None
    defects: List[str] = Field(default_factory=list)

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
    registration: str
    tax_status: str  # "Taxed", "Not Taxed", "SORN"
    tax_due_date: Optional[date] = None

class OwnershipScore(BaseModel):
    """AI-generated ownership assessment"""
    score: int  # 0-100
    summary: str
    what_looks_good: str
    potential_problems: str
    expected_yearly_cost: str
    should_buy_recommendation: str
    verdict: str = "INSPECT"
    maintenance_risk: str = "Medium"
    yearly_cost_estimate: int = 0
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
    ownership_score: OwnershipScore
    data_source: str = "mock"
    warnings: List[str] = Field(default_factory=list)

class SearchQuery(BaseModel):
    """Search request"""
    registration: str
