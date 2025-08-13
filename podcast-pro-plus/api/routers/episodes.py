import os
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Body, status, Query
from sqlalchemy.orm import Session

from api.core.database import get_session
from api.core.auth import get_current_user
from api.models.user import User
from api.models.podcast import Episode, Podcast
try:
    # Some repos define an Enum; if not, we’ll just use strings
    from api.models.podcast import EpisodeStatus
    HAS_EPISODE_STATUS = True
except Exception:
    HAS_EPISODE_STATUS = False

from worker.tasks import celery_app, create_podcast_episode, publish_episode_to_spreaker_task

router = APIRouter(prefix="/episodes", tags=["episodes"])

# --- helpers -----------------------------------------------------------------

def _final_url_for(path: Optional[str]) -> Optional[str]:
    """Map final_episodes/<file> -> /static/final/<file>"""
    if not path:
        return None
    base = os.path.basename(path)
    return f"/static/final/{base}"

def _cover_url_for(path: Optional[str]) -> Optional[str]:
    """Map a stored local cover path to /static/media/*, or passthrough if HTTP(S)."""
    if not path:
        return None
    p = str(path)
    if p.lower().startswith(("http://", "https://")):
        return p
    # Keep relative subfolders if any; normalize \ -> /
    p = p.replace("\\", "/")
    # if already looks like a filename, just mount under /static/media
    return f"/static/media/{os.path.basename(p)}" if "/" not in p else f"/static/media/{p.split('/')[-1]}"

def _status_value(v: str) -> str:
    # Normalize string/enum to simple string for FE
    if HAS_EPISODE_STATUS:
        return v.value if hasattr(v, "value") else str(v)
    return str(v)

def _first_podcast_for_user(session: Session, user_id: str) -> Optional[Podcast]:
    return (
        session.query(Podcast)
        .filter(Podcast.user_id == user_id)
        .first()
    )

# --- routes ------------------------------------------------------------------

