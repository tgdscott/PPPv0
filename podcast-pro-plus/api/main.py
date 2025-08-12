import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .routers import episodes, spreaker, templates, media, users, admin, podcasts, importer, wizard, auth

APP_ROOT = Path(__file__).resolve().parent.parent
FINAL_DIR = APP_ROOT / "final_episodes"
MEDIA_DIR = APP_ROOT / "media_uploads"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Podcast Pro Plus API")

# --- Sessions for OAuth (required by authlib/google) ---
SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-insecure-session-secret-change-me")
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="ppp_session",
    max_age=60 * 60 * 24 * 14,  # 14 days
    same_site="lax",
    https_only=False,  # set True behind HTTPS/proxy in prod
)

# --- CORS (relaxed for local dev) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# --- Static for audio/images ---
app.mount("/static/final", StaticFiles(directory=str(FINAL_DIR)), name="final")
app.mount("/static/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

# --- Routers (only under /api; avoid duplicates) ---
app.include_router(auth.router, prefix="/api")
app.include_router(episodes.router, prefix="/api")
app.include_router(spreaker.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(podcasts.router, prefix="/api")
app.include_router(importer.router, prefix="/api")
app.include_router(wizard.router, prefix="/api")

@app.get("/")
def root():
    return {"ok": True}
