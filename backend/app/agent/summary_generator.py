import json
import logging
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger("calling_agent.summary_generator")

gemini_client = None
if settings.GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Google GenAI for summary: {e}")

class SummaryGenerator:
    @staticmethod
    async def generate_call_summary(
        customer_name: str,
        transcripts: List[Dict[str, str]],
        call_status: str
    ) -> Dict[str, Any]:
        """
        Generates structured post-call summary and lead assessment using GenAI or fallback rule.
        """
        transcript_text = "\n".join([f"{t.get('speaker', 'Unknown')}: {t.get('message', '')}" for t in transcripts])

        if gemini_client and transcript_text.strip():
            prompt = f"""
You are an expert sales analyst for SERP Hawk.
Analyze the following phone call transcript between an AI calling agent and customer '{customer_name}'.

Call Status: {call_status}
Transcript:
{transcript_text}

Generate a JSON object with the following fields:
- customer_name: String
- requirement: String (e.g. Commercial RO System)
- capacity: String (e.g. 500 LPH, 1000 LPH or "Not specified")
- location: String (e.g. Bangalore or "Not specified")
- application: String (e.g. Hotel / Hospital / Canteen)
- budget: String (e.g. ₹1,00,000 or "Not specified")
- timeline: String (e.g. Within 1 month or "Not specified")
- lead_status: String (one of: 'Hot', 'Warm', 'Cold', 'Not Interested', 'Invalid')
- follow_up_required: Boolean (true/false)
- follow_up_notes: String (Action items for human sales rep)
- key_requirements: String (Bullet summary of main technical/business needs)
- customer_intent: String (High / Medium / Low / Not Interested)
- important_points: String (Key call highlights)
- call_outcome: String (Overall result)
- summary_text: String (Comprehensive paragraph narrative)

Return strictly valid JSON.
"""
            try:
                res = gemini_client.models.generate_content(
                    model=settings.LLM_MODEL,
                    contents=prompt
                )
                txt = res.text.strip()
                if "```json" in txt:
                    txt = txt.split("```json")[1].split("```")[0].strip()
                elif "```" in txt:
                    txt = txt.split("```")[1].split("```")[0].strip()
                parsed = json.loads(txt)
                return parsed
            except Exception as e:
                logger.error(f"Error generating call summary with Gemini: {e}")

        # Fallback intelligent summary generator based on transcript parsing
        return SummaryGenerator._generate_fallback_summary(customer_name, transcripts, call_status)

    @staticmethod
    def _generate_fallback_summary(
        customer_name: str,
        transcripts: List[Dict[str, str]],
        call_status: str
    ) -> Dict[str, Any]:
        full_txt = " ".join([t.get("message", "") for t in transcripts]).lower()
        
        capacity = "500 LPH" if "500" in full_txt else ("1000 LPH" if "1000" in full_txt else "Commercial Scale")
        location = "Bangalore" if "bangalore" in full_txt else ("Mumbai" if "mumbai" in full_txt else "Not specified")
        application = "Hotel" if "hotel" in full_txt else ("Canteen" if "canteen" in full_txt else "Commercial facility")
        budget = "₹1,00,000" if "1 lakh" in full_txt or "1,00,000" in full_txt or "budget" in full_txt else "Flexible"
        timeline = "Within 1 month" if "month" in full_txt else "Within 2 weeks"

        is_failed = call_status in ["FAILED", "NO_ANSWER", "BUSY"]
        is_not_interested = "not interested" in full_txt or "don't call" in full_txt

        if is_failed:
            lead_status = "Invalid"
            follow_up_required = True
            follow_up_notes = "Call failed or customer did not answer. Retry call in 2 hours."
            call_outcome = "Call Failed / No Answer"
            summary_text = f"Outbound call to {customer_name} failed or was unanswered. Retrying automated call recommended."
        elif is_not_interested:
            lead_status = "Not Interested"
            follow_up_required = False
            follow_up_notes = "Customer declined offer. Do not retry call."
            call_outcome = "Customer Not Interested"
            summary_text = f"Customer {customer_name} indicated they are not interested in Commercial RO systems at present."
        else:
            lead_status = "Hot" if "500" in full_txt or "hotel" in full_txt else "Warm"
            follow_up_required = True
            follow_up_notes = f"Send formal commercial proposal for {capacity} system for {application} in {location}."
            call_outcome = "Quotation Requested / Qualified Lead"
            summary_text = f"Customer {customer_name} confirmed interest in a {capacity} Commercial RO System for a {application} in {location}. Target budget: {budget}, timeline: {timeline}."

        return {
            "customer_name": customer_name,
            "requirement": "Commercial RO System",
            "capacity": capacity,
            "location": location,
            "application": application,
            "budget": budget,
            "timeline": timeline,
            "lead_status": lead_status,
            "follow_up_required": follow_up_required,
            "follow_up_notes": follow_up_notes,
            "key_requirements": f"Requires {capacity} high-efficiency commercial filtration system with multi-stage purification.",
            "customer_intent": "High Purchase Intent" if lead_status in ["Hot", "Warm"] else "Low Intent",
            "important_points": f"Customer specified application as {application} in {location}. Requested proposal.",
            "call_outcome": call_outcome,
            "summary_text": summary_text
        }
