from sqlmodel import Session, select, func
from typing import Optional, List, Dict, Any
from uuid import UUID
import json

from .security import get_password_hash
from ..models.user import User, UserCreate, UserPublic
from ..models.podcast import Podcast, PodcastTemplate, PodcastTemplateCreate, Episode

# --- User CRUD ---
def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def get_user_by_id(session: Session, user_id: UUID) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    return session.exec(statement).first()

def create_user(session: Session, user_create: UserCreate) -> User:
    hashed_password = get_password_hash(user_create.password)
    db_user = User.model_validate(user_create, update={"hashed_password": hashed_password})
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def get_all_users(session: Session) -> List[User]:
    statement = select(User)
    return session.exec(statement).all()

# --- Stats CRUD ---
def get_user_stats(session: Session, user_id: UUID) -> Dict[str, Any]:
    episode_count_statement = select(func.count(Episode.id)).where(Episode.user_id == user_id)
    total_episodes = session.exec(episode_count_statement).one_or_none() or 0
    return { "total_episodes": total_episodes, "total_downloads": 1567, "monthly_listeners": 342, "avg_rating": 4.8 }

# --- NEW: Podcast (Show) CRUD ---
def create_podcast(session: Session, podcast_in: Podcast, user_id: UUID) -> Podcast:
    db_podcast = Podcast.model_validate(podcast_in, update={"user_id": user_id})
    session.add(db_podcast)
    session.commit()
    session.refresh(db_podcast)
    return db_podcast

def get_podcasts_by_user(session: Session, user_id: UUID) -> List[Podcast]:
    statement = select(Podcast).where(Podcast.user_id == user_id)
    return session.exec(statement).all()

# --- Template CRUD ---
def get_template_by_id(session: Session, template_id: UUID) -> Optional[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.id == template_id)
    return session.exec(statement).first()

def get_templates_by_user(session: Session, user_id: UUID) -> List[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.user_id == user_id)
    return session.exec(statement).all()

def create_user_template(session: Session, template_in: PodcastTemplateCreate, user_id: UUID) -> PodcastTemplate:
    segments_json_str = json.dumps([s.model_dump(mode='json') for s in template_in.segments])
    music_rules_json_str = json.dumps([r.model_dump(mode='json') for r in template_in.background_music_rules])
    db_template = PodcastTemplate(
        name=template_in.name, user_id=user_id, segments_json=segments_json_str,
        background_music_rules_json=music_rules_json_str,
        timing_json=template_in.timing.model_dump_json()
    )
    session.add(db_template)
    session.commit()
    from sqlmodel import Session, select, func
from typing import Optional, List, Dict, Any
from uuid import UUID
import json

from .security import get_password_hash
from ..models.user import User, UserCreate, UserPublic
from ..models.podcast import Podcast, PodcastTemplate, PodcastTemplateCreate, Episode

# --- User CRUD ---
def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def get_user_by_id(session: Session, user_id: UUID) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    return session.exec(statement).first()

def create_user(session: Session, user_create: UserCreate) -> User:
    hashed_password = get_password_hash(user_create.password)
    db_user = User.model_validate(user_create, update={"hashed_password": hashed_password})
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def get_all_users(session: Session) -> List[User]:
    statement = select(User)
    return session.exec(statement).all()

# --- Stats CRUD ---
def get_user_stats(session: Session, user_id: UUID) -> Dict[str, Any]:
    episode_count_statement = select(func.count(Episode.id)).where(Episode.user_id == user_id)
    total_episodes = session.exec(episode_count_statement).one_or_none() or 0
    return { "total_episodes": total_episodes, "total_downloads": 1567, "monthly_listeners": 342, "avg_rating": 4.8 }

# --- NEW: Podcast (Show) CRUD ---
def create_podcast(session: Session, podcast_in: Podcast, user_id: UUID) -> Podcast:
    db_podcast = Podcast.model_validate(podcast_in, update={"user_id": user_id})
    session.add(db_podcast)
    session.commit()
    session.refresh(db_podcast)
    return db_podcast

def get_podcasts_by_user(session: Session, user_id: UUID) -> List[Podcast]:
    statement = select(Podcast).where(Podcast.user_id == user_id)
    return session.exec(statement).all()

# --- Template CRUD ---
def get_template_by_id(session: Session, template_id: UUID) -> Optional[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.id == template_id)
    return session.exec(statement).first()

def get_templates_by_user(session: Session, user_id: UUID) -> List[PodcastTemplate]:
    statement = select(PodcastTemplate).where(PodcastTemplate.user_id == user_id)
    return session.exec(statement).all()

def create_user_template(session: Session, template_in: PodcastTemplateCreate, user_id: UUID) -> PodcastTemplate:
    segments_json_str = json.dumps([s.model_dump(mode='json') for s in template_in.segments])
    music_rules_json_str = json.dumps([r.model_dump(mode='json') for r in template_in.background_music_rules])
    db_template = PodcastTemplate(
        name=template_in.name, user_id=user_id, segments_json=segments_json_str,
        background_music_rules_json=music_rules_json_str,
        timing_json=template_in.timing.model_dump_json()
    )
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template

# --- Episode CRUD ---
def get_episode_by_id(session: Session, episode_id: UUID) -> Optional[Episode]:
    statement = select(Episode).where(Episode.id == episode_id)
    return session.exec(statement).first()