from fastapi import APIRouter, Depends
from typing import Dict, Any
from sqlmodel import Session

from ..core.config import settings # This was the line with the typo
from ..models.user import User
from ..core.database import get_session
from ..core import crud
from .auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

@router.get("/me/stats", response_model=Dict[str, Any])
async def read_user_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Gets key statistics for the currently logged-in user."""
    return crud.get_user_stats(session=session, user_id=current_user.id)
