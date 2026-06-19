"""
Step 5 endpoint: detect which consecutive extracted frames changed
meaningfully (using OpenCV), so only those get sent to Gemini in step 6.
"""
from fastapi import APIRouter, HTTPException, Query

from app import job_store
from app.config import FRAME_DIFF_THRESHOLD
from app.schemas import FrameDiffResponse
from app.services import frame_diff

router = APIRouter(prefix="/api/v1", tags=["5. Frame Diffing"])


@router.post("/detect-changes/{job_id}", response_model=FrameDiffResponse)
async def detect_changes(
    job_id: str,
    threshold: float = Query(
        default=FRAME_DIFF_THRESHOLD,
        ge=0,
        le=100,
        description="Percent of pixels that must change for a frame to be considered 'changed' (default from .env)",
    ),
):
    """
    Step 5: compare each extracted frame to the one before it using
    OpenCV and keep only frames that changed meaningfully (plus the
    first frame). These are the candidates sent to Gemini in step 6.

    Requires step 3 (extract-frames) to have run first.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    frames = state.get("frames")
    if not frames:
        raise HTTPException(
            status_code=400,
            detail="No frames found for this job_id. Call /extract-frames/{job_id} first.",
        )

    try:
        changed_frames = frame_diff.detect_changed_frames(frames, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame diffing failed: {e}")

    job_store.mark_step_complete(
        job_id, "detect_changes",
        frame_diff_threshold=threshold,
        changed_frames=changed_frames,
        num_changed_frames=len(changed_frames),
    )

    return FrameDiffResponse(
        job_id=job_id,
        threshold=threshold,
        num_input_frames=len(frames),
        num_changed_frames=len(changed_frames),
        changed_frames=changed_frames,
    )
