from celery import Celery
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
import sys
from typing import Optional
from uuid import UUID # Correctly placed UUID import

# It's good practice to set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
load_dotenv()

# Define base directory relative to this file's location
# This ensures that paths are correct regardless of where the worker is started from
# tasks.py -> worker -> podcast-pro-plus -> d:/PPPv0
# So we need to go up two levels to get to the project root.
# However, the services expect to be run from the `podcast-pro-plus` directory.
# Let's adjust the working directory for the task.
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT)) # Add project root to sys.path
API_DIR = PROJECT_ROOT / "api"

# Celery configuration
# The broker URL is read from the environment variables
# Make sure you have RABBITMQ_URL defined in your .env file
# Example: RABBITMQ_URL=amqp://guest:guest@localhost:5672//
broker_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672//")
celery_app = Celery(
    "tasks",
    broker=broker_url,
    backend="rpc://"  # Using RPC backend for simplicity, can be changed to Redis or other
)

# Optional: If you need to include other modules or packages for the worker
celery_app.conf.update(
    imports=("worker.tasks",),
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    broker_connection_retry_on_startup=True,
)

@celery_app.task(name="create_podcast_episode")
def create_podcast_episode(episode_id: str, template_id: str, main_content_filename: str, output_filename: str, tts_values: dict, episode_details: dict, user_id: str, podcast_id: str, spreaker_show_id: Optional[str] = None, spreaker_access_token: Optional[str] = None, auto_published_at: Optional[str] = None, elevenlabs_api_key: Optional[str] = None):
    """
    Celery task to process and assemble a podcast episode.
    This task will run in the background and handle the entire audio processing workflow.
    """
    # Since this is a background task, we need to import the necessary services here
    # and handle the application context correctly.
    
    # Change the current working directory to the `podcast-pro-plus` directory
    # so that all the relative paths used by the services work correctly.
    os.chdir(PROJECT_ROOT)
    
    logging.info(f"Changing working directory to: {os.getcwd()}")
    
    # We need to set up the database session for the task
    # This requires a bit of setup to make sure the task has access to the database
    from api.core.database import get_session
    from api.core import crud
    from api.models.podcast import Episode
    from api.services import audio_processor

    db = next(get_session())
    
    logging.info(f"Starting episode assembly for {output_filename}")
    logging.info(f"Template ID: {template_id}")
    logging.info(f"User ID: {user_id}")

    try:
        # Get the template from the database
        template = crud.get_template_by_id(db, UUID(template_id)) # Convert to UUID
        if not template:
            raise Exception("Template not found")

        # Get the existing episode from the database
        episode = crud.get_episode_by_id(db, UUID(episode_id))
        if not episode:
            raise Exception(f"Episode with ID {episode_id} not found.")

        logging.info(f"Updating existing episode record with ID: {episode.id}")

        # Call the audio processing function
        final_path, log = audio_processor.process_and_assemble_episode(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename,
            cleanup_options={},  # Add cleanup options if needed
            tts_overrides=tts_values,
            cover_image_path=episode_details.get('cover_image_path') # Pass cover image path
        )

        # Update the episode status to "processed"
        episode.status = "processed"
        episode.final_audio_path = str(final_path)
        episode.cover_path = episode_details.get('cover_image_path') # Update cover path
        db.add(episode)
        db.commit()

        logging.info(f"Episode assembly finished successfully for {output_filename}")
        logging.info(f"Log: {''.join(log)}")

        return {"message": "Episode assembled successfully!", "episode_id": episode.id, "log": log}

    except Exception as e:
        logging.error(f"Error during episode assembly for {output_filename}: {e}", exc_info=True)
        # Update the episode status to "error"
        if 'episode' in locals() and episode.id:
            episode.status = "error"
            db.add(episode)
            db.commit()
        # Re-raise the exception so Celery knows the task failed
        raise
    finally:
        db.close()

@celery_app.task(name="publish_episode_to_spreaker_task")
def publish_episode_to_spreaker_task(episode_id: str, spreaker_show_id: str, title: str, description: Optional[str], auto_published_at: Optional[str], spreaker_access_token: str, publish_state: str):
    """
    Celery task to publish an episode to Spreaker.
    """
    os.chdir(PROJECT_ROOT)
    logging.info(f"Changing working directory to: {os.getcwd()}")

    from api.core.database import get_session
    from api.core import crud
    from api.models.podcast import Episode, EpisodeStatus
    from api.services.publisher import SpreakerClient

    db = next(get_session())

    try:
        episode = crud.get_episode_by_id(db, UUID(episode_id))
        if not episode:
            raise Exception(f"Episode with ID {episode_id} not found.")

        if not episode.final_audio_path:
            raise Exception(f"Episode {episode_id} does not have a final audio path.")

        logging.info(f"Attempting to publish episode {episode.title} to Spreaker show {spreaker_show_id}")

        spreaker_client = SpreakerClient(api_token=spreaker_access_token)
        
        if auto_published_at:
            # Schedule the episode for publishing
            success, message = spreaker_client.upload_episode(
                show_id=spreaker_show_id,
                title=title,
                file_path=episode.final_audio_path,
                description=description,
                auto_published_at=auto_published_at,
                publish_state=publish_state
            )
        else:
            # Publish the episode immediately
            success, message = spreaker_client.upload_episode(
                show_id=spreaker_show_id,
                title=title,
                file_path=episode.final_audio_path,
                description=description,
                publish_state=publish_state
            )

        if success:
            episode.status = EpisodeStatus.published
            episode.spreaker_episode_id = message.split(": ")[1] # Extract episode ID from message
            episode.is_published_to_spreaker = True
            db.add(episode)
            db.commit()
            logging.info(f"Successfully published episode {episode.title} to Spreaker. {message}")
        else:
            episode.status = EpisodeStatus.error
            db.add(episode)
            db.commit()
            logging.error(f"Failed to publish episode {episode.title} to Spreaker: {message}")

    except Exception as e:
        logging.error(f"Error during Spreaker publishing for episode {episode_id}: {e}", exc_info=True)
        if 'episode' in locals() and episode.id:
            episode.status = EpisodeStatus.error
            db.add(episode)
            db.commit()
        raise
    finally:
        db.close()