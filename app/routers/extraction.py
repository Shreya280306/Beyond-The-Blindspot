"""
Step 3 endpoints:
  - extract frames from the source video every N seconds
  - extract the audio track (for Whisper in step 4)
"""
from fastapi import APIRouter, HTTPException, Query

from app import job_store
from app.config import FRAME_EXTRACT_INTERVAL_SECONDS
from app.schemas import AudioExtractionResponse, FrameExtractionResponse
from app.services import audio_extraction, frame_extraction

router = APIRouter(prefix="/api/v1", tags=["3. Frame & Audio Extraction"])


@router.post("/extract-frames/{job_id}", response_model=FrameExtractionResponse)
async def extract_frames(
    job_id: str,
    interval_seconds: float = Query(
        default=FRAME_EXTRACT_INTERVAL_SECONDS,
        gt=0,
        description="Extract one frame every N seconds (default from .env, e.g. 2 seconds)",
    ),
):
    """
    Step 3a: extract one frame every `interval_seconds` from the source
    video, saved as .jpg files with their timestamps recorded.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    source_path = state.get("source_path")
    if not source_path:
        raise HTTPException(status_code=400, detail="No source video found for this job_id. Upload a video first.")

    try:
        frames = frame_extraction.extract_frames(
            job_id, source_path, interval_seconds, state.get("duration_seconds")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame extraction failed: {e}")

    job_store.mark_step_complete(
        job_id, "extract_frames",
        frame_interval_seconds=interval_seconds,
        num_frames_extracted=len(frames),
        frames=frames,
    )

    return FrameExtractionResponse(
        job_id=job_id,
        interval_seconds=interval_seconds,
        num_frames=len(frames),
        frames=frames,
    )


@router.post("/extract-audio/{job_id}", response_model=AudioExtractionResponse)
async def extract_audio(job_id: str):
    """
    Step 3b: extract the audio track from the source video as a 16kHz
    mono WAV file, ready to be sent to Whisper in step 4.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    source_path = state.get("source_path")
    if not source_path:
        raise HTTPException(status_code=400, detail="No source video found for this job_id. Upload a video first.")

    try:
        result = audio_extraction.extract_audio(job_id, source_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {e}")

    job_store.mark_step_complete(job_id, "extract_audio", **result)

    return AudioExtractionResponse(
        job_id=job_id,
        audio_path=result["audio_path"],
        file_size_bytes=result["file_size_bytes"],
    )
