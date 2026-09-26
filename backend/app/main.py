import os
import sys
import logging

# Ensure backend directory is in sys.path when executed directly as script
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import init_db, get_db
from app import models
from app.routers import customers, calls, stats, websocket
from app.telephony.twilio_service import TwilioService

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("calling_agent.main")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-Powered Outbound Calling Agent backend using FastAPI, Agentic GenAI, Edge TTS & PostgreSQL"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
init_db()

# Include Routers
app.include_router(customers.router)
app.include_router(calls.router)
app.include_router(stats.router)
app.include_router(websocket.router)

# Seed initial data if DB is empty
@app.on_event("startup")
def seed_initial_data_if_empty():
    db = next(get_db())
    try:
        count = db.query(models.Customer).count()
        if count == 0:
            logger.info("Database is empty. Populating seed customers and demo calls...")
            seed_cust = [
                models.Customer(name="Rahul Kumar", phone_number="+919876543210", email="rahul.kumar@grandhotel.com", company_name="Grand Hotel Bangalore", purpose="Product enquiry", product="Commercial RO System", notes="Looking for RO system for hotel project"),
                models.Customer(name="Priya Sharma", phone_number="+919812345678", email="priya@techparkcanteen.in", company_name="Tech Park Canteen", purpose="Price quotation", product="Industrial RO Plant", notes="Needs quotation for 1000 LPH system"),
                models.Customer(name="Amit Patel", phone_number="+919711223344", email="amit@patelfarms.com", company_name="Patel Dairy & Farms", purpose="Technical consultation", product="500 LPH RO Unit", notes="Inquiring about filtration stages"),
                models.Customer(name="Sneha Reddy", phone_number="+919655443322", email="sneha@reddyhospitals.org", company_name="Reddy Hospital Group", purpose="Product enquiry", product="Commercial RO System", notes="Hospital drinking water project"),
                models.Customer(name="Vikram Singh", phone_number="+919544332211", email="vikram@singhmills.co.in", company_name="Singh Textile Mills", purpose="Urgent enquiry", product="High Capacity RO Plant", notes="Industrial wastewater treatment")
            ]
            db.add_all(seed_cust)
            db.commit()
            logger.info("Seed data loaded successfully!")
    except Exception as e:
        logger.warning(f"Seed data loading skipped: {e}")
    finally:
        db.close()

# Telephony Twilio TwiML Endpoint
@app.post("/api/v1/telephony/twiml/{call_id}")
@app.get("/api/v1/telephony/twiml/{call_id}")
def twilio_twiml_webhook(call_id: str):
    twiml_content = TwilioService.generate_twiml_media_stream(call_id)
    return Response(content=twiml_content, media_type="application/xml")

# Telephony Twilio Status Callback
@app.post("/api/v1/telephony/status")
def twilio_status_callback():
    return {"status": "received"}

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "llm_model": settings.LLM_MODEL,
        "tts_voice": settings.DEFAULT_TTS_VOICE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
