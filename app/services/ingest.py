"""
Step 1: Ingest a video either from a YouTube URL or a direct file upload,
assign it a unique job_id, and store it under app/storage/jobs/{job_id}/source.mp4
"""
import shutil
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.config import job_dir


def _probe_duration_seconds(filepath: Path) -> Optional[float]:
    """Use ffprobe to get the duration of a video file in seconds."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(filepath),
            ],
            capture_output=True, text=True, check=True,
        )
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
        return None


def download_from_youtube(job_id: str, url: str) -> dict:
    """
    Download a YouTube video using yt-dlp and save it as source.mp4
    inside the job's directory. Returns metadata about the saved file.
    """
    d = job_dir(job_id)
    output_template = str(d / "source.%(ext)s")

    cmd = [
        "yt-dlp",
        "-f", "mp4[height<=720]/best[ext=mp4][height<=720]/best",
        "--no-playlist",
        "-o", output_template,
        url,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"yt-dlp failed to download video: {proc.stderr[-2000:]}")

    # yt-dlp may save with a different extension than .mp4 depending on the
    # chosen format; normalize to source.mp4 if needed.
    source_path = d / "source.mp4"
    if not source_path.exists():
        candidates = list(d.glob("source.*"))
        if not candidates:
            raise RuntimeError("yt-dlp reported success but no output file was found")
        candidates[0].rename(source_path)

    duration = _probe_duration_seconds(source_path)
    return {
        "source_path": str(source_path),
        "source_type": "youtube",
        "source_url": url,
        "duration_seconds": duration,
        "file_size_bytes": source_path.stat().st_size,
    }


def save_uploaded_file(job_id: str, upload: UploadFile) -> dict:
    """
    Save a directly-uploaded video file (from a <input type=file>) as
    source.mp4 inside the job's directory.
    """
    d = job_dir(job_id)
    source_path = d / "source.mp4"

    with source_path.open("wb") as out_file:
        shutil.copyfileobj(upload.file, out_file)

    duration = _probe_duration_seconds(source_path)
    return {
        "source_path": str(source_path),
        "source_type": "upload",
        "original_filename": upload.filename,
        "duration_seconds": duration,
        "file_size_bytes": source_path.stat().st_size,
    }
