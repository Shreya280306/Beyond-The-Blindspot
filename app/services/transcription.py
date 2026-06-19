"""
Step 4: Run Whisper (via faster-whisper) on the extracted audio to get a
transcript broken into timestamped segments.

We lazy-load the model once per process (it's a few hundred MB and slow to
load) and reuse it across requests/jobs.
"""
from functools import lru_cache
from typing import List

from app.config import WHISPER_MODEL_SIZE, WHISPER_DEVICE


@lru_cache(maxsize=1)
def _get_model():
    from faster_whisper import WhisperModel
    compute_type = "int8" if WHISPER_DEVICE == "cpu" else "float16"
    return WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=compute_type)


def transcribe_audio(audio_path: str) -> List[dict]:
    model = _get_model()
    segments, _info = model.transcribe(audio_path, vad_filter=True, word_timestamps=False)

    transcript = []
    for seg in segments:
        transcript.append({
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
        })
    return transcript


def transcript_for_window(transcript: List[dict], start: float, end: float) -> str:
    """
    Helper used later: given a time window (e.g. a frame's timestamp +/- a
    couple seconds), return whatever was said during that window. Useful
    context to give Gemini alongside a frame ("the narrator said X while
    this frame was on screen").
    """
    relevant = [seg["text"] for seg in transcript if seg["end"] >= start and seg["start"] <= end]
    return " ".join(relevant).strip()
