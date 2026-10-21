from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


class ApiResponse(BaseModel):
    success: bool = True
    message: str
    data: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LoginRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=120)
    email: str | None = Field(default=None, min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="user", pattern="^(admin|user)$")

    @model_validator(mode="after")
    def validate_identifier(self) -> "LoginRequest":
        username = (self.username or "").strip()
        email = str(self.email or "").strip().lower()
        if not username and not email:
            raise ValueError("Either username or email is required")
        self.username = username or None
        self.email = email or None
        return self

    @property
    def identifier(self) -> str:
        return str(self.email or self.username or "").strip().lower()


class SignupRequest(LoginRequest):
    display_name: str = Field(min_length=1, max_length=80)


class TokenPayload(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict[str, Any]


class AIResponseRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    use_voice: bool = False
    context: dict[str, Any] = Field(default_factory=dict)


class TextTo3DRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=800)


class GameActionRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    game_type: str = Field(min_length=1, max_length=64)
    result: str = Field(pattern="^(win|lose|draw)$")
    score: int = Field(ge=0, le=1_000_000)


class UploadAssetRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=256)
    content_type: str = Field(min_length=1, max_length=128)


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
