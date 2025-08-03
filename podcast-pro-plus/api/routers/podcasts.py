from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from sqlmodel import Session

from ..models.podcast import Podcast, PodcastBase # Import PodcastBase
from ..models.user import User
from ..core.database import get_session
from ..core import crud
from .auth import get_current_user

router = APIRouter(
    prefix="/podcasts",
    tags=["Podcasts"],
)

class PodcastCreate(PodcastBase):
    pass

@router.post("/", response_model=Podcast)
async def create_podcast(
    podcast_in: PodcastCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new podcast (show) for the current user."""
    return crud.create_podcast(session=session, podcast_in=podcast_in, user_id=current_user.id)

@router.get("/", response_model=List[Podcast])
async def list_user_podcasts(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a list of the current user's podcasts."""
    return crud.get_podcasts_by_user(session=session, user_id=current_user.id)
