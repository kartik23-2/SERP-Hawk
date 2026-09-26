import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Two-Way Calling Agent"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/calling_agent"
    USE_SQLITE_FALLBACK: bool = True
    SQLITE_URL: str = "sqlite:///./calling_agent.db"
    
    # AI / LLM
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    LLM_MODEL: str = "gemini-2.5-flash"
    
    # Telephony (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER", "")
    SERVER_PUBLIC_URL: str = os.getenv("SERVER_PUBLIC_URL", "http://localhost:8000")
    
    # Voice TTS / STT
    DEFAULT_TTS_VOICE: str = "en-IN-PrabhatNeural" # High quality Indian English voice
    DEFAULT_STT_LANGUAGE: str = "en-IN"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
