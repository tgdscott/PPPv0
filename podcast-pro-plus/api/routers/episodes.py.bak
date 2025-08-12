import shutil
from fastapi import APIRouter, HTTPException, status, Body, Depends
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict, Any
from uuid import UUID
import os
from sqlmodel import Session, select

from worker.tasks import create_podcast_episode, celery_app, publish_episode_to_spreaker_task

from ..services import audio_processor, transcription, ai_enhancer, publisher
from ..core.database import get_session
from ..core import crud
from ..models.user import User
from ..models.podcast import Episode, Podcast
from .auth import get_current_user

router = APIRouter(
    prefix="/episodes",
    tags=["Episodes"],
)

UPLOAD_DIR = Path("temp_uploads")
CLEANED_DIR = Path("cleaned_audio")
EDITED_DIR = Path("edited_audio")
OUTPUT_DIR = Path("final_episodes")

class AssembleRequestBody(BaseModel):
    template_id: UUID
    main_content_filename: str
    output_filename: str
    tts_values: Dict[str, str] = {}
    episode_details: Dict[str, Any] = {}
    spreaker_show_id: Optional[str] = None


def find_file_in_dirs(filename: str) -> Optional[Path]:
    for directory in [UPLOAD_DIR, CLEANED_DIR, EDITED_DIR, OUTPUT_DIR]:
        path = directory / filename
        if path.exists():
            return path
    return None

@router.get("/", response_model=List[Episode])
async def get_user_episodes(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Episode).where(Episode.user_id == current_user.id)
    episodes = session.exec(statement).all()
    return episodes

@router.post("/assemble", status_code=status.HTTP_202_ACCEPTED)
async def assemble_episode_endpoint(
    body: AssembleRequestBody,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    template = crud.get_template_by_id(session=session, template_id=body.template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invalid template.")

    user_podcasts = session.exec(select(Podcast).where(Podcast.user_id == current_user.id)).all()
    if not user_podcasts:
        raise HTTPException(status_code=404, detail="No podcast (show) found for this user. Please create one first.")
    podcast = user_podcasts[0]

    new_episode = Episode(
        user_id=current_user.id,
        template_id=template.id,
        podcast_id=podcast.id,
        title=body.episode_details.get('title', body.output_filename),
        description=body.episode_details.get('description', ''),
        season_number=body.episode_details.get('season'),
        episode_number=body.episode_details.get('episodeNumber'),
        status="processing"
    )
    session.add(new_episode)
    session.commit()
    session.refresh(new_episode)

    print("DEBUG: Entering Celery task dispatch block.")
    try:
        # Dispatch the task to the Celery worker
        print("DEBUG: Attempting to dispatch Celery task.")
        task = create_podcast_episode.delay(
            episode_id=str(new_episode.id),
            template_id=str(template.id),
            main_content_filename=body.main_content_filename,
            output_filename=body.output_filename,
            tts_values=body.tts_values,
            episode_details=body.episode_details,
            user_id=str(current_user.id),
            podcast_id=str(podcast.id),
            elevenlabs_api_key=current_user.elevenlabs_api_key
        )
        print(f"DEBUG: Celery task ID: {task.id}")
        return {"message": "Episode assembly has been queued.", "job_id": task.id}
    except Exception as e:
        print(f"ERROR: Failed to dispatch Celery task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to queue episode assembly: {e}")

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    task_result = celery_app.AsyncResult(job_id)
    response = {
        "job_id": job_id,
        "status": task_result.status,
        "result": task_result.result
    }
    return response


@router.post("/generate-metadata/{filename}", status_code=status.HTTP_200_OK)
async def generate_metadata_endpoint(filename: str, current_user: User = Depends(get_current_user)):
    file_path = find_file_in_dirs(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found in any directory.")
    try:
        temp_upload_path = UPLOAD_DIR / file_path.name
        shutil.copy(file_path, temp_upload_path)

        word_timestamps = transcription.get_word_timestamps(temp_upload_path.name)
        if not word_timestamps:
            raise HTTPException(status_code=400, detail="Transcript is empty.")
        
        full_transcript = " ".join([word['word'] for word in word_timestamps])
        metadata = ai_enhancer.generate_metadata_from_transcript(full_transcript)
        
        os.remove(temp_upload_path)

        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/publish/{episode_id}", status_code=status.HTTP_202_ACCEPTED)
async def publish_episode(
    episode_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    spreaker_show_id: str = Body(..., embed=True),
    publish_state: str = Body(..., embed=True)
):
    if not current_user.spreaker_access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Spreaker not authenticated for this user.")

    episode = crud.get_episode_by_id(session, episode_id)
    if not episode or episode.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Episode with id '{episode_id}' not found.")

    try:
        task = publish_episode_to_spreaker_task.delay(
            episode_id=str(episode.id),
            spreaker_show_id=spreaker_show_id,
            title=episode.title,
            description=episode.description,
            auto_published_at=None, # Scheduling is not implemented yet
            spreaker_access_token=current_user.spreaker_access_token,
            publish_state=publish_state
        )
        return {"message": "Episode publishing to Spreaker has been queued.", "job_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue Spreaker publishing task: {e}")

@router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_episode(
    episode_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    print(f"Attempting to delete episode with ID: {episode_id}")
    episode = crud.get_episode_by_id(session, episode_id)
    if not episode:
        print(f"Episode with ID: {episode_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found.")
    
    if episode.user_id != current_user.id:
        print(f"User {current_user.id} does not have permission to delete episode {episode_id}.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this episode.")

    try:
        session.delete(episode)
        session.commit()
        print(f"Episode {episode_id} deleted successfully from database.")
        # No content to return for 204, so just return
        return
    except Exception as e:
        session.rollback()
        print(f"Error deleting episode {episode_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete episode: {e}")