@router.post("/assemble", status_code=status.HTTP_202_ACCEPTED)
def assemble_episode(
    payload: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Body (from FE):
    {
      "template_id": "...",
      "main_content_filename": "...",
      "output_filename": "...",
      "tts_values": {...},                     (optional)
      "episode_details": {
         "title": "...",
         "description": "...",
         "season": "1",
         "episodeNumber": "2",
         "cover_image_path": "filename-or-path.ext"   (optional; set by /media/upload/cover_art)
      }
    }
    """
    template_id = payload.get("template_id")
    main_content_filename = payload.get("main_content_filename")
    output_filename = payload.get("output_filename")
    tts_values = payload.get("tts_values") or {}
    episode_details = payload.get("episode_details") or {}

    if not template_id or not main_content_filename or not output_filename:
        raise HTTPException(status_code=400, detail="template_id, main_content_filename, output_filename are required.")

    # Episode metadata
    ep_title = (episode_details.get("title") or output_filename or "").strip() or "Untitled Episode"
    ep_description = (episode_details.get("description") or "").strip()  # store as episode.show_notes
    cover_image_path = episode_details.get("cover_image_path")

    # Link to a podcast (show) if present; we pick the first for the user
    podcast = _first_podcast_for_user(session, current_user.id)
    podcast_id = podcast.id if podcast else None

    # Create a DB row immediately with status 'processing'
    ep = Episode(
        user_id=current_user.id,
        template_id=template_id,
        podcast_id=podcast_id,
        title=ep_title,
        cover_path=cover_image_path,
        show_notes=ep_description,
        status=(EpisodeStatus.processing if HAS_EPISODE_STATUS else "processing"),
        processed_at=datetime.utcnow(),
    )
    session.add(ep)
    session.commit()
    session.refresh(ep)

    # Kick off Celery job
    # We pass through cover_image_path inside episode_details for the worker to use
    ed = dict(episode_details)
    if cover_image_path:
        ed["cover_image_path"] = cover_image_path

    # optional keys we might have on user
    spreaker_access_token = getattr(current_user, "spreaker_access_token", None)
    elevenlabs_api_key = getattr(current_user, "elevenlabs_api_key", None)

    async_result = create_podcast_episode.delay(
        episode_id=str(ep.id),
        template_id=str(template_id),
        main_content_filename=str(main_content_filename),
        output_filename=str(output_filename),
        tts_values=tts_values,
        episode_details=ed,
        user_id=str(current_user.id),
        podcast_id=str(podcast_id) if podcast_id else "",
        spreaker_show_id=None,
        spreaker_access_token=spreaker_access_token,
        auto_published_at=None,
        elevenlabs_api_key=elevenlabs_api_key,
    )

    return {
        "job_id": async_result.id,
        "status": "queued",
        "episode_id": str(ep.id),
        "message": "Episode assembly has been queued."
    }


@router.get("/status/{job_id}")
def get_job_status(job_id: str, session: Session = Depends(get_session)):
    task = celery_app.AsyncResult(job_id)
    status_val = getattr(task, "status", "PENDING")
    result = getattr(task, "result", None)

    # On success, return full assembled episode details FE expects
    if status_val == "SUCCESS":
        # The worker returns {'message':..., 'episode_id': <uuid>, 'log': [...]}
        ep_id = None
        if isinstance(result, dict):
            ep_id = result.get("episode_id")
        else:
            # sometimes Celery serializes to string
            try:
                import json
                data = json.loads(result)
                ep_id = data.get("episode_id")
            except Exception:
                ep_id = None

        if not ep_id:
            return {"job_id": job_id, "status": "processed"}

        ep = session.query(Episode).filter(Episode.id == str(ep_id)).first()
        if not ep:
            return {"job_id": job_id, "status": "processed"}

        assembled = {
            "id": str(ep.id),
            "title": ep.title,
            "description": ep.show_notes or "",
            "final_audio_url": _final_url_for(ep.final_audio_path),
            "cover_url": _cover_url_for(ep.cover_path),
            "status": _status_value(ep.status),
        }
        return {"job_id": job_id, "status": "processed", "episode": assembled, "message": (result.get("message") if isinstance(result, dict) else None)}

    if status_val in ("STARTED", "RETRY"):
        return {"job_id": job_id, "status": "processing"}
    if status_val == "PENDING":
        return {"job_id": job_id, "status": "queued"}

    # FAILURE or other
    err_text = None
    if isinstance(result, dict):
        err_text = result.get("error") or result.get("detail")
    if not err_text:
        err_text = str(result)
    return {"job_id": job_id, "status": "error", "error": err_text}


# Keep both shapes to match FE call: /publish/{id} and /{id}/publish
@router.post("/publish/{episode_id}", status_code=status.HTTP_200_OK)
@router.post("/{episode_id}/publish", status_code=status.HTTP_200_OK)
def publish_episode_endpoint(
    episode_id: str,
    spreaker_show_id: str = Body(..., embed=True),
    publish_state: str = Body(..., embed=True),  # e.g. 'unpublished' | 'public'
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ep = session.query(Episode).filter(Episode.id == episode_id, Episode.user_id == current_user.id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")

    if not ep.final_audio_path:
        raise HTTPException(status_code=400, detail="Episode is not processed yet")

    spreaker_access_token = getattr(current_user, "spreaker_access_token", None)
    if not spreaker_access_token:
        raise HTTPException(status_code=401, detail="User is not connected to Spreaker")

    # Prefer episode.show_notes for description
    description = ep.show_notes or ""

    async_result = publish_episode_to_spreaker_task.delay(
        episode_id=str(ep.id),
        spreaker_show_id=str(spreaker_show_id),
        title=str(ep.title or "Untitled Episode"),
        description=description,
        auto_published_at=None,
        spreaker_access_token=spreaker_access_token,
        publish_state=publish_state,
    )

    return {"message": "Publish request submitted to Spreaker.", "job_id": async_result.id}


@router.get("/", status_code=status.HTTP_200_OK)
def list_episodes(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=500),
):
    eps = (
        session.query(Episode)
        .filter(Episode.user_id == current_user.id)
        .order_by(Episode.processed_at.desc())
        .limit(limit)
        .all()
    )
    items = []
    for e in eps:
        items.append({
            "id": str(e.id),
            "title": e.title,
            "status": _status_value(e.status),
            "processed_at": e.processed_at.isoformat() if getattr(e, "processed_at", None) else None,
            "final_audio_url": _final_url_for(e.final_audio_path),
            "cover_url": _cover_url_for(e.cover_path),
            "spreaker_episode_id": getattr(e, "spreaker_episode_id", None),
            "is_published_to_spreaker": bool(getattr(e, "is_published_to_spreaker", False)),
        })
    return {"items": items}


@router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    episode_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ep = session.query(Episode).filter(Episode.id == episode_id, Episode.user_id == current_user.id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    session.delete(ep)
    session.commit()
    return
