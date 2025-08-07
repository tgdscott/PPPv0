from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from sqlmodel import Session

from ..core.config import settings
from ..models.user import User, UserPublic
from ..core.database import get_session
from ..core import crud
from .auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

class ElevenLabsAPIKeyUpdate(BaseModel):
    api_key: str

@router.get("/me/stats", response_model=Dict[str, Any])
async def read_user_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Gets key statistics for the currently logged-in user."""
    return crud.get_user_stats(session=session, user_id=current_user.id)

@router.put("/me/elevenlabs-key", response_model=UserPublic)
async def update_elevenlabs_api_key(
    key_update: ElevenLabsAPIKeyUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Updates the ElevenLabs API key for the current user."""
    current_user.elevenlabs_api_key = key_update.api_key
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user