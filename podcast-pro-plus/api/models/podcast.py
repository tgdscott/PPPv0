from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional, Literal, Union
from datetime import datetime
from uuid import UUID, uuid4
import json
from enum import Enum

from .user import User

class MediaCategory(str, Enum):
    intro = "intro"
    outro = "outro"
    music = "music"
    commercial = "commercial"
    sfx = "sfx"
    main_content = "main_content"
    podcast_cover = "podcast_cover"
    episode_cover = "episode_cover"

class EpisodeStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    processed = "processed"
    published = "published"
    error = "error"

class PodcastBase(SQLModel):
    name: str
    description: Optional[str] = None
    cover_path: Optional[str] = None
    rss_url: Optional[str] = Field(default=None, index=True)

class Podcast(PodcastBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    user_id: UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship()
    
    episodes: List["Episode"] = Relationship(back_populates="podcast", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class StaticSegmentSource(SQLModel):
    source_type: Literal["static"] = "static"
    filename: str

class AIGeneratedSegmentSource(SQLModel):
    source_type: Literal["ai_generated"] = "ai_generated"
    prompt: str
    voice_id: str = "19B4gjtpL5m876wS3Dfg"

class TTSSegmentSource(SQLModel):
    source_type: Literal["tts"] = "tts"
    script: str = ""
    voice_id: str = "19B4gjtpL5m876wS3Dfg"

class TemplateSegment(SQLModel):
    id: UUID = Field(default_factory=uuid4)
    segment_type: Literal["intro", "outro", "commercial", "sound_effect", "transition", "content"]
    source: Union[StaticSegmentSource, AIGeneratedSegmentSource, TTSSegmentSource]

class BackgroundMusicRule(SQLModel):
    id: UUID = Field(default_factory=uuid4)
    music_filename: str
    apply_to_segments: List[Literal["intro", "content", "outro"]]
    start_offset_s: float = 0.0
    end_offset_s: float = 0.0
    fade_in_s: float = 2.0
    fade_out_s: float = 3.0
    volume_db: int = -15

class SegmentTiming(SQLModel):
    content_start_offset_s: float = -2.0
    outro_start_offset_s: float = -5.0

class PodcastTemplateCreate(SQLModel):
    name: str
    segments: List[TemplateSegment]
    background_music_rules: List[BackgroundMusicRule] = []
    timing: SegmentTiming = Field(default_factory=SegmentTiming)

class PodcastTemplate(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    name: str
    user_id: UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="templates")
    segments_json: str = Field(default="[]")
    background_music_rules_json: str = Field(default="[]")
    timing_json: str = Field(default_factory=lambda: SegmentTiming().model_dump_json())

    episodes: List["Episode"] = Relationship(back_populates="template")

class PodcastTemplatePublic(PodcastTemplateCreate):
    id: UUID
    user_id: UUID

class MediaItem(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    friendly_name: Optional[str] = Field(default=None)
    category: MediaCategory = Field(default=MediaCategory.music)
    filename: str
    content_type: Optional[str] = None
    filesize: Optional[int] = None
    user_id: UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship()
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Episode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    
    user_id: UUID = Field(foreign_key="user.id")
    user: Optional[User] = Relationship()
    template_id: Optional[UUID] = Field(default=None, foreign_key="podcasttemplate.id")
    template: Optional[PodcastTemplate] = Relationship(back_populates="episodes")
    podcast_id: UUID = Field(foreign_key="podcast.id")
    podcast: Optional[Podcast] = Relationship(back_populates="episodes")

    title: str = Field(default="Untitled Episode")
    cover_path: Optional[str] = Field(default=None)
    show_notes: Optional[str] = Field(default=None)
    
    status: EpisodeStatus = Field(default=EpisodeStatus.pending)
    final_audio_path: Optional[str] = Field(default=None)
    spreaker_episode_id: Optional[str] = Field(default=None)
    is_published_to_spreaker: bool = Field(default=False)

    processed_at: datetime = Field(default_factory=datetime.utcnow)
    publish_at: Optional[datetime] = Field(default=None)