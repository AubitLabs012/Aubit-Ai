from datetime import datetime
from uuid import uuid4

from fastapi import UploadFile

from app.api.schemas import AIResponseRequest
from app.cache.redis_cache import CacheService
from app.db.repositories import AIResponseRepository
from app.integrations.ai_clients import OpenAIClient, SpeechToTextClient, VoiceClient


class AIService:
    def __init__(self) -> None:
        self.cache = CacheService()
        self.repository = AIResponseRepository()
        self.openai_client = OpenAIClient()
        self.voice_client = VoiceClient()
        self.speech_client = SpeechToTextClient()

    def process_prompt(self, user: dict, payload: AIResponseRequest) -> dict:
        cache_key = f"ai:{user['id']}:{payload.prompt.strip().lower()}"
        cached = self.cache.get(cache_key)
        if cached:
            voice_preview = self.voice_client.synthesize_preview(cached, payload.context) if payload.use_voice else None
            return {"response": cached, "voice_preview": voice_preview, "cached": True}

        text_response = self.openai_client.generate_response(payload.prompt, payload.context)
        voice_preview = self.voice_client.synthesize_preview(text_response, payload.context) if payload.use_voice else None

        result = {
            "request_id": str(uuid4()),
            "response": text_response,
            "voice_preview": voice_preview,
            "cached": False,
            "generated_at": datetime.utcnow().isoformat(),
        }
        self.repository.save(result["request_id"], {"user_id": user["id"], **result})
        self.cache.set(cache_key, text_response, ttl_seconds=120)
        return result

    async def transcribe_audio(self, user: dict, audio_file: UploadFile) -> dict:
        audio_bytes = await audio_file.read()
        transcript_data = self.speech_client.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=audio_file.filename or "shell-command.webm",
            content_type=audio_file.content_type or "audio/webm",
        )

        result = {
            "request_id": str(uuid4()),
            "transcript": transcript_data["transcript"],
            "provider": transcript_data["provider"],
            "model": transcript_data["model"],
            "content_type": audio_file.content_type or "audio/webm",
            "generated_at": datetime.utcnow().isoformat(),
        }
        if transcript_data.get("duration") is not None:
            result["duration"] = transcript_data["duration"]
        if transcript_data.get("language"):
            result["language"] = transcript_data["language"]

        self.repository.save(result["request_id"], {"user_id": user["id"], **result})
        return result
