"""
Step 6 endpoint: send the changed frames (from step 5) to Gemini, along
with transcript context (from step 4) around each frame's timestamp, and
ask it to flag frames that are inaccessible to a blind user.
"""
from fastapi import APIRouter, HTTPException, Query

from app import job_store
from app.config import GEMINI_MODEL
from app.schemas import AccessibilityIssue, GeminiAnalysisResponse
from app.services import gemini_analysis
from app.services.transcription import transcript_for_window

router = APIRouter(prefix="/api/v1", tags=["6. Gemini Accessibility Analysis"])

TRANSCRIPT_CONTEXT_WINDOW_SECONDS = 3.0


@router.post("/analyze/{job_id}", response_model=GeminiAnalysisResponse)
async def analyze_accessibility(
    job_id: str,
    model: str = Query(default=GEMINI_MODEL, description="Gemini model to use"),
    only_issues: bool = Query(
        default=True,
        description="If true, only return frames flagged as inaccessible.",
    ),
):
    """
    Step 6: call Gemini on each changed frame (from step 5) to determine
    whether it contains visual information inaccessible to a blind user.

    Requires step 5 (detect-changes) to have run first. Uses the transcript
    from step 4 as context so Gemini can tell whether the audio already
    covers what's on screen.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    changed_frames = state.get("changed_frames")
    if not changed_frames:
        raise HTTPException(
            status_code=400,
            detail="No changed frames found for this job_id. Call /detect-changes/{job_id} first.",
        )

    transcript = state.get("transcript", [])

    enriched_frames = []
    for f in changed_frames:
        ts = f["timestamp"]
        context = transcript_for_window(
            transcript,
            ts - TRANSCRIPT_CONTEXT_WINDOW_SECONDS,
            ts + TRANSCRIPT_CONTEXT_WINDOW_SECONDS,
        ) if transcript else ""
        enriched_frames.append({**f, "transcript_context": context})

    try:
        results = gemini_analysis.analyze_frames_for_accessibility(enriched_frames, model=model)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini analysis failed: {e}")

    if only_issues:
        filtered = [r for r in results if r.get("is_inaccessible") is True]
    else:
        filtered = results

    issues = [
        AccessibilityIssue(
            frame_index=r["frame_index"],
            timestamp=r["timestamp"],
            frame_path=r["frame_path"],
            issue_type=r.get("issue_type"),
            reason=r.get("reason"),
            change_score=r.get("change_score"),
        )
        for r in filtered
    ]

    job_store.mark_step_complete(
        job_id, "analyze",
        gemini_model_used=model,
        accessibility_issues=[i.model_dump() for i in issues],
        num_issues_found=len(issues),
    )

    return GeminiAnalysisResponse(
        job_id=job_id,
        model=model,
        num_frames_analyzed=len(results),
        num_issues_found=len(issues),
        issues=issues,
    )
