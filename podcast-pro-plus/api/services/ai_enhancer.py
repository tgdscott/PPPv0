import openai
import json
from typing import Dict, Any
from pydub import AudioSegment
from elevenlabs.client import ElevenLabs
import io

from ..core.config import settings

# Initialize clients
openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)



class AIEnhancerError(Exception):
    """Custom exception for AI enhancement failures."""
    pass

def generate_metadata_from_transcript(transcript: str) -> Dict[str, Any]:
    """Generates metadata from a transcript using an LLM."""
    system_prompt = """
    You are an expert podcast producer. Your task is to analyze the following podcast transcript
    and generate a compelling episode title, a concise summary for show notes, and a list of
    relevant keywords or tags. The output must be a valid JSON object.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the transcript:\\n\\n{transcript}"}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise AIEnhancerError(f"Failed to generate metadata: {e}")

def interpret_intern_command(command_text: str) -> Dict[str, Any]:
    """Interprets a spoken command to determine action and topic."""
    system_prompt = """
    You are an assistant that interprets spoken commands for a podcast AI. Determine the action
    ('add_to_shownotes' or 'generate_audio') and the topic. Output must be valid JSON.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": command_text}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise AIEnhancerError(f"Failed to interpret command: {e}")

def get_answer_for_topic(topic: str) -> str:
    """Gets a concise answer to a topic from an LLM."""
    # --- FIX: Updated prompt to be more specific about length ---
    system_prompt = """
    You are a helpful assistant. Answer the user's question very concisely.
    Your response must be 2-3 sentences maximum, less if possible.
    The response is for a spoken answer in a podcast, so keep it brief and natural.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": topic}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        raise AIEnhancerError(f"Failed to get answer for topic: {e}")

import openai
import json
from typing import Dict, Any
from pydub import AudioSegment
from elevenlabs.client import ElevenLabs
import io
import time
import logging
from elevenlabs.core import ApiError

from ..core.config import settings

# Initialize clients
openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class AIEnhancerError(Exception):
    """Custom exception for AI enhancement failures."""
    pass

def generate_metadata_from_transcript(transcript: str) -> Dict[str, Any]:
    """Generates metadata from a transcript using an LLM."""
    system_prompt = '''
    You are an expert podcast producer. Your task is to analyze the following podcast transcript
    and generate a compelling episode title, a concise summary for show notes, and a list of
    relevant keywords or tags. The output must be a valid JSON object.
    '''
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the transcript:\\n\\n{transcript}"}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise AIEnhancerError(f"Failed to generate metadata: {e}")

def interpret_intern_command(command_text: str) -> Dict[str, Any]:
    """Interprets a spoken command to determine action and topic."""
    system_prompt = '''
    You are an assistant that interprets spoken commands for a podcast AI. Determine the action
    ('add_to_shownotes' or 'generate_audio') and the topic. Output must be valid JSON.
    '''
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": command_text}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise AIEnhancerError(f"Failed to interpret command: {e}")

def get_answer_for_topic(topic: str) -> str:
    """Gets a concise answer to a topic from an LLM."""
    # --- FIX: Updated prompt to be more specific about length ---
    system_prompt = '''
    You are a helpful assistant. Answer the user's question very concisely.
    Your response must be 2-3 sentences maximum, less if possible.
    The response is for a spoken answer in a podcast, so keep it brief and natural.
    '''
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": topic}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        raise AIEnhancerError(f"Failed to get answer for topic: {e}")

def get_elevenlabs_client(api_key: str) -> ElevenLabs:
    """Returns an ElevenLabs client initialized with the given API key."""
    return ElevenLabs(api_key=api_key)

def generate_speech_from_text(text: str, voice_id: str = "19B4gjtpL5m876wS3Dfg", api_key: str = None) -> AudioSegment:
    """Generates an audio segment from text using ElevenLabs."""
    max_retries = 3
    retry_delay_seconds = 300  # 5 minutes

    for attempt in range(max_retries):
        try:
            audio_stream = elevenlabs_client.text_to_speech.stream(
                text=text,
                voice_id=voice_id
            )
            audio_bytes = b"".join(chunk for chunk in audio_stream)
            if not audio_bytes:
                raise AIEnhancerError("Failed to generate speech: Received empty audio stream from ElevenLabs.")
            audio_buffer = io.BytesIO(audio_bytes)
            return AudioSegment.from_file(audio_buffer, format="mp3")
        except ApiError as e:
            if e.status_code == 429:
                logging.warning(f"ElevenLabs API rate limit hit (429). Retrying in {retry_delay_seconds} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay_seconds)
            else:
                raise AIEnhancerError(f"Failed to generate speech: {e}")
        except Exception as e:
            raise AIEnhancerError(f"Failed to generate speech: {e}")
    
    raise AIEnhancerError(f"Failed to generate speech after {max_retries} attempts due to ElevenLabs API rate limit.")
