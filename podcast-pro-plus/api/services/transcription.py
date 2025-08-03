import os
import io
import openai
from pathlib import Path
from typing import List, Dict, Any
from pydub import AudioSegment

from ..core.config import settings

client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

UPLOAD_DIR = Path("temp_uploads")

# OpenAI Whisper API has a 25MB file size limit. To handle larger files,
# we will chunk the audio into 10-minute segments, as a 10-minute MP3
# will reliably be under the 25MB limit.
CHUNK_DURATION_MS = 10 * 60 * 1000

class TranscriptionError(Exception):
    """Custom exception for transcription failures."""
    pass

def get_word_timestamps(filename: str) -> List[Dict[str, Any]]:
    """
    Transcribes an audio file to get word-level timestamps, handling large files by chunking.
    """
    audio_path = UPLOAD_DIR / filename
    if not audio_path.exists():
        raise TranscriptionError(f"Audio file not found: {filename}")

    try:
        audio = AudioSegment.from_file(audio_path)
        
        chunks = [audio[i:i + CHUNK_DURATION_MS] for i in range(0, len(audio), CHUNK_DURATION_MS)]
        
        all_words = []
        time_offset_s = 0.0

        for i, chunk in enumerate(chunks):
            buffer = io.BytesIO()
            chunk.export(buffer, format="mp3")
            buffer.seek(0)
            buffer.name = f"chunk_{i}.mp3"

            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=buffer,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )

            # --- FIX: Handle the 'TranscriptionWord' object correctly ---
            # Instead of modifying the response object directly, we create a new
            # dictionary for each word and access attributes with a dot (e.g., word_obj.start).
            for word_obj in response.words:
                new_word_dict = {
                    'word': word_obj.word,
                    'start': word_obj.start + time_offset_s,
                    'end': word_obj.end + time_offset_s
                }
                all_words.append(new_word_dict)
            
            time_offset_s += chunk.duration_seconds

        return all_words

    except Exception as e:
        raise TranscriptionError(f"Failed to get word timestamps: {e}")
