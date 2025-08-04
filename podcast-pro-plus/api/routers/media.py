import shutil
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from pathlib import Path
from sqlmodel import Session, select

from ..models.podcast import MediaItem, MediaCategory
from ..models.user import User
from ..core.database import get_session
from .auth import get_current_user

router = APIRouter(
    prefix="/media",
    tags=["Media Library"],
)

MEDIA_DIR = Path("media_uploads")
MEDIA_DIR.mkdir(exist_ok=True)

class MediaItemUpdate(BaseModel):
    friendly_name: str

@router.post("/upload/{category}", response_model=List[MediaItem], status_code=status.HTTP_201_CREATED)
async def upload_media_files(
    category: MediaCategory,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    files: List[UploadFile] = File(...),
    friendly_names_str: Optional[str] = Form(None)
):
    """Upload one or more media files with optional friendly names."""
    created_items = []
    names = friendly_names_str.split(',') if friendly_names_str else []

    for i, file in enumerate(files):
        if not file.filename:
            continue

        safe_filename = f"{current_user.id.hex}_{file.filename}"
        file_path = MEDIA_DIR / safe_filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()
        
        friendly_name = names[i] if i < len(names) and names[i].strip() else None

        media_item = MediaItem(
            filename=safe_filename,
            friendly_name=friendly_name,
            content_type=file.content_type,
            filesize=file_path.stat().st_size,
            user_id=current_user.id,
            category=category
        )
        session.add(media_item)
        created_items.append(media_item)

    session.commit()
    for item in created_items:
        session.refresh(item)
    
    return created_items

@router.get("/", response_model=List[MediaItem])
async def list_user_media(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a list of the current user's uploaded media files."""
    statement = select(MediaItem).where(MediaItem.user_id == current_user.id)
    return session.exec(statement).all()

@router.put("/{media_id}", response_model=MediaItem)
async def update_media_item_name(
    media_id: UUID,
    media_update: MediaItemUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update the friendly name of a media item."""
    media_item = session.get(MediaItem, media_id)
    if not media_item or media_item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Media item not found.")
    
    media_item.friendly_name = media_update.friendly_name
    session.add(media_item)
    session.commit()
    session.refresh(media_item)
    return media_item

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media_item(
    media_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # --- THIS IS THE FIX ---
    # Using a select statement to be more explicit, then fetching the single result.
    statement = select(MediaItem).where(MediaItem.id == media_id, MediaItem.user_id == current_user.id)
    media_item = session.exec(statement).one_or_none()

    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found or you don't have permission to delete it.")

    file_path = MEDIA_DIR / media_item.filename
    if file_path.exists():
        file_path.unlink()
        
    session.delete(media_item)
    session.commit()
    
    return None