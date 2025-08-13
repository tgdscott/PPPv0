from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from uuid import UUID

from api.core.database import get_session
from api.core import crud

router = APIRouter(prefix="/episodes", tags=["episodes"])

@router.get("/{episode_id}/cover")
def get_episode_cover(episode_id: str, session: Session = Depends(get_session)):
    # look up episode
    try:
        ep = crud.get_episode_by_id(session, UUID(episode_id))
    except Exception:
        ep = None
    if not ep or not getattr(ep, "cover_path", None):
        raise HTTPException(status_code=404, detail="Cover not found")

    cover_path = str(ep.cover_path)
    candidates = []

    # as-saved
    p = Path(cover_path)
    candidates.append(p)

    # project root / media_uploads fallbacks
    if not p.is_absolute():
        project_root = Path(__file__).resolve().parents[2]
        candidates.append(project_root / cover_path)
        candidates.append(project_root / "media_uploads" / cover_path.lstrip("/\\"))
        candidates.append(Path.cwd() / "media_uploads" / cover_path.lstrip("/\\"))
        # normalize backslashes-only paths on Windows too
        candidates.append(Path(str(project_root / "media_uploads" / cover_path).replace("\\", "/")))

    for cp in candidates:
        if cp.is_file():
            suf = cp.suffix.lower()
            mt = "image/jpeg"
            if suf == ".png":
                mt = "image/png"
            elif suf in (".jpg", ".jpeg"):
                mt = "image/jpeg"
            elif suf == ".webp":
                mt = "image/webp"
            return FileResponse(path=str(cp), media_type=mt)

    raise HTTPException(status_code=404, detail="Cover file missing on disk")
