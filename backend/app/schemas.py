from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str = Field(..., example="Rahul Kumar")
    phone_number: str = Field(..., example="+919876543210")
    email: Optional[str] = Field(None, example="rahul.kumar@grandhotel.com")
    company_name: Optional[str] = Field(None, example="Grand Hotel Bangalore")
    purpose: str = Field("Product enquiry", example="Product enquiry")
    product: str = Field("Commercial RO System", example="Commercial RO System")
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- CALL SCHEMAS ---
class InitiateCallRequest(BaseModel):
    customer_id: int
    call_mode: Optional[str] = Field("simulated", example="simulated or twilio")  # "simulated" or "twilio"

class CallInitiateResponse(BaseModel):
    call_id: str
    customer_id: int
    customer_name: str
    phone_number: str
    status: str
    call_mode: str
    websocket_url: str
    message: str

class CallTranscriptBase(BaseModel):
    speaker: str # 'AI', 'CUSTOMER', 'SYSTEM'
    message: str
    confidence: Optional[float] = 1.0
    timestamp: Optional[datetime] = None

class CallTranscriptCreate(CallTranscriptBase):
    pass

class CallTranscriptResponse(CallTranscriptBase):
    id: int
    call_id: str

    class Config:
        from_attributes = True

class CallSummaryResponse(BaseModel):
    id: int
    call_id: str
    customer_name: Optional[str] = None
    requirement: Optional[str] = None
    capacity: Optional[str] = None
    location: Optional[str] = None
    application: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    lead_status: Optional[str] = "Warm"
    follow_up_required: Optional[bool] = False
    follow_up_notes: Optional[str] = None
    key_requirements: Optional[str] = None
    customer_intent: Optional[str] = None
    important_points: Optional[str] = None
    call_outcome: Optional[str] = None
    summary_text: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CallResponse(BaseModel):
    id: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    phone_number: str
    direction: str
    status: str
    outcome: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: int = 0
    failure_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CallDetailResponse(CallResponse):
    customer: Optional[CustomerResponse] = None
    transcripts: List[CallTranscriptResponse] = []
    summary: Optional[CallSummaryResponse] = None

# --- DASHBOARD STATS SCHEMA ---
class DashboardStatsResponse(BaseModel):
    total_calls: int
    completed_calls: int
    failed_calls: int
    interested_leads: int
    follow_ups_required: int
    avg_call_duration_seconds: float

# --- SIMULATED CALL INTERACTION ---
class UserAudioOrTextPayload(BaseModel):
    call_id: str
    user_text: Optional[str] = None
    audio_base64: Optional[str] = None
