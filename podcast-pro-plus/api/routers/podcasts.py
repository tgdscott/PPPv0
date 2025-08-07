from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import Session, select
import shutil
from pathlib import Path
import logging

from ..core.database import get_session
from ..models.user import User
from ..models.podcast import Podcast, PodcastBase, PodcastType
from ..services.publisher import SpreakerClient
from .auth import get_current_user

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/podcasts",
    tags=["Podcasts (Shows)"],
)

UPLOAD_DIRECTORY = Path("media_uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True)


class PodcastUpdate(PodcastBase):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_path: Optional[str] = None
    podcast_type: Optional[PodcastType] = None
    language: Optional[str] = None
    copyright_line: Optional[str] = None
    owner_name: Optional[str] = None
    author_name: Optional[str] = None
    spreaker_show_id: Optional[str] = None


@router.post("/", response_model=Podcast, status_code=status.HTTP_201_CREATED)
async def create_podcast(
    name: str = Form(...),
    description: str = Form(...),
    cover_image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    log.info("--- Starting a new podcast creation process ---")
    log.info(f"Received request to create podcast with name: '{name}'")

    spreaker_show_id = None
    if current_user.spreaker_access_token:
        log.info("User has a Spreaker access token. Proceeding to create show on Spreaker.")
        client = SpreakerClient(api_token=current_user.spreaker_access_token)
        
        log.info(f"Calling SpreakerClient.create_show with title: '{name}'")
        success, result = client.create_show(title=name, description=description, language="en")
        
        if not success:
            log.error(f"Spreaker API call failed. Result: {result}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create show on Spreaker: {result}"
            )
        
        log.info(f"Spreaker API call successful. Result: {result}")
        spreaker_show_id = result.get("show_id")
        
        if not spreaker_show_id:
            log.error("Spreaker created the show but did not return a valid show_id.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Spreaker created the show but did not return a valid ID."
            )
        log.info(f"Successfully obtained Spreaker Show ID: {spreaker_show_id}")
    else:
        log.warning("User does not have a Spreaker access token. Skipping Spreaker show creation.")

    log.info("Creating podcast in local database.")
    db_podcast = Podcast(
        name=name,
        description=description,
        spreaker_show_id=spreaker_show_id,
        user_id=current_user.id
    )

    if cover_image and cover_image.filename:
        log.info(f"Cover image provided: '{cover_image.filename}'. Processing file.")
        file_extension = Path(cover_image.filename).suffix
        unique_filename = f"{current_user.id}_{uuid4()}{file_extension}"
        save_path = UPLOAD_DIRECTORY / unique_filename
        
        try:
            with save_path.open("wb") as buffer:
                shutil.copyfileobj(cover_image.file, buffer)
            db_podcast.cover_path = f"/{UPLOAD_DIRECTORY}/{unique_filename}"
            log.info(f"Successfully saved cover image to: {save_path}")

            if spreaker_show_id:
                log.info(f"Uploading cover art to Spreaker for show ID: {spreaker_show_id}")
                client.update_show_image(show_id=spreaker_show_id, image_file_path=str(save_path))

        except Exception as e:
            log.error(f"Failed to save or upload cover image: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save or upload cover image: {e}")
    else:
        log.info("No cover image was provided.")

    session.add(db_podcast)
    session.commit()
    session.refresh(db_podcast)
    log.info(f"Successfully saved podcast to local database with ID: {db_podcast.id}")
    log.info("--- Podcast creation process finished ---")
    return db_podcast


@router.get("/", response_model=List[Podcast])
async def get_user_podcasts(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Podcast).where(Podcast.user_id == current_user.id)
    return session.exec(statement).all()


@router.put("/{podcast_id}", response_model=Podcast)
async def update_podcast(
    podcast_id: UUID,
    podcast_update: PodcastUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Podcast).where(Podcast.id == podcast_id, Podcast.user_id == current_user.id)
    podcast_to_update = session.exec(statement).first()

    if not podcast_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found or you don't have permission to edit it.")

    podcast_data = podcast_update.model_dump(exclude_unset=True)
    for key, value in podcast_data.items():
        setattr(podcast_to_update, key, value)

    session.add(podcast_to_update)
    session.commit()
    session.refresh(podcast_to_update)
    return podcast_to_update


@router.delete("/{podcast_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_podcast(
    podcast_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Podcast).where(Podcast.id == podcast_id, Podcast.user_id == current_user.id)
    podcast_to_delete = session.exec(statement).first()

    if not podcast_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found.")

    session.delete(podcast_to_delete)
    session.commit()
    return None
