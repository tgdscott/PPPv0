import api.db_listeners  # registers SQLAlchemy listeners
from api.routers.media_upload_alias import router as media_upload_alias_router
from api.routers.episodes_publish_alias import router as episodes_publish_alias_router
from api.routers.auth_me import router as auth_me_router
from api.routers.health import router as health_router
from api.exceptions import install_exception_handlers
from api.middleware.request_id import RequestIDMiddleware
import os
from pathlib import Path
from sqlalchemy.orm import Session as _Session
from api.core.database import get_session
from api.models.podcast import Episode

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

def _normalize_episode_paths():
    session: _Session = next(get_session())
    try:
        eps = session.query(Episode).limit(5000).all()
        changed = 0
        for e in eps:
            c = False
            if e.final_audio_path:
                base = os.path.basename(str(e.final_audio_path))
                if base != e.final_audio_path:
                    e.final_audio_path = base
                    c = True
            if e.cover_path and not str(e.cover_path).lower().startswith(("http://","https://")):
                base = os.path.basename(str(e.cover_path))
                if base != e.cover_path:
                    e.cover_path = base
                    c = True
            if c:
                session.add(e)
                changed += 1
        if changed:
            session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()

app = FastAPI(title="Podcast Pro Plus API")
_normalize_episode_paths()
app.include_router(media_upload_alias_router)
app.include_router(episodes_publish_alias_router)
app.add_middleware(RequestIDMiddleware)
install_exception_handlers(app)
app.include_router(health_router)
app.include_router(auth_me_router)

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