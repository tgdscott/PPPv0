from celery import Celery
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
import sys
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
broker_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
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
def create_podcast_episode(template_id: str, main_content_filename: str, output_filename: str, tts_values: dict, episode_details: dict, user_id: str, podcast_id: str):
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

        # Create a new episode record in the database
        new_episode = Episode(
            user_id=UUID(user_id),
            template_id=UUID(template_id),
            podcast_id=UUID(podcast_id),
            title=episode_details.get('title', output_filename),
            description=episode_details.get('description', ''),
            season_number=episode_details.get('season'),
            episode_number=episode_details.get('episodeNumber'),
            status="processing"
        )
        db.add(new_episode)
        db.commit()
        db.refresh(new_episode)
        
        logging.info(f"Episode record created with ID: {new_episode.id}")

        # Call the audio processing function
        final_path, log = audio_processor.process_and_assemble_episode(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename,
            cleanup_options={},  # Add cleanup options if needed
            tts_overrides=tts_values
        )

        # Update the episode status to "processed"
        new_episode.status = "processed"
        new_episode.final_audio_path = str(final_path)
        db.add(new_episode)
        db.commit()
        
        logging.info(f"Episode assembly finished successfully for {output_filename}")
        logging.info(f"Log: {''.join(log)}")

        return {"message": "Episode assembled successfully!", "episode_id": new_episode.id, "log": log}

    except Exception as e:
        logging.error(f"Error during episode assembly for {output_filename}: {e}", exc_info=True)
        # Update the episode status to "error"
        if 'new_episode' in locals() and new_episode.id:
            new_episode.status = "error"
            db.add(new_episode)
            db.commit()
        # Re-raise the exception so Celery knows the task failed
        raise
    finally:
        db.close()
