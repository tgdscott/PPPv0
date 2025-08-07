from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List

# Forward reference to avoid circular import errors
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .podcast import PodcastTemplate

class UserBase(SQLModel):
    """Base model with shared fields."""
    email: EmailStr = Field(unique=True, index=True)
    is_active: bool = True
    google_id: Optional[str] = Field(default=None, unique=True)
    tier: str = Field(default="free")
    spreaker_access_token: Optional[str] = Field(default=None)
    spreaker_refresh_token: Optional[str] = Field(default=None)

class User(UserBase, table=True):
    """The database model for a User."""
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # This creates the link back to the templates that belong to this user
    templates: List["PodcastTemplate"] = Relationship(back_populates="user")

class UserCreate(UserBase):
    """Schema for creating a new user (registration)."""
    password: str = Field(..., min_length=8)

class UserPublic(UserBase):
    """Schema for returning user data to the client (omits password)."""
    id: UUID
    created_at: datetime
