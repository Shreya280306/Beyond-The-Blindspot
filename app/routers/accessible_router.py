"""
Steps 7–9 endpoints:

  POST /api/v1/describe/{job_id}
    Step 7: for each inaccessible frame (from step 6), call Gemini to generate
    a concise audio description of what's visually on screen.

  POST /api/v1/tts/{job_id}
    Step 8: convert each description to speech (gTTS → .mp3 per frame).

  POST /api/v1/build-video/{job_id}
    Step 9: insert pause-and-describe clips at each flagged timestamp and
    concatenate into a final accessible .mp4.

  POST /api/v1/make-accessible/{job_id}
    One-shot: runs steps 7 + 8 + 9 back to back.
    Requires steps 1–6 to have already been completed.

  GET /api/v1/download/{job_id}
    Download the final accessible .mp4.
"""
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app import job_store
from app.config import GEMINI_MODEL
from app.schemas import (
    AccessibleVideoResponse,
    DescribeResponse,
    FullAccessiblePipelineResponse,
    TTSResponse,
)
from app.services import description as desc_service
from app.services import tts as tts_service
from app.services import video_editor

router = APIRouter(prefix="/api/v1", tags=["7-9. Describe → TTS → Build Video"])


# ── Step 7: describe inaccessible frames ─────────────────────────────────────

@router.post("/describe/{job_id}", response_model=DescribeResponse)
async def describe_frames(
    job_id: str,
    model: str = Query(default=GEMINI_MODEL),
):
    """
    Step 7: for each frame flagged as inaccessible by step 6, call Gemini
    to generate a 1–3 sentence audio description of the visual content.

    Requires step 6 (analyze) to have run first.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    issues = state.get("accessibility_issues")
    if not issues:
        raise HTTPException(
            status_code=400,
            detail="No accessibility issues found for this job. Run /analyze/{job_id} first.",
        )

    try:
        described = desc_service.describe_inaccessible_frames(issues, model=model)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Description step failed: {e}")

    job_store.mark_step_complete(
        job_id, "describe",
        described_issues=described,
        num_described=len(described),
    )

    return DescribeResponse(
        job_id=job_id,
        num_described=len(described),
        described_issues=described,
    )


# ── Step 8: TTS ───────────────────────────────────────────────────────────────

@router.post("/tts/{job_id}", response_model=TTSResponse)
async def generate_tts(job_id: str):
    """
    Step 8: convert each Gemini-generated description (from step 7) to
    speech using gTTS, saving one .mp3 per inaccessible frame.

    Requires step 7 (describe) to have run first.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    described_issues = state.get("described_issues")
    if not described_issues:
        raise HTTPException(
            status_code=400,
            detail="No described issues found. Run /describe/{job_id} first.",
        )

    try:
        tts_issues = tts_service.text_to_speech(job_id, described_issues)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="gTTS is not installed. Run: pip install gTTS",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS step failed: {e}")

    job_store.mark_step_complete(
        job_id, "tts",
        tts_issues=tts_issues,
        num_audio_clips=sum(1 for t in tts_issues if t.get("audio_path")),
    )

    return TTSResponse(
        job_id=job_id,
        num_audio_clips=sum(1 for t in tts_issues if t.get("audio_path")),
        tts_issues=tts_issues,
    )


# ── Step 9: build the accessible video ────────────────────────────────────────

