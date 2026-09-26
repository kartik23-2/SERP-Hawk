import io
import base64
import logging
import edge_tts
from app.config import settings

logger = logging.getLogger("calling_agent.tts_service")

class TTSService:
    @staticmethod
    async def text_to_speech_bytes(text: str, voice: str = None) -> bytes:
        """
        Converts text to MP3 audio bytes using edge-tts.
        """
        selected_voice = voice or settings.DEFAULT_TTS_VOICE
        try:
            communicate = edge_tts.Communicate(text, selected_voice)
            audio_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])
            return audio_buffer.getvalue()
        except Exception as e:
            logger.error(f"Error generating TTS with edge-tts ({selected_voice}): {e}")
            raise e

    @staticmethod
    async def text_to_speech_base64(text: str, voice: str = None) -> str:
        """
        Converts text to base64 encoded data URI string (data:audio/mp3;base64,...)
        """
        audio_bytes = await TTSService.text_to_speech_bytes(text, voice)
        b64_str = base64.b64encode(audio_bytes).decode('utf-8')
        return f"data:audio/mp3;base64,{b64_str}"
