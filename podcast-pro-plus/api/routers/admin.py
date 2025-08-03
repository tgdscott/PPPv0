from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlmodel import Session

from ..core.config import settings
from ..models.user import User, UserPublic
from ..core.database import get_session
from ..core import crud
from .auth import get_current_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

# --- Admin Dependency ---
def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that checks if the current user is the admin.
    If not, it raises an HTTP 403 Forbidden error.
    """
    if current_user.email != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have permissions to access this resource.",
        )
    return current_user

# --- Admin Endpoints ---
@router.get("/users", response_model=List[UserPublic])
async def get_all_users(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get a list of all users. Only accessible by the admin.
    """
    return crud.get_all_users(session=session)
