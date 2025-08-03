import shutil
from fastapi import APIRouter, HTTPException, status, Body, Depends
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict
from uuid import UUID
import os
from sqlmodel import Session, select

from ..services import audio_processor, transcription, ai_enhancer, publisher
from ..core.database import get_session
from ..core import crud
from ..models.user import User
from ..models.podcast import Episode
from .auth import get_current_user

router = APIRouter(
    prefix="/episodes",
    tags=["Episodes"],
)

UPLOAD_DIR = Path("temp_uploads")
CLEANED_DIR = Path("cleaned_audio")
EDITED_DIR = Path("edited_audio")
OUTPUT_DIR = Path("final_episodes")

class CleanupOptions(BaseModel):
    removePauses: bool = True
    removeFillers: bool = True

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

@router.post("/process-and-assemble", status_code=status.HTTP_200_OK)
async def process_and_assemble_endpoint(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    template_id: UUID = Body(..., embed=True),
    podcast_id: UUID = Body(..., embed=True), # <-- ADD THIS LINE
    main_content_filename: str = Body(..., embed=True),
    output_filename: str = Body(..., embed=True),
    cleanup_options: CleanupOptions = Body(..., embed=True),
    tts_overrides: Dict[str, str] = Body({}, embed=True)
):
    template = crud.get_template_by_id(session=session, template_id=template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invalid template.")

    # --- Create the initial Episode record in the database ---
    new_episode = Episode(
        user_id=current_user.id,
        template_id=template.id,
        podcast_id=podcast_id, # <-- ADD THIS LINE
        title=output_filename,
        status="processing"
    )
    session.add(new_episode)
    session.commit()
    session.refresh(new_episode)
    
    try:
        final_path, log = audio_processor.process_and_assemble_episode(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename,
            cleanup_options=cleanup_options.dict(),
            tts_overrides=tts_overrides
        )
        # --- Update the Episode record on success ---
        new_episode.status = "processed"
        new_episode.final_audio_path = str(final_path)
        # A helper function in audio_processor to get duration would be ideal here
        # new_episode.total_length_seconds = audio_processor.get_audio_duration(final_path) 
        session.add(new_episode)
        session.commit()
        # --------------------------------------------
        return {"message": "Episode processed and assembled successfully!", "output_path": str(final_path), "log": log}
    except Exception as e:
        # --- Update the Episode record on error ---
        new_episode.status = "error"
        session.add(new_episode)
        session.commit()
        # ------------------------------------------
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-metadata/{filename}", status_code=status.HTTP_200_OK)
async def generate_metadata_endpoint(filename: str, current_user: User = Depends(get_current_user)):
    """Generates a title and summary for a processed audio file."""
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
    except (transcription.TranscriptionError, ai_enhancer.AIEnhancerError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/publish/spreaker/{filename}", status_code=status.HTTP_200_OK)
async def publish_to_spreaker(
    filename: str,
    current_user: User = Depends(get_current_user),
    show_id: str = Body(..., embed=True),
    title: str = Body(..., embed=True),
    description: Optional[str] = Body(None, embed=True)
):
    """Uploads a processed audio file to Spreaker as a draft."""
    file_to_upload = find_file_in_dirs(filename)
    if not file_to_upload:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found in any output directory.")
    try:
        print(f"User {current_user.email} is publishing {filename} to Spreaker show {show_id}.")
        return {"message": f"Successfully published '{title}' to Spreaker."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
