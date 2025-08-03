import os
import time
from datetime import datetime
from pydub import AudioSegment
from pydub.effects import normalize
from pathlib import Path
from typing import List, Optional, Dict, Any, Set, Tuple

# Import the necessary models and services
from ..models.podcast import PodcastTemplate, TemplateSegment
from . import ai_enhancer, transcription, keyword_detector

# The Recommended Fix: Tell pydub directly where FFmpeg is
AudioSegment.converter = "C:\\ffmpeg\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe"
AudioSegment.ffprobe   = "C:\\ffmpeg\\ffmpeg-7.1.1-essentials_build\\bin\\ffprobe.exe"


# Define paths for temporary and final output files
UPLOAD_DIR = Path("temp_uploads")
OUTPUT_DIR = Path("final_episodes")
AI_SEGMENTS_DIR = Path("ai_segments")
CLEANED_DIR = Path("cleaned_audio")
EDITED_DIR = Path("edited_audio")
TRANSCRIPTS_DIR = Path("transcripts")
for d in [UPLOAD_DIR, OUTPUT_DIR, AI_SEGMENTS_DIR, CLEANED_DIR, EDITED_DIR, TRANSCRIPTS_DIR]:
    d.mkdir(exist_ok=True)

class AudioProcessingError(Exception):
    """Custom exception for audio processing failures."""
    pass

