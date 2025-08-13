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
    """Return public URL for final audio file (basename only)."""
    if not path:
        return None
    return f"/static/final/{os.path.basename(str(path))}"

def _cover_url_for(path: Optional[str]) -> Optional[str]:
    """Return public URL for cover image (basename only) unless already an absolute URL."""
    if not path:
        return None
    p = str(path)
    if p.lower().startswith(("http://", "https://")):
        return p
    return f"/static/media/{os.path.basename(p)}"

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
    final_dir = os.path.join(os.getcwd(), 'final_episodes')
    media_dir = os.path.join(os.getcwd(), 'media_uploads')
    for e in eps:
        final_exists = False
        cover_exists = False
        try:
            if e.final_audio_path:
                candidate = os.path.join(final_dir, os.path.basename(str(e.final_audio_path)))
                final_exists = os.path.isfile(candidate)
            if e.cover_path and not str(e.cover_path).lower().startswith(('http://','https://')):
                candidate = os.path.join(media_dir, os.path.basename(str(e.cover_path)))
                cover_exists = os.path.isfile(candidate)
            elif e.cover_path:
                # absolute URL we can't verify locally
                cover_exists = True
        except Exception:
            pass
        items.append({
            "id": str(e.id),
            "title": e.title,
            "status": _status_value(e.status),
            "processed_at": e.processed_at.isoformat() if getattr(e, "processed_at", None) else None,
            "final_audio_url": _final_url_for(e.final_audio_path),
            "cover_url": _cover_url_for(e.cover_path),
            "description": getattr(e, "show_notes", None) or "",
            "spreaker_episode_id": getattr(e, "spreaker_episode_id", None),
            "is_published_to_spreaker": bool(getattr(e, "is_published_to_spreaker", False)),
            "final_audio_exists": final_exists,
            "cover_exists": cover_exists,
            "cover_path": e.cover_path,
            "final_audio_basename": os.path.basename(e.final_audio_path) if e.final_audio_path else None,
        })
    return {"items": items}


@router.get("/{episode_id}/diagnostics", status_code=200)
def episode_diagnostics(
    episode_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    import uuid as _uuid
    try:
        eid = _uuid.UUID(str(episode_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Episode not found")
    ep = (
        session.query(Episode)
        .filter(Episode.id == eid, Episode.user_id == current_user.id)
        .first()
    )
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    final_path = ep.final_audio_path
    cover_path = ep.cover_path
    final_exists = bool(final_path and (os.path.isfile(final_path) or os.path.isfile(os.path.join(os.getcwd(), final_path))))
    cover_candidates = []
    if cover_path:
        cover_candidates = [
            cover_path,
            os.path.join(os.getcwd(), cover_path),
            os.path.join(os.getcwd(), 'media_uploads', os.path.basename(cover_path)),
        ]
    cover_exists = any(os.path.isfile(c) for c in cover_candidates)
    return {
        "id": str(ep.id),
        "final_audio_path": final_path,
        "final_audio_url": _final_url_for(final_path),
        "final_audio_exists": final_exists,
        "cover_path": cover_path,
        "cover_url": _cover_url_for(cover_path),
        "cover_exists": cover_exists,
        "cover_candidates": cover_candidates,
        "cwd": os.getcwd(),
    }


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
