from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.user import User
from ..models.podcast import Podcast, PodcastBase, PodcastType
from .auth import get_current_user

router = APIRouter(
    prefix="/podcasts",
    tags=["Podcasts (Shows)"],
)

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
    podcast: PodcastBase,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    new_podcast = Podcast.model_validate(podcast)
    new_podcast.user_id = current_user.id
    session.add(new_podcast)
    session.commit()
    session.refresh(new_podcast)
    return new_podcast

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