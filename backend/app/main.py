from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import ai, assets, auth, game, health, text_to_3d, image_to_3d
from app.config import get_settings
from app.monitoring.sentry import configure_sentry
from app.security.middleware import RateLimitMiddleware, SecurityHeadersMiddleware


settings = get_settings()
configure_sentry()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)


@app.get("/")
def root() -> dict:
    return {
        "success": True,
        "message": "Aubit backend is running",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
        "app": "/app",
    }


app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(game.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(assets.router, prefix=settings.api_prefix)
app.include_router(text_to_3d.router, prefix=settings.api_prefix)
app.include_router(image_to_3d.router, prefix=settings.api_prefix)

app_root = Path(__file__).resolve().parents[2]
if (app_root / "index.html").is_file():
    @app.get("/app")
    def app_index():
        return FileResponse(app_root / "index.html")

    @app.get("/index.html")
    def app_index_html():
        return FileResponse(app_root / "index.html")

    if (app_root / "src").is_dir():
        app.mount("/src", StaticFiles(directory=str(app_root / "src")), name="src")
    if (app_root / "images").is_dir():
        app.mount("/images", StaticFiles(directory=str(app_root / "images")), name="images")
    if (app_root / "models").is_dir():
        app.mount("/models", StaticFiles(directory=str(app_root / "models")), name="models")
