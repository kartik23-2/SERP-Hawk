from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    purpose = Column(String(255), default="Product enquiry")
    product = Column(String(255), default="Commercial RO System")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    calls = relationship("Call", back_populates="customer", cascade="all, delete-orphan")

class Call(Base):
    __tablename__ = "calls"

    id = Column(String(100), primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    phone_number = Column(String(50), nullable=False)
    direction = Column(String(20), default="OUTBOUND")
    status = Column(String(50), default="INITIATED", index=True)  # INITIATED, RINGING, IN_PROGRESS, COMPLETED, FAILED, NO_ANSWER, DISCONNECTED, BUSY
    outcome = Column(String(50), default="PENDING", index=True)   # INTERESTED, NOT_INTERESTED, FOLLOW_UP_REQUIRED, FAILED, INCOMPLETE
    start_time = Column(DateTime(timezone=True), default=utc_now, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)
    failure_reason = Column(Text, nullable=True)
    recording_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    customer = relationship("Customer", back_populates="calls")
    transcripts = relationship("CallTranscript", back_populates="call", cascade="all, delete-orphan", order_by="CallTranscript.timestamp")
    summary = relationship("CallSummary", back_populates="call", uselist=False, cascade="all, delete-orphan")

class CallTranscript(Base):
    __tablename__ = "call_transcripts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    call_id = Column(String(100), ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker = Column(String(20), nullable=False)  # 'AI', 'CUSTOMER', 'SYSTEM'
    message = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    call = relationship("Call", back_populates="transcripts")

class CallSummary(Base):
    __tablename__ = "call_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    call_id = Column(String(100), ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False)
    customer_name = Column(String(255), nullable=True)
    requirement = Column(String(255), nullable=True)
    capacity = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    application = Column(String(255), nullable=True)
    budget = Column(String(100), nullable=True)
    timeline = Column(String(100), nullable=True)
    lead_status = Column(String(50), default="Warm", index=True) # Hot, Warm, Cold, Not Interested, Invalid
    follow_up_required = Column(Boolean, default=False, index=True)
    follow_up_notes = Column(Text, nullable=True)
    key_requirements = Column(Text, nullable=True)
    customer_intent = Column(Text, nullable=True)
    important_points = Column(Text, nullable=True)
    call_outcome = Column(Text, nullable=True)
    summary_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    call = relationship("Call", back_populates="summary")
