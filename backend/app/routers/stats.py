from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard Stats"])

@router.get("/stats", response_model=schemas.DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_calls = db.query(models.Call).count()
    completed_calls = db.query(models.Call).filter(models.Call.status == "COMPLETED").count()
    failed_calls = db.query(models.Call).filter(models.Call.status.in_(["FAILED", "NO_ANSWER", "BUSY"])).count()
    
    interested_leads = db.query(models.Call).filter(models.Call.outcome == "INTERESTED").count()
    
    follow_ups_required = db.query(models.CallSummary).filter(models.CallSummary.follow_up_required == True).count()
    
    avg_duration = db.query(func.avg(models.Call.duration_seconds)).filter(models.Call.status == "COMPLETED").scalar() or 0.0

    return schemas.DashboardStatsResponse(
        total_calls=total_calls,
        completed_calls=completed_calls,
        failed_calls=failed_calls,
        interested_leads=interested_leads,
        follow_ups_required=follow_ups_required,
        avg_call_duration_seconds=round(float(avg_duration), 1)
    )
