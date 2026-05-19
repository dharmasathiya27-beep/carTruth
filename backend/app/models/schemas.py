from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class MOTRecord(BaseModel):
    """MOT test result"""
    test_date: date
    result: str  # "PASSED", "FAILED"
    mileage: Optional[int] = None
    defects: List[str] = []

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

class VehicleReport(BaseModel):
    """Complete vehicle report response"""
    vehicle: VehicleDetails
    current_mot_status: str  # "Valid", "Expired", "Due Soon"
    mot_valid_until: Optional[date] = None
    mot_history: List[MOTRecord] = []
    mileage_history: List[MileageRecord] = []
    ownership_score: OwnershipScore

class SearchQuery(BaseModel):
    """Search request"""
    registration: str
