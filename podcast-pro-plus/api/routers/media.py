import shutil
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
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

@router.post("/upload/{category}", response_model=List[MediaItem], status_code=status.HTTP_201_CREATED)
async def upload_media_files(
    category: MediaCategory, # Get category from the URL path
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    files: List[UploadFile] = File(...)
):
    """Upload one or more media files to the user's library under a specific category."""
    created_items = []
    for file in files:
        if not file.filename:
            continue

        safe_filename = f"{current_user.id}_{file.filename}"
        file_path = MEDIA_DIR / safe_filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()

        media_item = MediaItem(
            filename=safe_filename,
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

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media_item(
    media_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a media item from the library and the filesystem."""
    statement = select(MediaItem).where(MediaItem.id == media_id)
    media_item = session.exec(statement).first()

    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found.")
    if media_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item.")

    file_path = MEDIA_DIR / media_item.filename
    if file_path.exists():
        file_path.unlink()
        
    session.delete(media_item)
    session.commit()
    
    return None