def _format_timestamp(seconds: float) -> str:
    """Helper function to format seconds into HH:MM:SS,ms format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds * 1000) % 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

def process_and_assemble_episode(
    template: PodcastTemplate,
    main_content_filename: str,
    output_filename: str,
    cleanup_options: Dict[str, bool],
    tts_overrides: Dict[str, str]
) -> Tuple[Path, List[str]]:
    """
    The master function for the entire episode creation workflow.
    """
    log = []
    total_start_time = time.time()
    start_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log.append(f"Workflow started at {start_timestamp}")

    # --- Step 1: Load Main Content & Get Initial Transcript ---
    step_start_time = time.time()
    content_path = UPLOAD_DIR / main_content_filename
    if not content_path.exists():
        raise AudioProcessingError(f"Main content file not found: {main_content_filename}")
    
    main_content_audio = AudioSegment.from_file(content_path)
    log.append(f"Loaded main content: {main_content_filename}")
    
    word_timestamps = transcription.get_word_timestamps(main_content_filename)
    log.append(f"[TIMING] Initial transcription took {time.time() - step_start_time:.2f}s")
    
    # --- Step 2: Content Cleanup ---
    step_start_time = time.time()
    cleaned_audio = main_content_audio
    if cleanup_options.get('removeFillers') or cleanup_options.get('removePauses'):
        default_fillers = {"um", "uh", "ah", "er", "like", "you know", "so", "actually"}
        cleaned_audio = cleanup_audio(cleaned_audio, word_timestamps, default_fillers, 1.25, 500)
        log.append("Applied filler word and pause removal.")
    
    cleaned_filename = f"cleaned_{Path(main_content_filename).stem}.mp3"
    cleaned_path = CLEANED_DIR / cleaned_filename
    cleaned_audio.export(cleaned_path, format="mp3")
    log.append(f"Saved cleaned content to {cleaned_filename}")
    log.append(f"[TIMING] Content cleanup took {time.time() - step_start_time:.2f}s")

    # --- Step 3: Final Transcript for AI Context & Saving ---
    # We use the original word_timestamps to build the final transcript
    final_transcript_text = " ".join([word['word'] for word in word_timestamps])
    
    transcript_filename = f"{output_filename}.txt"
    transcript_path = TRANSCRIPTS_DIR / transcript_filename
    with open(transcript_path, "w", encoding="utf-8") as f:
        # Group words into sentences or phrases for a cleaner transcript
        current_line = ""
        line_start_time = 0
        for i, word_data in enumerate(word_timestamps):
            if not current_line:
                line_start_time = word_data['start']
            
            current_line += word_data['word'] + " "
            
            # End line after about 15 words or if there's a long pause
            is_last_word = (i == len(word_timestamps) - 1)
            long_pause = False
            if not is_last_word:
                pause = word_timestamps[i+1]['start'] - word_data['end']
                if pause > 0.7:
                    long_pause = True

            if len(current_line.split()) >= 15 or is_last_word or long_pause:
                line_end_time = word_data['end']
                f.write(f"[{_format_timestamp(line_start_time)} --> {_format_timestamp(line_end_time)}]\n")
                f.write(f"{current_line.strip()}\n\n")
                current_line = ""

    log.append(f"Saved final timestamped transcript to {transcript_filename}")

    # --- Step 4: Prepare Template Segments ---
    step_start_time = time.time()
    processed_segments = []
    for segment_rule in template.segments:
        audio = None
        if segment_rule.segment_type == 'content':
            audio = cleaned_audio
        elif segment_rule.source.source_type == 'static':
            static_path = UPLOAD_DIR / segment_rule.source.filename
            if not static_path.exists():
                log.append(f"WARNING: Static file not found: {segment_rule.source.filename}. Skipping.")
                continue
            audio = AudioSegment.from_file(static_path)
        elif segment_rule.source.source_type == 'ai_generated':
            contextual_prompt = f"Based on the following podcast transcript, {segment_rule.source.prompt}:\n\n---\n\n{final_transcript_text}"
            generated_text = ai_enhancer.get_answer_for_topic(contextual_prompt)
            audio = ai_enhancer.generate_speech_from_text(generated_text, segment_rule.source.voice_id)
            log.append(f"Generated AI segment for prompt: '{segment_rule.source.prompt}'")
        elif segment_rule.source.source_type == 'tts':
            script = tts_overrides.get(str(segment_rule.id), segment_rule.source.script)
            audio = ai_enhancer.generate_speech_from_text(script, segment_rule.source.voice_id)
            log.append(f"Generated TTS segment from script.")
        if audio:
            processed_segments.append((segment_rule, audio))
    log.append(f"[TIMING] Template segments prepared in {time.time() - step_start_time:.2f}s")

    # --- Step 5: Stitch with Overlaps & Apply Music ---
    step_start_time = time.time()
    intros = [audio for rule, audio in processed_segments if rule.segment_type == 'intro']
    content_segments = [audio for rule, audio in processed_segments if rule.segment_type == 'content']
    outros = [audio for rule, audio in processed_segments if rule.segment_type == 'outro']
    
    stitched_intros = sum(intros) if intros else AudioSegment.empty()
    stitched_content = sum(content_segments) if content_segments else AudioSegment.empty()
    stitched_outros = sum(outros) if outros else AudioSegment.empty()

    intro_len_ms = len(stitched_intros)
    content_len_ms = len(stitched_content)
    outro_len_ms = len(stitched_outros)

    content_start_ms = intro_len_ms + (template.timing.content_start_offset_s * 1000)
    outro_start_ms = content_start_ms + content_len_ms + (template.timing.outro_start_offset_s * 1000)

    total_duration_ms = max(intro_len_ms, content_start_ms + content_len_ms, outro_start_ms + outro_len_ms)
    
    final_audio = AudioSegment.silent(duration=total_duration_ms)

    final_audio = final_audio.overlay(stitched_intros, position=0)
    final_audio = final_audio.overlay(stitched_content, position=content_start_ms)
    final_audio = final_audio.overlay(stitched_outros, position=outro_start_ms)
    
    for music_rule in template.background_music_rules:
        music_path = UPLOAD_DIR / music_rule.music_filename
        if not music_path.exists(): continue
        background_music = AudioSegment.from_file(music_path)
        
        if 'intro' in music_rule.apply_to_segments and intro_len_ms > 0:
            start_pos = music_rule.start_offset_s * 1000
            end_pos = intro_len_ms - (music_rule.end_offset_s * 1000)
            music_duration = end_pos - start_pos
            if music_duration > 0:
                music_to_apply = background_music
                if len(music_to_apply) < music_duration:
                    multiplier = int((music_duration / len(music_to_apply)) + 1)
                    music_to_apply *= multiplier
                music_to_apply = music_to_apply[:music_duration].fade_in(int(music_rule.fade_in_s * 1000)).fade_out(int(music_rule.fade_out_s * 1000))
                final_audio = final_audio.overlay(music_to_apply + music_rule.volume_db, position=start_pos)

    log.append(f"[TIMING] Stitching and music application took {time.time() - step_start_time:.2f}s")

    # --- Step 6: Finalize ---
    step_start_time = time.time()
    final_audio = normalize(final_audio)
    output_path = OUTPUT_DIR / f"{output_filename}.mp3"
    final_audio.export(output_path, format="mp3")
    log.append(f"[TIMING] Final normalization and export took {time.time() - step_start_time:.2f}s")
    
    log.append(f"--- Workflow Finished. Total time: {time.time() - total_start_time:.2f}s ---")
    return output_path, log


def cleanup_audio(
    audio_segment: AudioSegment,
    word_timestamps: List[Dict[str, Any]],
    filler_words: Set[str],
    min_pause_s: float,
    leave_pause_ms: int
) -> AudioSegment:
    if not word_timestamps: return audio_segment
    final_audio = AudioSegment.empty()
    last_cut_end_ms = 0
    first_word_start_s = word_timestamps[0]['start']
    if first_word_start_s > min_pause_s:
        final_audio += AudioSegment.silent(duration=leave_pause_ms)
        last_cut_end_ms = int(first_word_start_s * 1000)
    for i in range(len(word_timestamps)):
        word_data = word_timestamps[i]
        word_text = word_data['word'].strip().lower()
        start_s, end_s = word_data['start'], word_data['end']
        final_audio += audio_segment[last_cut_end_ms:int(start_s * 1000)]
        if word_text not in filler_words:
            final_audio += audio_segment[int(start_s * 1000):int(end_s * 1000)]
        last_cut_end_ms = int(end_s * 1000)
        if i < len(word_timestamps) - 1:
            start_of_next_word_s = word_timestamps[i+1]['start']
            pause_duration_s = start_of_next_word_s - end_s
            if pause_duration_s > min_pause_s:
                final_audio += AudioSegment.silent(duration=leave_pause_ms)
                last_cut_end_ms = int(start_of_next_word_s * 1000)
    final_audio += audio_segment[last_cut_end_ms:]
    return final_audio
