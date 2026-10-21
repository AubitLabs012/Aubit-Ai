from functools import lru_cache
import os
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()


class Settings:
    app_name = "Aubit Backend"
    api_prefix = "/api"
    environment = os.getenv("ENVIRONMENT", "development")
    debug = os.getenv("DEBUG", "true").lower() == "true"

    jwt_secret = os.getenv("JWT_SECRET", "change-me-in-production")
    jwt_issuer = os.getenv("JWT_ISSUER", "aubit-backend")
    jwt_audience = os.getenv("JWT_AUDIENCE", "aubit-clients")
    jwt_expiry_minutes = int(os.getenv("JWT_EXPIRY_MINUTES", "43200")) # 30 days for local studio

    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:4173,http://127.0.0.1:4173,http://localhost:3000,http://127.0.0.1:3000,null,file://",
        ).split(",")
        if origin.strip()
    ]
    allowed_origin_regex = os.getenv(
        "ALLOWED_ORIGIN_REGEX",
        r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$|^null$",
    )

    mongo_uri = os.getenv("MONGODB_URI", "")
    mongo_database = os.getenv("MONGODB_DATABASE", "aubit")
    redis_url = os.getenv("REDIS_URL", "")

    firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    ai_provider = os.getenv("AI_PROVIDER", "gemini")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_stt_model = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
    groq_tts_model = os.getenv("GROQ_TTS_MODEL", "canopylabs/orpheus-v1-english")
    groq_tts_voice = os.getenv("GROQ_TTS_VOICE", "troy")
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY", "")
    stripe_api_key = os.getenv("STRIPE_API_KEY", "")
    gcp_storage_bucket = os.getenv("GCP_STORAGE_BUCKET", "")
    gcp_credentials_path = os.getenv("GCP_CREDENTIALS_PATH", "")
    sentry_dsn = os.getenv("SENTRY_DSN", "")

    rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
    rate_limit_window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
