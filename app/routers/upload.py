"""
Step 1 endpoints: ingest a video (upload a file, or give a YouTube URL),
and generate a unique job_id used by every subsequent step.
"""
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app import job_store
from app.schemas import UploadResponse, UploadUrlRequest
from app.services import ingest

router = APIRouter(prefix="/api/v1", tags=["1. Upload"])


@router.post("/upload/file", response_model=UploadResponse)
async def upload_video_file(file: UploadFile = File(...)):
    """
    Step 1 (direct upload): upload a video file directly.
    Returns a unique job_id to use in all subsequent pipeline steps.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    job_id = str(uuid.uuid4())
    job_store.init_job(job_id, status="uploading")

    try:
        result = ingest.save_uploaded_file(job_id, file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    job_store.update_job(job_id, status="uploaded", **result)
    job_store.mark_step_complete(job_id, "upload")

    return UploadResponse(
        job_id=job_id,
        source_type=result["source_type"],
        duration_seconds=result.get("duration_seconds"),
        file_size_bytes=result["file_size_bytes"],
        message="Video uploaded successfully. Use this job_id for all subsequent steps.",
    )


@router.post("/upload/youtube", response_model=UploadResponse)
async def upload_from_youtube(payload: UploadUrlRequest):
    """
    Step 1 (YouTube link): download a video from a YouTube URL.
    Returns a unique job_id to use in all subsequent pipeline steps.
    """
    job_id = str(uuid.uuid4())
    job_store.init_job(job_id, status="downloading", source_url=payload.youtube_url)

    try:
        result = ingest.download_from_youtube(job_id, payload.youtube_url)
    except Exception as e:
        job_store.update_job(job_id, status="failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to download video: {e}")

    job_store.update_job(job_id, status="uploaded", **result)
    job_store.mark_step_complete(job_id, "upload")

    return UploadResponse(
        job_id=job_id,
        source_type=result["source_type"],
        duration_seconds=result.get("duration_seconds"),
        file_size_bytes=result["file_size_bytes"],
        message="Video downloaded successfully. Use this job_id for all subsequent steps.",
    )
