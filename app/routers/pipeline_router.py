"""
Convenience endpoints:
  - /pipeline/run/{job_id}: run steps 2-6 in sequence.
  - /status/{job_id}: see what's been done for a job so far.
"""
from fastapi import APIRouter, HTTPException, Query

from app import job_store
from app.config import (
    CHUNK_DURATION_SECONDS,
    FRAME_DIFF_THRESHOLD,
    FRAME_EXTRACT_INTERVAL_SECONDS,
    GEMINI_MODEL,
)
from app.schemas import AccessibilityIssue, FullPipelineResponse, JobStatusResponse
from app.services import audio_extraction, chunking, frame_diff, frame_extraction, gemini_analysis, transcription
from app.services.transcription import transcript_for_window

router = APIRouter(prefix="/api/v1", tags=["Pipeline / Status"])

TRANSCRIPT_CONTEXT_WINDOW_SECONDS = 3.0


@router.post("/pipeline/run/{job_id}", response_model=FullPipelineResponse)
async def run_full_pipeline(
    job_id: str,
    chunk_seconds: float = Query(default=CHUNK_DURATION_SECONDS, gt=0),
    frame_interval_seconds: float = Query(default=FRAME_EXTRACT_INTERVAL_SECONDS, gt=0),
    frame_diff_threshold: float = Query(default=FRAME_DIFF_THRESHOLD, ge=0, le=100),
    gemini_model: str = Query(default=GEMINI_MODEL),
):
    """
    Runs steps 2-6 back to back for a job that has already been uploaded
    (step 1). Returns the final accessibility issues array.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    source_path = state.get("source_path")
    if not source_path:
        raise HTTPException(status_code=400, detail="No source video for this job_id. Upload a video first.")

    # Step 2: chunk
    try:
        chunks = chunking.split_into_chunks(job_id, source_path, chunk_seconds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 2 (chunking) failed: {e}")
    job_store.mark_step_complete(job_id, "chunk", chunk_seconds=chunk_seconds, num_chunks=len(chunks))

    # Step 3a: extract frames
    try:
        frames = frame_extraction.extract_frames(
            job_id, source_path, frame_interval_seconds, state.get("duration_seconds")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 3 (frame extraction) failed: {e}")
    job_store.mark_step_complete(
        job_id, "extract_frames",
        frame_interval_seconds=frame_interval_seconds,
        frames=frames,
        num_frames_extracted=len(frames),
    )

    # Step 3b: extract audio
    try:
        audio_result = audio_extraction.extract_audio(job_id, source_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 3 (audio extraction) failed: {e}")
    job_store.mark_step_complete(job_id, "extract_audio", **audio_result)

    # Step 4: transcribe
    try:
        transcript, language, language_probability = transcription.transcribe_audio(audio_result["audio_path"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 4 (transcription) failed: {e}")
    job_store.mark_step_complete(
        job_id, "transcribe",
        transcript=transcript,
        num_transcript_segments=len(transcript),
        language=language,
        language_probability=language_probability,
    )

    # Step 5: detect changed frames
    try:
        changed_frames = frame_diff.detect_changed_frames(frames, frame_diff_threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 5 (frame diffing) failed: {e}")
    job_store.mark_step_complete(
        job_id, "detect_changes",
        frame_diff_threshold=frame_diff_threshold,
        changed_frames=changed_frames,
        num_changed_frames=len(changed_frames),
    )

    # Step 6: Gemini analysis
    enriched_frames = []
    for f in changed_frames:
        ts = f["timestamp"]
        context = transcript_for_window(
            transcript, ts - TRANSCRIPT_CONTEXT_WINDOW_SECONDS, ts + TRANSCRIPT_CONTEXT_WINDOW_SECONDS
        ) if transcript else ""
        enriched_frames.append({**f, "transcript_context": context})

    try:
        results = gemini_analysis.analyze_frames_for_accessibility(enriched_frames, model=gemini_model)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 6 (Gemini analysis) failed: {e}")

    issues = [
        AccessibilityIssue(
            frame_index=r["frame_index"],
            timestamp=r["timestamp"],
            frame_path=r["frame_path"],
            issue_type=r.get("issue_type"),
            reason=r.get("reason"),
            change_score=r.get("change_score"),
        )
        for r in results
        if r.get("is_inaccessible") is True
    ]

    job_store.mark_step_complete(
        job_id, "analyze",
        gemini_model_used=gemini_model,
        accessibility_issues=[i.model_dump() for i in issues],
        num_issues_found=len(issues),
        status="complete",
    )

    return FullPipelineResponse(
        job_id=job_id,
        duration_seconds=state.get("duration_seconds"),
        num_chunks=len(chunks),
        num_frames_extracted=len(frames),
        num_changed_frames_sent_to_gemini=len(changed_frames),
        num_transcript_segments=len(transcript),
        transcript=transcript,
        language=language,
        language_probability=language_probability,
        accessibility_issues=issues,
    )


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Check what's been completed so far for a given job_id."""
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    detail = {
        "source_type": state.get("source_type"),
        "duration_seconds": state.get("duration_seconds"),
        "num_chunks": state.get("num_chunks"),
        "num_frames_extracted": state.get("num_frames_extracted"),
        "num_transcript_segments": state.get("num_transcript_segments"),
        "num_changed_frames": state.get("num_changed_frames"),
        "num_issues_found": state.get("num_issues_found"),
    }

    return JobStatusResponse(
        job_id=job_id,
        status=state.get("status", "unknown"),
        steps_completed=state.get("steps_completed", []),
        detail=detail,
    )
