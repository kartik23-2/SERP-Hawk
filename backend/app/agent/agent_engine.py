import os
import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.agent.context_manager import CallContextState

logger = logging.getLogger("calling_agent.agent_engine")

# Initialize Gemini Client if API key is present
gemini_client = None
if settings.GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google GenAI Client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Google GenAI Client: {e}")

class AgenticCallingEngine:
    def __init__(self, context: CallContextState):
        self.context = context

    def generate_initial_greeting(self) -> str:
        name = self.context.customer_name
        product = self.context.product
        company = f" at {self.context.company_name}" if self.context.company_name else ""
        
        greeting = (
            f"Hello {name}! This is HawkAI calling from SERP Hawk regarding your recent inquiry for a {product}{company}. "
            f"Is now a good time to speak?"
        )
        self.context.turn_count += 1
        return greeting

    async def process_customer_turn(self, user_text: str) -> Tuple[str, bool]:
        """
        Processes a customer turn using Agentic slot extraction + next dynamic action generation.
        Returns: (ai_response_text, is_call_finished)
        """
        self.context.turn_count += 1
        user_lower = user_text.lower().strip()

        # Check for immediate call termination signals from customer
        if any(word in user_lower for word in ["bye", "hang up", "call later", "wrong number", "not interested", "dont call", "don't call"]):
            if "not interested" in user_lower or "dont call" in user_lower or "don't call" in user_lower:
                self.context.is_finished = True
                return "Understood. Thank you for your time. Have a great day!", True
            self.context.is_finished = True
            return "No problem at all! I will touch base with you later. Thank you and have a good day!", True

        # Extract slots using GenAI or smart regex/rule parser
        extracted_info = await self._extract_slots_genai(user_text)
        self._update_context_slots(extracted_info)

        missing_slots = self.context.get_missing_slots()
        logger.info(f"Call {self.context.call_id} - Collected slots: {self.context.get_summary_dict()} | Missing: {missing_slots}")

        # If all key info (capacity, location, application/budget/timeline) is gathered or turn count >= 6
        if len(missing_slots) == 0 or self.context.turn_count >= 7:
            self.context.is_finished = True
            cap = self.context.capacity or "your required capacity"
            loc = self.context.location or "your location"
            time = self.context.timeline or "soon"
            bud = f" within budget {self.context.budget}" if self.context.budget else ""

            closing_message = (
                f"Perfect! I have noted all your details: a {cap} {self.context.product} for {self.context.application or 'your site'} "
                f"in {loc}{bud} with installation planned {time}. "
                f"Our senior technical engineer will prepare a custom quotation and follow up with you shortly. Thank you!"
            )
            return closing_message, True

        # Generate agentic response using Gemini LLM if client available, else robust rule generator
        if gemini_client:
            try:
                response_text = await self._generate_gemini_agent_response(user_text, missing_slots)
                return response_text, False
            except Exception as e:
                logger.error(f"Gemini API generation failed: {e}. Falling back to rule-based agent.")

        # Agentic fallback prompt engine targeting missing slot
        response_text = self._generate_rule_agent_response(user_text, missing_slots)
        return response_text, False

    async def _extract_slots_genai(self, user_text: str) -> Dict[str, Any]:
        """Extracts key business slots from customer user_text."""
        if gemini_client:
            prompt = f"""
You are an expert NLU slot extractor for a Commercial RO System sales calling agent.
Extract any of the following fields mentioned in the customer's input:
- capacity (e.g., 500 LPH, 1000 LPH, 500 liters per hour, 2000 lph)
- location (e.g., Bangalore, Delhi, Mumbai, Hyderabad, Electronic City)
- application (e.g., Hotel, Hospital, Canteen, Factory, Drinking Water, Kitchen)
- budget (e.g., 1 Lakh, 50,000, 2 Lakhs, 1.5 Lakhs)
- timeline (e.g., 1 month, 2 weeks, immediately, within 30 days)

Customer Input: "{user_text}"

Return strictly a valid JSON object with keys: capacity, location, application, budget, timeline. Use null for missing values.
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
                logger.warning(f"Slot extraction via Gemini error: {e}")

        # Rule-based fallback extraction
        return self._extract_slots_rule(user_text)

    def _extract_slots_rule(self, user_text: str) -> Dict[str, Any]:
        text = user_text.lower()
        extracted = {}

        # Capacity extraction
        import re
        cap_match = re.search(r'(\d+\s*(?:lph|liters?|litres?|liter|litre|l/h))', text)
        if cap_match:
            extracted["capacity"] = cap_match.group(1).upper()
        elif "500" in text:
            extracted["capacity"] = "500 LPH"
        elif "1000" in text or "1k" in text:
            extracted["capacity"] = "1000 LPH"
        elif "2000" in text:
            extracted["capacity"] = "2000 LPH"

        # Location extraction
        for city in ["bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "chennai", "pune", "ahmedabad", "kolkata"]:
            if city in text:
                extracted["location"] = city.capitalize()

        # Application extraction
        if any(w in text for w in ["hotel", "restaurant", "resort"]):
            extracted["application"] = "Hotel"
        elif any(w in text for w in ["hospital", "clinic"]):
            extracted["application"] = "Hospital"
        elif any(w in text for w in ["canteen", "cafeteria", "mess"]):
            extracted["application"] = "Commercial Canteen"
        elif any(w in text for w in ["factory", "plant", "industrial"]):
            extracted["application"] = "Factory / Industrial"
        elif any(w in text for w in ["drinking", "guest", "kitchen"]):
            extracted["application"] = "Drinking Water & Kitchen"

        # Budget extraction
        bud_match = re.search(r'(\d+\s*(?:lakh|lakhs|k|thousand|rupees|rs|₹))', text)
        if bud_match:
            extracted["budget"] = f"₹{bud_match.group(1)}"
        elif "1 lakh" in text or "1,00,000" in text:
            extracted["budget"] = "₹1,00,000"
        elif "2 lakh" in text:
            extracted["budget"] = "₹2,00,000"

        # Timeline extraction
        if any(w in text for w in ["1 month", "one month", "30 days"]):
            extracted["timeline"] = "Within 1 month"
        elif any(w in text for w in ["2 weeks", "two weeks", "15 days", "urgent", "immediately"]):
            extracted["timeline"] = "Within 2 weeks"

        return extracted

    def _update_context_slots(self, extracted: Dict[str, Any]):
        for key in ["capacity", "location", "application", "budget", "timeline"]:
            val = extracted.get(key)
            if val and not getattr(self.context, key):
                setattr(self.context, key, str(val))

    async def _generate_gemini_agent_response(self, user_text: str, missing_slots: list[str]) -> str:
        current_state = self.context.get_summary_dict()
        prompt = f"""
