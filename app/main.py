"""
Main FastAPI application.

Run locally with:
    uvicorn app.main:app --reload --port 8000

Then open http://localhost:8000/docs for interactive Swagger UI to try
every endpoint, or http://localhost:8000/static/index.html for a minimal
demo frontend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import (
    analyze_router, chunking_router, diff_router, extraction,
    pipeline_router, transcribe_router, upload, accessible_router,
)

app = FastAPI(
    title="Accessible Video Analyzer",
    description=(
        "Analyze a video to detect frames inaccessible to blind users "
        "(diagrams, charts, on-screen text, etc.) using FFmpeg + OpenCV "
        "+ Whisper + Gemini. Then generate audio descriptions and build "
        "a new video with pause-and-describe clips at each flagged moment."
    ),
    version="2.0.0",
)

# Permissive CORS for local hackathon development. Tighten this before
# deploying anywhere public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chunking_router.router)
app.include_router(extraction.router)
app.include_router(transcribe_router.router)
app.include_router(diff_router.router)
app.include_router(analyze_router.router)
app.include_router(pipeline_router.router)
app.include_router(accessible_router.router)

# Serve extracted frames / chunks / audio so a frontend can preview them,
# and serve the minimal demo page.
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/storage", StaticFiles(directory="app/storage"), name="storage")


@app.get("/")
async def root():
    return {
        "message": "Accessible Video Analyzer API is running.",
        "docs": "/docs",
        "demo_ui": "/static/index.html",
        "steps": {
            "1_upload_file": "POST /api/v1/upload/file",
            "1_upload_youtube": "POST /api/v1/upload/youtube",
            "2_chunk": "POST /api/v1/chunk/{job_id}",
            "3_extract_frames": "POST /api/v1/extract-frames/{job_id}",
            "3_extract_audio": "POST /api/v1/extract-audio/{job_id}",
            "4_transcribe": "POST /api/v1/transcribe/{job_id}",
            "5_detect_changes": "POST /api/v1/detect-changes/{job_id}",
            "6_analyze": "POST /api/v1/analyze/{job_id}",
            "run_everything_analysis": "POST /api/v1/pipeline/run/{job_id}",
            "7_describe": "POST /api/v1/describe/{job_id}",
            "8_tts": "POST /api/v1/tts/{job_id}",
            "9_build_video": "POST /api/v1/build-video/{job_id}",
            "run_everything_accessible": "POST /api/v1/make-accessible/{job_id}",
            "download": "GET /api/v1/download/{job_id}",
            "status": "GET /api/v1/status/{job_id}",
        },
    }
