from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from sqlmodel import Session
import json

from ..models.podcast import PodcastTemplate, PodcastTemplateCreate, PodcastTemplatePublic
from ..models.user import User
from ..core.database import get_session
from ..core import crud
from .auth import get_current_user

router = APIRouter(
    prefix="/templates",
    tags=["Templates"],
)

def convert_db_template_to_public(db_template: PodcastTemplate) -> PodcastTemplatePublic:
    """Helper to convert DB model to the public API model."""
    return PodcastTemplatePublic(
        id=db_template.id,
        user_id=db_template.user_id,
        name=db_template.name,
        segments=json.loads(db_template.segments_json),
        background_music_rules=json.loads(db_template.background_music_rules_json),
        timing=json.loads(db_template.timing_json)
    )

@router.get("/", response_model=List[PodcastTemplatePublic])
async def list_user_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a list of the current user's saved podcast templates."""
    db_templates = crud.get_templates_by_user(session=session, user_id=current_user.id)
    return [convert_db_template_to_public(t) for t in db_templates]


@router.post("/", response_model=PodcastTemplatePublic, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: PodcastTemplateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new podcast template for the current user."""
    db_template = crud.create_user_template(session=session, template_in=template_in, user_id=current_user.id)
    return convert_db_template_to_public(db_template)


@router.get("/{template_id}", response_model=PodcastTemplatePublic)
async def get_template(
    template_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific podcast template by its ID."""
    db_template = crud.get_template_by_id(session=session, template_id=template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    if db_template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this template")
    return convert_db_template_to_public(db_template)


@router.put("/{template_id}", response_model=PodcastTemplatePublic)
async def update_template(
    template_id: UUID,
    template_in: PodcastTemplateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an existing podcast template."""
    db_template = crud.get_template_by_id(session=session, template_id=template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    if db_template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this template")

    # Correctly serialize the lists by iterating through them
    db_template.name = template_in.name
    db_template.segments_json = json.dumps([s.model_dump(mode='json') for s in template_in.segments])
    db_template.background_music_rules_json = json.dumps([r.model_dump(mode='json') for r in template_in.background_music_rules])
    db_template.timing_json = template_in.timing.model_dump_json()
    
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return convert_db_template_to_public(db_template)