You are HawkAI, a professional sales calling agent for SERP Hawk selling Commercial RO Systems.
You are talking to customer: {self.context.customer_name}.
Current call collected state: {json.dumps(current_state)}
Missing information to collect: {missing_slots}

Customer just said: "{user_text}"

Goal:
1. Acknowledge what the customer just said naturally.
2. If the customer asked a technical question (warranty, price, maintenance), answer briefly (1-2 sentences).
3. Smoothly ask for ONE missing piece of information from {missing_slots}.
4. Keep the response spoken, conversational, concise (max 2-3 sentences), and friendly.
5. Do NOT ask for information that is already collected!
"""
        res = gemini_client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=prompt
        )
        return res.text.strip()

    def _generate_rule_agent_response(self, user_text: str, missing_slots: list[str]) -> str:
        next_missing = missing_slots[0] if missing_slots else "timeline"

        if next_missing == "capacity":
            return "I understand. To suggest the right Commercial RO model, approximately how many litres per hour (LPH) of water capacity do you require?"
        elif next_missing == "location":
            if self.context.capacity:
                return f"Great, a {self.context.capacity} system! Which city or area will this RO system be installed in?"
            return "Got it! Which city will the system be installed in?"
        elif next_missing == "application":
            return "Understood. Is the system intended primarily for drinking water, commercial kitchen use, or boiler feed?"
        elif next_missing == "budget":
            return "Got it. Do you have a targeted budget range in mind for this installation?"
        elif next_missing == "timeline":
            return "Thanks! What is your target purchase timeline for finalizing the installation?"
        
        return "Thank you for sharing that. Is there any specific technical requirement or customization you need?"
