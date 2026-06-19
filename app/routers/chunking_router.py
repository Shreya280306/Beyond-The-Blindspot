"""
Step 2 endpoint: split the uploaded source video into fixed-duration
.mp4 chunks using FFmpeg.
"""
from fastapi import APIRouter, HTTPException, Query

from app import job_store
from app.config import CHUNK_DURATION_SECONDS
from app.schemas import ChunkResponse
from app.services import chunking

router = APIRouter(prefix="/api/v1", tags=["2. Chunking"])


@router.post("/chunk/{job_id}", response_model=ChunkResponse)
async def chunk_video(
    job_id: str,
    chunk_seconds: float = Query(
        default=CHUNK_DURATION_SECONDS,
        gt=0,
        description="Duration of each chunk in seconds (default from .env, e.g. 1 second)",
    ),
):
    """
    Step 2: split the video belonging to `job_id` into chunks of
    `chunk_seconds` length each, saved as .mp4 files.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    source_path = state.get("source_path")
    if not source_path:
        raise HTTPException(status_code=400, detail="No source video found for this job_id. Upload a video first.")

    try:
        chunks = chunking.split_into_chunks(job_id, source_path, chunk_seconds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {e}")

    job_store.mark_step_complete(
        job_id, "chunk",
        status="chunked",
        chunk_seconds=chunk_seconds,
        num_chunks=len(chunks),
    )

    return ChunkResponse(
        job_id=job_id,
        chunk_seconds=chunk_seconds,
        num_chunks=len(chunks),
        chunks=chunks,
    )
