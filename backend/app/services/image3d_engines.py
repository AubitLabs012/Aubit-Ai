"""Engine capabilities and installation checks. Never substitute another engine."""
import json
import os
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2]
ENGINES = {
    "hunyuan-mini": dict(name="Hunyuan3D-2mini", repo="tencent/Hunyuan3D-2mini", revision="f90a0f7df7d5e6f71109cf333f6a95a0ae3194a6", folder="hunyuan3d-dit-v2-mini", weight="model.fp16.safetensors", views=["front"], family="hunyuan2", description="Stability baseline · single image · CPU offload"),
    "hunyuan-mv": dict(name="Hunyuan3D-2mv", repo="tencent/Hunyuan3D-2mv", revision="3a761b539b29fe4ff64714813aa9560fd66f5de0", folder="hunyuan3d-dit-v2-mv", weight="model.fp16.safetensors", views=["front", "left", "back", "right"], family="hunyuan2", description="Native multi-view conditioning · 2–4 labeled angles"),
    "hunyuan-2.1": dict(name="Hunyuan3D-2.1", repo="tencent/Hunyuan3D-2.1", revision="0b94677654c57bb9a6b6845cd7b704ccf551d327", folder="hunyuan3d-dit-v2-1", weight="model.fp16.ckpt", views=["front"], family="hunyuan21", description="Higher-detail shape · experimental on 6 GB GPUs"),
    "stable-fast-3d": dict(name="Stable Fast 3D", repo="stabilityai/stable-fast-3d", revision="f0c9a8ffd62cb1bbc8a7a53c9f87a0be1b6be778", folder="", weight="model.safetensors", views=["front"], family="sf3d", description="Textured mesh + UV · gated weights · Windows experimental"),
}


def runtime_paths():
    runtime = BACKEND / ".venv-image3d"
    return (Path(os.environ.get("AUBIT_IMAGE3D_PYTHON", runtime / ("Scripts/python.exe" if os.name == "nt" else "bin/python"))),
            Path(os.environ.get("AUBIT_IMAGE3D_MODELS", BACKEND / ".models-image3d")))


def engine_status(engine_id):
    spec = ENGINES[engine_id]
    python, models = runtime_paths()
    root = models / engine_id
    required = [root / spec["folder"] / name for name in ("config.yaml", spec["weight"])]
    manifest = root / "installed.json"
    installed = {}
    try:
        installed = json.loads(manifest.read_text())
    except (OSError, ValueError):
        pass
    ready = python.is_file() and all(p.is_file() and p.stat().st_size > 0 for p in required) and installed.get("runtime_verified") is True and installed.get("revision") == spec["revision"]
    message = "Installed locally" if ready else "Installation required"
    status_file = root / "install-status.json"
    try:
        status = json.loads(status_file.read_text())
        if not ready:
            message = status.get("message", message)
    except (OSError, ValueError):
        pass
    return {"id": engine_id, **spec, "available": ready, "message": message,
            "setup_command": f"python backend/scripts/setup_image3d.py --engine {engine_id}"}


def config():
    engines = [engine_status(key) for key in ENGINES]
    return {"available": any(e["available"] for e in engines), "local": True, "engines": engines,
            "max_upload_mb": 10, "max_views": 4, "message": "Local engines · no generation API",
            "default_engine": "hunyuan-mini"}
