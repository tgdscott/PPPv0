from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..core.database import get_session
from ..core.config import settings
from ..core import crud
from ..models.user import User
from ..services.publisher import SpreakerClient
from .auth import get_current_user
import httpx
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode
import secrets
from uuid import UUID # Import UUID

UPLOAD_DIR = Path("temp_uploads")
CLEANED_DIR = Path("cleaned_audio")
EDITED_DIR = Path("edited_audio")
OUTPUT_DIR = Path("final_episodes")

def find_file_in_dirs(filename: str) -> Optional[Path]:
    for directory in [UPLOAD_DIR, CLEANED_DIR, EDITED_DIR, OUTPUT_DIR]:
        path = directory / filename
        if path.exists():
            return path
    return None

router = APIRouter(
    prefix="/spreaker",
    tags=["Spreaker"],
)

# In-memory storage for OAuth states (for development/single-process only)
# In a production multi-process environment, this would need a shared store (Redis, database)
_oauth_states = {}

@router.get("/auth/login")
async def spreaker_login(request: Request, current_user: User = Depends(get_current_user)):
    """
    Returns the Spreaker authorization URL.
    """
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = {"user_id": str(current_user.id)}
    
    params = {
        "client_id": settings.SPREAKER_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPREAKER_REDIRECT_URI.replace("localhost", "127.0.0.1"),
        "scope": "basic",
        "state": state
    }
    auth_url = f"https://www.spreaker.com/oauth2/authorize?{urlencode(params)}"
    print(f"Generated Spreaker Auth URL: {auth_url}")
    return {"auth_url": auth_url}

@router.get("/auth/callback")
async def spreaker_callback(request: Request, code: str, state: str, db: Session = Depends(get_session)):
    """
    Handles the callback from Spreaker after the user has authorized the application.
    """
    stored_data = _oauth_states.pop(state, None)
    
    if not stored_data or stored_data["user_id"] is None:
        raise HTTPException(status_code=403, detail="Invalid state parameter or user not found in session")

    user_id = stored_data["user_id"]

    token_url = "https://api.spreaker.com/oauth2/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.SPREAKER_CLIENT_ID,
        "client_secret": settings.SPREAKER_CLIENT_SECRET,
        "redirect_uri": settings.SPREAKER_REDIRECT_URI.replace("localhost", "127.0.0.1")
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
    
    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to retrieve access token from Spreaker")
    
    token_data = response.json()
    
    user = crud.get_user_by_id(db, UUID(user_id)) # Use get_user_by_id and cast to UUID
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.spreaker_access_token = token_data["access_token"]
    user.spreaker_refresh_token = token_data["refresh_token"]
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return RedirectResponse(url="http://127.0.0.1:5173/dashboard/settings?spreaker_connected=true")

@router.post("/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_spreaker(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Disconnects the user's Spreaker account by clearing their tokens.
    """
    current_user.spreaker_access_token = None
    current_user.spreaker_refresh_token = None
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {"message": "Spreaker account disconnected successfully."}

@router.get("/shows")
async def get_spreaker_shows(current_user: User = Depends(get_current_user)):
    """
    Gets a list of the user's shows from Spreaker.
    """
    if not current_user.spreaker_access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Spreaker not authenticated for this user.")
    
    client = SpreakerClient(api_token=current_user.spreaker_access_token)
    success, result = client.get_shows()
    
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result)
        
    return {"shows": result}