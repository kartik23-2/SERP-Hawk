import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("calling_agent.twilio_service")

twilio_client = None
if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client
        twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        logger.info("Twilio Client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Twilio Client: {e}")

class TwilioService:
    @staticmethod
    def initiate_outbound_call(to_phone: str, call_id: str) -> Dict[str, Any]:
        """
        Initiates an outbound phone call via Twilio REST API if credentials exist.
        If using free/trial mode or unconfigured SID, returns simulation metadata.
        """
        public_url = settings.SERVER_PUBLIC_URL.rstrip('/')
        twiml_url = f"{public_url}/api/v1/telephony/twiml/{call_id}"
        status_callback = f"{public_url}/api/v1/telephony/status"

        if twilio_client and settings.TWILIO_PHONE_NUMBER:
            try:
                call = twilio_client.calls.create(
                    to=to_phone,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    url=twiml_url,
                    status_callback=status_callback,
                    status_callback_event=['initiated', 'ringing', 'answered', 'completed']
                )
                logger.info(f"Twilio call dispatched successfully: Call SID {call.sid}")
                return {
                    "call_sid": call.sid,
                    "status": call.status,
                    "is_simulated": False
                }
            except Exception as e:
                logger.error(f"Error making Twilio call to {to_phone}: {e}")
                return {
                    "call_sid": f"sim_{call_id}",
                    "status": "INITIATED",
                    "error": str(e),
                    "is_simulated": True
                }

        logger.info(f"Initiating call {call_id} in Interactive Simulated/Browser mode.")
        return {
            "call_sid": f"sim_{call_id}",
            "status": "INITIATED",
            "is_simulated": True
        }

    @staticmethod
    def generate_twiml_media_stream(call_id: str) -> str:
        """
        Generates Twilio TwiML XML to establish WebSocket stream connection.
        """
        public_url = settings.SERVER_PUBLIC_URL.replace("http://", "").replace("https://", "").rstrip('/')
        ws_url = f"wss://{public_url}/ws/call/{call_id}"

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Connecting to Hawk AI Calling Agent. Please wait.</Say>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
</Response>"""
        return twiml
