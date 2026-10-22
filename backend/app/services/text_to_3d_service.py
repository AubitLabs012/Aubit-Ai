"""Persist Aubit's locally generated 3D models."""

from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException

from app.services.local_3d import generate_model


def model_output_dir() -> Path:
    override = os.getenv("AUBIT_3D_OUTPUT_DIR")
    if override:
        return Path(override).expanduser().resolve()
    if os.name == "nt":
        return Path(os.getenv("LOCALAPPDATA", str(Path.home()))) / "Aubit Desktop" / "models"
    return Path.home() / ".local" / "share" / "aubit" / "models"


class TextTo3DService:
    def list_models(self) -> list[dict]:
        directory = model_output_dir()
        if not directory.exists():
            return []
        results = []
        for path in sorted(directory.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
            if not re.fullmatch(r"[0-9a-f]{32}", path.stem):
                continue
            try:
                model = json.loads(path.read_text(encoding="utf-8"))
                if model.get("id") == path.stem and (directory / f"{path.stem}.glb").is_file():
                    results.append(model)
            except (OSError, ValueError, AttributeError):
                continue
        return results

    def create_model(self, prompt: str) -> dict:
        design, glb, stl, triangles = generate_model(prompt)
        return self.save_model(glb, stl, {
            "source": "text",
            "prompt": design.prompt,
            "interpreted_as": design.interpretation,
            "supported": design.kind != "abstract",
            "triangle_count": triangles,
        })

    def save_model(self, glb: bytes, stl: bytes, metadata: dict, task_id: str | None = None) -> dict:
        task_id = task_id or uuid4().hex
        directory = model_output_dir()
        directory.mkdir(parents=True, exist_ok=True)
        (directory / f"{task_id}.glb").write_bytes(glb)
        (directory / f"{task_id}.stl").write_bytes(stl)
        result = {
            "id": task_id,
            "stage": "complete",
            "status": "SUCCEEDED",
            "progress": 100,
            **metadata,
        }
        (directory / f"{task_id}.json").write_text(json.dumps(result), encoding="utf-8")
        return result

    def get_model(self, task_id: str) -> dict:
        path = model_output_dir() / f"{task_id}.json"
        if not path.is_file():
            raise HTTPException(status_code=404, detail="This 3D model was not found.")
        return json.loads(path.read_text(encoding="utf-8"))

    def get_file(self, task_id: str, extension: str) -> Path:
        path = model_output_dir() / f"{task_id}.{extension}"
        if not path.is_file():
            raise HTTPException(status_code=404, detail="This 3D model file was not found.")
        return path

    def delete_model(self, task_id: str) -> bool:
        directory = model_output_dir()
        found = False
        for f in directory.glob(f"{task_id}*"):
            try:
                if f.is_file():
                    f.unlink()
                    found = True
            except Exception:
                pass
        job_dir = directory / "image-jobs" / task_id
        if job_dir.exists() and job_dir.is_dir():
            try:
                shutil.rmtree(job_dir, ignore_errors=True)
                found = True
            except Exception:
                pass
        return found
