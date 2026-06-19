"""
Step 3 (audio): Extract the audio track from the source video as a 16kHz
mono WAV file, which is the format Whisper expects for best results.
"""
import subprocess
from pathlib import Path

from app.config import job_dir


def extract_audio(job_id: str, source_path: str) -> dict:
    d = job_dir(job_id)
    audio_dir = d / "audio"
    audio_path = audio_dir / "audio.wav"

    cmd = [
        "ffmpeg", "-y",
        "-i", source_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(audio_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed to extract audio: {proc.stderr[-2000:]}")

    if not audio_path.exists():
        raise RuntimeError("ffmpeg ran but produced no audio file (video may have no audio track)")

    return {
        "audio_path": str(audio_path),
        "file_size_bytes": audio_path.stat().st_size,
    }
