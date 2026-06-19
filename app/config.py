"""
Central configuration, loaded from environment variables / .env file.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent  # project root

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

CHUNK_DURATION_SECONDS = float(os.getenv("CHUNK_DURATION_SECONDS", "1"))
FRAME_EXTRACT_INTERVAL_SECONDS = float(os.getenv("FRAME_EXTRACT_INTERVAL_SECONDS", "2"))

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")

FRAME_DIFF_THRESHOLD = float(os.getenv("FRAME_DIFF_THRESHOLD", "4.0"))

STORAGE_DIR = BASE_DIR / os.getenv("STORAGE_DIR", "app/storage")
UPLOADS_DIR = STORAGE_DIR / "uploads"
JOBS_DIR = STORAGE_DIR / "jobs"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
JOBS_DIR.mkdir(parents=True, exist_ok=True)


def job_dir(job_id: str) -> Path:
    """Return (and create) the working directory for a given job id."""
    d = JOBS_DIR / job_id
    (d / "chunks").mkdir(parents=True, exist_ok=True)
    (d / "frames").mkdir(parents=True, exist_ok=True)
    (d / "audio").mkdir(parents=True, exist_ok=True)
    return d
