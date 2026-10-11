from fastapi import APIRouter

from app.api.schemas import ApiResponse
from app.config import get_settings
from app.integrations.ai_clients import OpenAIClient, SpeechToTextClient, VoiceClient


router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=ApiResponse)
def healthcheck() -> ApiResponse:
    settings = get_settings()
    ai_status = OpenAIClient().describe_status()
    stt_status = SpeechToTextClient().describe_status()
    tts_status = VoiceClient().describe_status()
    return ApiResponse(
        message="Service healthy",
        data={
            "status": "ok",
            "environment": settings.environment,
            "api_prefix": settings.api_prefix,
            "ai": ai_status,
            "stt": stt_status,
            "tts": tts_status,
        },
    )