@router.post("/build-video/{job_id}", response_model=AccessibleVideoResponse)
async def build_video(job_id: str):
    """
    Step 9: insert pause-and-describe clips at each flagged timestamp and
    concatenate into a final accessible .mp4 you can download.

    Requires step 8 (tts) to have run first.
    This step can take a while (FFmpeg re-encodes the full video).
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    tts_issues = state.get("tts_issues")
    if not tts_issues:
        raise HTTPException(
            status_code=400,
            detail="No TTS audio found. Run /tts/{job_id} first.",
        )

    source_path = state.get("source_path")
    if not source_path or not Path(source_path).exists():
        raise HTTPException(status_code=400, detail="Source video file not found.")

    try:
        output_path = video_editor.build_accessible_video(
            job_id=job_id,
            source_path=source_path,
            described_issues=tts_issues,
            duration_seconds=state.get("duration_seconds"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video build failed: {e}")

    total_pause_duration = sum(
        (t.get("audio_duration") or 0) +
        video_editor.LEAD_IN_SECONDS +
        video_editor.TAIL_SECONDS
        for t in tts_issues
        if t.get("audio_path")
    )
    num_pauses = sum(1 for t in tts_issues if t.get("audio_path"))

    job_store.mark_step_complete(
        job_id, "build_video",
        output_video_path=output_path,
        status="complete",
    )

    return AccessibleVideoResponse(
        job_id=job_id,
        output_video_path=output_path,
        download_url=f"/api/v1/download/{job_id}",
        num_pauses_inserted=num_pauses,
        total_pause_duration_seconds=round(total_pause_duration, 2),
    )


# ── One-shot: steps 7 + 8 + 9 in one call ────────────────────────────────────

@router.post("/make-accessible/{job_id}", response_model=FullAccessiblePipelineResponse)
async def make_accessible(
    job_id: str,
    model: str = Query(default=GEMINI_MODEL, description="Gemini model for description generation"),
):
    """
    Runs steps 7 (describe) + 8 (TTS) + 9 (build video) back to back.

    Prerequisites: steps 1–6 must already be complete for this job_id.
    Use /api/v1/status/{job_id} to check what's done.

    This is the main endpoint to call after running /pipeline/run/{job_id}
    or after calling each step individually through step 6.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    issues = state.get("accessibility_issues")
    if not issues:
        raise HTTPException(
            status_code=400,
            detail="No accessibility issues found. Run /pipeline/run/{job_id} or /analyze/{job_id} first.",
        )

    source_path = state.get("source_path")
    if not source_path or not Path(source_path).exists():
        raise HTTPException(status_code=400, detail="Source video file not found.")

    # Step 7: describe
    try:
        described = desc_service.describe_inaccessible_frames(issues, model=model)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 7 (describe) failed: {e}")
    job_store.mark_step_complete(job_id, "describe", described_issues=described, num_described=len(described))

    # Step 8: TTS
    try:
        tts_issues = tts_service.text_to_speech(job_id, described)
    except ImportError:
        raise HTTPException(status_code=500, detail="gTTS not installed. Run: pip install gTTS")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 8 (TTS) failed: {e}")
    num_audio = sum(1 for t in tts_issues if t.get("audio_path"))
    job_store.mark_step_complete(job_id, "tts", tts_issues=tts_issues, num_audio_clips=num_audio)

    # Step 9: build video
    try:
        output_path = video_editor.build_accessible_video(
            job_id=job_id,
            source_path=source_path,
            described_issues=tts_issues,
            duration_seconds=state.get("duration_seconds"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step 9 (build video) failed: {e}")

    total_pause_duration = round(sum(
        (t.get("audio_duration") or 0) +
        video_editor.LEAD_IN_SECONDS +
        video_editor.TAIL_SECONDS
        for t in tts_issues
        if t.get("audio_path")
    ), 2)

    job_store.mark_step_complete(
        job_id, "build_video",
        output_video_path=output_path,
        status="complete",
    )

    return FullAccessiblePipelineResponse(
        job_id=job_id,
        num_issues_described=len(described),
        num_audio_clips_generated=num_audio,
        output_video_path=output_path,
        download_url=f"/api/v1/download/{job_id}",
        total_pause_duration_seconds=total_pause_duration,
    )


# ── Download the finished video ───────────────────────────────────────────────

@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """
    Download the final accessible .mp4 produced by step 9 / make-accessible.
    """
    try:
        state = job_store.require_job(job_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    output_path = state.get("output_video_path")
    if not output_path or not Path(output_path).exists():
        raise HTTPException(
            status_code=404,
            detail="No output video found. Run /build-video/{job_id} or /make-accessible/{job_id} first.",
        )

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"accessible_{job_id[:8]}.mp4",
    )
