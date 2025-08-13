import os
import logging
from pathlib import Path
from typing import Optional

from celery import Celery
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.chdir(PROJECT_ROOT)

broker_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672//")
celery_app = Celery("tasks", broker=broker_url, backend="rpc://")
celery_app.conf.update(
    imports=("worker.tasks",),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
)

# --- Local imports after sys.path is right ---
from api.core.database import get_session
from api.core import crud
from api.services import audio_processor
from api.services.publisher import SpreakerClient
from uuid import UUID


@celery_app.task(name="create_podcast_episode")
def create_podcast_episode(
    episode_id: str,
    template_id: str,
    main_content_filename: str,
    output_filename: str,
    tts_values: dict,
    episode_details: dict,
    user_id: str,
    podcast_id: str,
):
    """
    Assemble final audio from template + content. Set episode.status=processed and store final_audio_path.
    """
    logging.info(f"[assemble] CWD = {os.getcwd()}")
    session = next(get_session())
    try:
        template = crud.get_template_by_id(session, UUID(template_id))
        if not template:
            raise RuntimeError("Template not found")

        episode = crud.get_episode_by_id(session, UUID(episode_id))
        if not episode:
            raise RuntimeError(f"Episode {episode_id} not found")

        cover_image_path = (episode_details or {}).get("cover_image_path")
        logging.info(f"[assemble] start: output={output_filename}, template={template_id}, user={user_id}")
        if cover_image_path:
            logging.info(f"[assemble] cover_image_path from FE: {cover_image_path}")

        final_path, log = audio_processor.process_and_assemble_episode(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename,
            cleanup_options={},
            tts_overrides=tts_values or {},
            cover_image_path=cover_image_path,
        )

        episode.status = "processed"
        episode.final_audio_path = str(final_path)
        # (Optional) persist cover file name if present
        if cover_image_path and not getattr(episode, "cover_path", None):
            episode.cover_path = Path(cover_image_path).name

        session.add(episode)
        session.commit()
        logging.info(f"[assemble] done. final={final_path}")

        return {"message": "Episode assembled successfully!", "episode_id": episode.id, "log": log}
    except Exception as e:
        logging.exception(f"Error during episode assembly for {output_filename}: {e}")
        try:
            episode = crud.get_episode_by_id(session, UUID(episode_id))
            if episode:
                episode.status = "error"
                session.add(episode)
                session.commit()
        except Exception:
            pass
        raise
    finally:
        session.close()


@celery_app.task(name="publish_episode_to_spreaker_task")
def publish_episode_to_spreaker_task(
    episode_id: str,
    spreaker_show_id: str,
    title: str,
    description: Optional[str],
    auto_published_at: Optional[str],
    spreaker_access_token: str,
    publish_state: str,
):
    """
    Pushes the episode to Spreaker with description and optional cover.
    Sets status='published' on success.
    """
    logging.info(f"[publish] CWD = {os.getcwd()}")
    session = next(get_session())

    try:
        episode = crud.get_episode_by_id(session, UUID(episode_id))
        if not episode:
            raise RuntimeError(f"Episode {episode_id} not found")
        if not episode.final_audio_path:
            raise RuntimeError("Episode has no final audio")

        # Build cover image path if any (try episode then podcast fallback)
        cover_candidate = getattr(episode, "cover_path", None)
        if not cover_candidate and getattr(episode, "podcast_id", None):
            pod = crud.get_podcast_by_id(session, episode.podcast_id)
            if pod and pod.cover_path:
                cover_candidate = pod.cover_path

        image_file_path = None
        if cover_candidate and isinstance(cover_candidate, str):
            p = Path(cover_candidate)
            if not p.is_file():
                p2 = (PROJECT_ROOT / "media_uploads" / cover_candidate).resolve()
                if p2.is_file():
                    p = p2
            if p.is_file():
                image_file_path = str(p)

        # Use description field primarily; fallback to show_notes if needed
        desc = description or getattr(episode, "description", None) or getattr(episode, "show_notes", None) or ""

        client = SpreakerClient(spreaker_access_token)
        ok, result = client.upload_episode(
            show_id=str(spreaker_show_id),
            title=title,
            file_path=str(episode.final_audio_path),
            description=desc,
            publish_state=publish_state,
            auto_published_at=auto_published_at,
            image_file_path=image_file_path,
        )

        if ok:
            episode.status = "published"
            episode.is_published_to_spreaker = True
            if isinstance(result, dict) and result.get("episode_id"):
                episode.spreaker_episode_id = str(result["episode_id"])
            session.add(episode)
            session.commit()
            logging.info(f"Published to Spreaker: {episode.title} (id={episode.spreaker_episode_id})")
            return {"message": "Pushed to Spreaker", "episode_id": episode.id}
        else:
            episode.status = "error"
            session.add(episode)
            session.commit()
            logging.error(f"Failed Spreaker upload: {result}")
            return {"error": "Spreaker upload failed", "detail": result}

    except Exception as e:
        logging.exception(f"Error during Spreaker publishing for episode {episode_id}: {e}")
        try:
            episode = crud.get_episode_by_id(session, UUID(episode_id))
            if episode:
                episode.status = "error"
                session.add(episode)
                session.commit()
        except Exception:
            pass
        raise
    finally:
        session.close()
