from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AddressInput(BaseModel):
    house_no: str
    street: str
    locality: str
    city: str
    district: str
    state: str
    pin: str
    digipin: str


class ConsentInput(BaseModel):
    purpose: str
    validity_days: int = 365


class ValidationRequestInput(BaseModel):
    user_id: str
    address: AddressInput
    consent: ConsentInput


class EvidenceComponent(BaseModel):
    type: str  # geo, temporal, iot, doc, crowd, history, geo_precision, linguistic, etc.
    score: float
    weight: float
    details: Dict[str, Any]


class FraudRiskAssessment(BaseModel):
    risk_percentage: float
    risk_level: str  # low/medium/high
    suspicious_patterns: List[str]
    velocity_score: float


class CategoryComparison(BaseModel):
    category: str
    average_acs: float
    difference: float
    percentile: int


class ValidationResultOutput(BaseModel):
    request_id: str
    acs: float
    vl: str
    reason_codes: List[str]
    suggestions: List[str]
    evidence: List[EvidenceComponent]
    token_available: bool = False
    token_id: Optional[int] = None
    # NEW: Advanced metrics
    fraud_risk: Optional[FraudRiskAssessment] = None
    position_confidence_meters: Optional[int] = None
    escalation_path: Optional[str] = None
    address_fingerprint: Optional[str] = None
    category_avg_comparison: Optional[CategoryComparison] = None


class AdminConfirmInput(BaseModel):
    request_id: str
    admin_id: str
    mark_vl: Optional[str] = None
    notes: str = ""
    postman_confirmed: bool = False


class TokenOutput(BaseModel):
    token_id: int
    jwt: str
    qr_data: str
    issued_at: datetime
    expires_at: datetime


class ValidationHistoryItem(BaseModel):
    request_id: str
    address: AddressInput
    acs: float
    vl: str
    created_at: datetime
    token_available: bool


class DashboardKPI(BaseModel):
    total_validations: int
    pending_validations: int
    avg_acs: float
    vl_distribution: Dict[str, int]
    recent_validations: int


class QueueItem(BaseModel):
    request_id: str
    address: str
    status: str
    acs: Optional[float]
    vl: Optional[str]
    created_at: datetime
