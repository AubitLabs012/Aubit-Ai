import hashlib
import hmac
import time
from uuid import uuid4

from pydantic import BaseModel

from app.auth.jwt import decode_jwt, encode_jwt
from app.config import get_settings
from app.db.repositories import UserRepository


class TokenBundle(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.user_repository = UserRepository()

    def signup(self, identifier: str, password: str, role: str, display_name: str) -> TokenBundle:
        normalized_identifier = identifier.strip().lower()
        existing_user = self.user_repository.get_by_username(normalized_identifier)
        if existing_user is not None:
            if self._verify_password(password, existing_user.get("password_hash", "")):
                return self._issue_token(existing_user)
            raise ValueError("An account with this email/username already exists. Please sign in or check your password.")

        user_id = self._build_user_id(normalized_identifier)
        self.user_repository.create(
            {
                "id": user_id,
                "username": normalized_identifier,
                "role": role,
                "display_name": display_name,
                "password_hash": self._hash_password(password),
            }
        )
        return self._issue_token(
            {
                "id": user_id,
                "username": normalized_identifier,
                "role": role,
                "display_name": display_name,
            }
        )

    def login(self, identifier: str, password: str, role: str) -> TokenBundle:
        normalized_identifier = identifier.strip().lower()
        user = self.user_repository.get_by_username(normalized_identifier)
        if user is None:
            display_name = normalized_identifier.split("@")[0].replace(".", " ").replace("_", " ").title() or "User"
            return self.signup(normalized_identifier, password, role, display_name)
        if user.get("role") != role:
            user["role"] = role
            self.user_repository.create(user)
        if not self._verify_password(password, user.get("password_hash", "")):
            raise ValueError("Invalid password. Please check your password and try again.")
        return self._issue_token(user)

    def _issue_token(self, user: dict) -> TokenBundle:
        now = int(time.time())
        payload = {
            "sub": user["id"],
            "username": user["username"],
            "role": user["role"],
            "iat": now,
            "exp": now + (self.settings.jwt_expiry_minutes * 60),
            "iss": self.settings.jwt_issuer,
            "aud": self.settings.jwt_audience,
            "jti": str(uuid4()),
        }
        access_token = encode_jwt(payload)
        return TokenBundle(
            access_token=access_token,
            expires_in=self.settings.jwt_expiry_minutes * 60,
            user={
                "id": user["id"],
                "username": user["username"],
                "role": user["role"],
                "display_name": user.get("display_name", ""),
            },
        )

    def verify_access_token(self, token: str) -> dict:
        payload = decode_jwt(token)
        return {
            "id": payload["sub"],
            "username": payload["username"],
            "role": payload.get("role", "user"),
        }

    def _build_user_id(self, username: str) -> str:
        return hashlib.sha1(username.lower().encode("utf-8")).hexdigest()[:16]

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(f"{self.settings.jwt_secret}:{password}".encode("utf-8")).hexdigest()

    def _verify_password(self, password: str, stored_hash: str) -> bool:
        if not stored_hash:
            return False
        return hmac.compare_digest(self._hash_password(password), stored_hash)
