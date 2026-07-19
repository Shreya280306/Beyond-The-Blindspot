"""
Step 4 endpoint: run Whisper on the extracted audio to get a timestamped
transcript.
"""
from fastapi import APIRouter, HTTPException

from app import job_store
from app.schemas import TranscriptionResponse
from app.services import transcription

router = APIRouter(prefix="/api/v1", tags=["4. Transcription"])


@router.post("/transcribe/{job_id}", response_model=TranscriptionResponse)
async def transcribe(job_id: str):
    """
    Step 4: transcribe the job's extracted audio using Whisper
    (faster-whisper), returning timestamped segments.

    Requires step 3 (extract-audio) to have run first.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    audio_path = state.get("audio_path")
    if not audio_path:
        raise HTTPException(
            status_code=400,
            detail="No audio found for this job_id. Call /extract-audio/{job_id} first.",
        )

    try:
        transcript = transcription.transcribe_audio(audio_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    job_store.mark_step_complete(
        job_id, "transcribe",
        transcript=transcript,
        num_transcript_segments=len(transcript),
    )

    return TranscriptionResponse(
        job_id=job_id,
        num_segments=len(transcript),
        transcript=transcript,
    )
