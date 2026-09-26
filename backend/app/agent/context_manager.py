from typing import Dict, Any, Optional
from pydantic import BaseModel

class CallContextState(BaseModel):
    call_id: str
    customer_id: Optional[int] = None
    customer_name: str = ""
    company_name: str = ""
    phone_number: str = ""
    product: str = "Commercial RO System"
    purpose: str = "Product enquiry"
    
    # Tracked Conversation Slots
    requirement: Optional[str] = None # Commercial RO System / Industrial RO
    capacity: Optional[str] = None    # e.g., 500 LPH, 1000 LPH
    location: Optional[str] = None    # e.g., Bangalore, Delhi
    application: Optional[str] = None # e.g., Hotel, Hospital, Canteen, Factory
    budget: Optional[str] = None      # e.g., 1 Lakh, 2.5 Lakhs
    timeline: Optional[str] = None    # e.g., 1 month, 2 weeks
    
    # State flags
    is_finished: bool = False
    turn_count: int = 0
    current_asking_slot: Optional[str] = None

    def get_missing_slots(self) -> list[str]:
        missing = []
        if not self.capacity:
            missing.append("capacity")
        if not self.location:
            missing.append("location")
        if not self.application:
            missing.append("application")
        if not self.budget:
            missing.append("budget")
        if not self.timeline:
            missing.append("timeline")
        return missing

    def get_summary_dict(self) -> Dict[str, Any]:
        return {
            "customer_name": self.customer_name,
            "company_name": self.company_name,
            "product": self.product,
            "requirement": self.requirement or self.product,
            "capacity": self.capacity,
            "location": self.location,
            "application": self.application,
            "budget": self.budget,
            "timeline": self.timeline,
            "missing_slots": self.get_missing_slots()
        }

# Global in-memory context registry for active calls
active_call_contexts: Dict[str, CallContextState] = {}

def get_or_create_context(call_id: str, customer_data: Optional[Dict[str, Any]] = None) -> CallContextState:
    if call_id in active_call_contexts:
        return active_call_contexts[call_id]
    
    cdata = customer_data or {}
    ctx = CallContextState(
        call_id=call_id,
        customer_id=cdata.get("id"),
        customer_name=cdata.get("name", "Customer"),
        company_name=cdata.get("company_name", ""),
        phone_number=cdata.get("phone_number", ""),
        product=cdata.get("product", "Commercial RO System"),
        purpose=cdata.get("purpose", "Product enquiry"),
        requirement=cdata.get("product", "Commercial RO System")
    )
    active_call_contexts[call_id] = ctx
    return ctx

def remove_context(call_id: str):
    active_call_contexts.pop(call_id, None)
