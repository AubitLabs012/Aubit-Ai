from pathlib import Path
from uuid import uuid4

from app.config import get_settings


class FileStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_upload_target(self, filename: str, content_type: str) -> dict:
        if self.settings.gcp_storage_bucket:
            return {
                "provider": "gcp-storage",
                "bucket": self.settings.gcp_storage_bucket,
                "object_name": f"uploads/{uuid4()}-{filename}",
                "content_type": content_type,
                "message": "Generate a signed upload URL here once GCP credentials are configured.",
            }

        local_dir = Path("backend/storage/uploads")
        local_dir.mkdir(parents=True, exist_ok=True)
        return {
            "provider": "local",
            "path": str(local_dir / f"{uuid4()}-{filename}"),
            "content_type": content_type,
        }
