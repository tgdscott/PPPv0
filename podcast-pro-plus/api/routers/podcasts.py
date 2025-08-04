from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.user import User
from ..models.podcast import Podcast, PodcastBase
from .auth import get_current_user

router = APIRouter(
    prefix="/podcasts",
    tags=["Podcasts (Shows)"],
)

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

# --- NEW ENDPOINT TO DELETE A SHOW ---
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