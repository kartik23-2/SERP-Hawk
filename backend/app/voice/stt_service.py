import base64
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("calling_agent.stt_service")

gemini_client = None
if settings.GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize GenAI STT: {e}")

class STTService:
    @staticmethod
    async def transcribe_audio_payload(text_input: Optional[str] = None, audio_base64: Optional[str] = None) -> str:
        """
        Transcribes incoming user voice audio or receives real-time speech transcript.
        If audio_base64 is sent, uses Gemini Multimodal STT audio transcription.
        """
        if text_input and text_input.strip():
            return text_input.strip()

        if audio_base64 and gemini_client:
            try:
                # Remove data URI header if present
                clean_b64 = audio_base64
                if "base64," in clean_b64:
                    clean_b64 = clean_b64.split("base64,")[1]
                
                audio_bytes = base64.b64decode(clean_b64)
                
                # Gemini Audio Transcription Prompt
                response = gemini_client.models.generate_content(
                    model=settings.LLM_MODEL,
                    contents=[
                        "Transcribe the customer's spoken voice audio accurately into English text. Return ONLY the transcribed text.",
                        genai.types.Part.from_bytes(data=audio_bytes, mime_type="audio/webm")
                    ]
                )
                transcription = response.text.strip()
                logger.info(f"GenAI Audio Transcription Result: '{transcription}'")
                return transcription
            except Exception as e:
                logger.error(f"GenAI STT transcription error: {e}")

        return text_input.strip() if text_input else ""
