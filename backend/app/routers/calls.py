import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.agent.context_manager import get_or_create_context
from app.telephony.twilio_service import TwilioService
from app.agent.summary_generator import SummaryGenerator

router = APIRouter(prefix="/api/v1/calls", tags=["Calls"])

@router.post("/initiate", response_model=schemas.CallInitiateResponse, status_code=201)
def initiate_call(
    payload: schemas.InitiateCallRequest,
    db: Session = Depends(get_db)
):
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    call_id = f"call_{uuid.uuid4().hex[:12]}"
    call_mode = payload.call_mode or "simulated"

    # Create call record in DB
    new_call = models.Call(
        id=call_id,
        customer_id=customer.id,
        phone_number=customer.phone_number,
        direction="OUTBOUND",
        status="INITIATED",
        outcome="PENDING",
        start_time=datetime.now(timezone.utc)
    )
    db.add(new_call)
    db.commit()

    # Initialize agent context
    get_or_create_context(call_id, {
        "id": customer.id,
        "name": customer.name,
        "company_name": customer.company_name or "",
        "phone_number": customer.phone_number,
        "product": customer.product or "Commercial RO System",
        "purpose": customer.purpose or "Product enquiry"
    })

    # Trigger Twilio or Simulated
    telephony_res = TwilioService.initiate_outbound_call(customer.phone_number, call_id)

    ws_url = f"/ws/call/{call_id}"

    return schemas.CallInitiateResponse(
        call_id=call_id,
        customer_id=customer.id,
        customer_name=customer.name,
        phone_number=customer.phone_number,
        status="INITIATED",
        call_mode="simulated" if telephony_res.get("is_simulated") else "twilio",
        websocket_url=ws_url,
        message=f"Outbound call initiated for {customer.name} ({customer.phone_number}). Agent ready."
    )

@router.get("", response_model=List[schemas.CallResponse])
def list_calls(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    outcome: Optional[str] = None,
    lead_status: Optional[str] = None,
    follow_up_required: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Call).options(joinedload(models.Call.customer), joinedload(models.Call.summary))

    if search:
        s = f"%{search}%"
        query = query.join(models.Customer, models.Call.customer_id == models.Customer.id, isouter=True).filter(
            (models.Customer.name.ilike(s)) |
            (models.Call.phone_number.ilike(s)) |
            (models.Call.id.ilike(s))
        )

    if status:
        query = query.filter(models.Call.status == status.upper())

    if outcome:
        query = query.filter(models.Call.outcome == outcome.upper())

    if lead_status or follow_up_required is not None:
        query = query.join(models.CallSummary, models.Call.id == models.CallSummary.call_id, isouter=True)
        if lead_status:
            query = query.filter(models.CallSummary.lead_status == lead_status)
        if follow_up_required is not None:
            query = query.filter(models.CallSummary.follow_up_required == follow_up_required)

    calls = query.order_by(models.Call.start_time.desc()).offset(skip).limit(limit).all()

    # Map customer name to CallResponse
    res = []
    for c in calls:
        c_dict = schemas.CallResponse.model_validate(c).model_dump()
        c_dict["customer_name"] = c.customer.name if c.customer else "Unknown Customer"
        res.append(schemas.CallResponse(**c_dict))

    return res

@router.get("/{call_id}", response_model=schemas.CallDetailResponse)
def get_call_detail(call_id: str, db: Session = Depends(get_db)):
    call = db.query(models.Call).options(
        joinedload(models.Call.customer),
        joinedload(models.Call.transcripts),
        joinedload(models.Call.summary)
    ).filter(models.Call.id == call_id).first()

    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    call_dict = schemas.CallDetailResponse.model_validate(call).model_dump()
    call_dict["customer_name"] = call.customer.name if call.customer else "Unknown Customer"
    return schemas.CallDetailResponse(**call_dict)

@router.post("/{call_id}/end")
async def end_call_manually(call_id: str, db: Session = Depends(get_db)):
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    if call.status not in ["COMPLETED", "FAILED"]:
        call.status = "COMPLETED"
        call.end_time = datetime.now(timezone.utc)
        if call.start_time:
            delta = (call.end_time - call.start_time).total_seconds()
            call.duration_seconds = int(delta)
        db.commit()

    # Generate summary if not generated
    existing_summary = db.query(models.CallSummary).filter(models.CallSummary.call_id == call_id).first()
    if not existing_summary:
        transcripts_db = db.query(models.CallTranscript).filter(models.CallTranscript.call_id == call_id).all()
        transcript_list = [{"speaker": t.speaker, "message": t.message} for t in transcripts_db]
        cust_name = call.customer.name if call.customer else "Customer"
        
        summary_data = await SummaryGenerator.generate_call_summary(cust_name, transcript_list, call.status)

        new_summary = models.CallSummary(
            call_id=call_id,
            customer_name=summary_data.get("customer_name", cust_name),
            requirement=summary_data.get("requirement", "Commercial RO System"),
            capacity=summary_data.get("capacity"),
            location=summary_data.get("location"),
            application=summary_data.get("application"),
            budget=summary_data.get("budget"),
            timeline=summary_data.get("timeline"),
            lead_status=summary_data.get("lead_status", "Warm"),
            follow_up_required=summary_data.get("follow_up_required", True),
            follow_up_notes=summary_data.get("follow_up_notes"),
            key_requirements=summary_data.get("key_requirements"),
            customer_intent=summary_data.get("customer_intent"),
            important_points=summary_data.get("important_points"),
            call_outcome=summary_data.get("call_outcome"),
            summary_text=summary_data.get("summary_text")
        )
        db.add(new_summary)
        
        # Update call outcome
        if summary_data.get("lead_status") in ["Hot", "Warm"]:
            call.outcome = "INTERESTED"
        elif summary_data.get("lead_status") == "Not Interested":
            call.outcome = "NOT_INTERESTED"
        elif summary_data.get("follow_up_required"):
            call.outcome = "FOLLOW_UP_REQUIRED"
        
        db.commit()

    return {"message": "Call ended and summary generated", "call_id": call_id}
