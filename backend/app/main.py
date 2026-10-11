from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ai, assets, auth, game, health
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
    }


app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(game.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(assets.router, prefix=settings.api_prefix)
