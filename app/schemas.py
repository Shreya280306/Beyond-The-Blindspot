"""
Pydantic request/response models shared across routers.
"""
from typing import List, Optional

from pydantic import BaseModel, Field


class UploadUrlRequest(BaseModel):
    youtube_url: str = Field(..., description="A YouTube video URL to download and process")


class UploadResponse(BaseModel):
    job_id: str
    source_type: str
    duration_seconds: Optional[float] = None
    file_size_bytes: int
    message: str


class ChunkInfo(BaseModel):
    chunk_index: int
    chunk_path: str
    start_time: float
    end_time: float


class ChunkResponse(BaseModel):
    job_id: str
    chunk_seconds: float
    num_chunks: int
    chunks: List[ChunkInfo]


class FrameInfo(BaseModel):
    frame_index: int
    frame_path: str
    timestamp: float


class FrameExtractionResponse(BaseModel):
    job_id: str
    interval_seconds: float
    num_frames: int
    frames: List[FrameInfo]


class AudioExtractionResponse(BaseModel):
    job_id: str
    audio_path: str
    file_size_bytes: int


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptionResponse(BaseModel):
    job_id: str
    num_segments: int
    transcript: List[TranscriptSegment]


class ChangedFrameInfo(BaseModel):
    frame_index: int
    frame_path: str
    timestamp: float
    change_score: Optional[float] = None


class FrameDiffResponse(BaseModel):
    job_id: str
    threshold: float
    num_input_frames: int
    num_changed_frames: int
    changed_frames: List[ChangedFrameInfo]


class AccessibilityIssue(BaseModel):
    frame_index: int
    timestamp: float
    frame_path: str
    issue_type: Optional[str] = None
    reason: Optional[str] = None
    change_score: Optional[float] = None


class GeminiAnalysisResponse(BaseModel):
    job_id: str
    model: str
    num_frames_analyzed: int
    num_issues_found: int
    issues: List[AccessibilityIssue]


class FullPipelineResponse(BaseModel):
    job_id: str
    duration_seconds: Optional[float] = None
    num_chunks: int
    num_frames_extracted: int
    num_changed_frames_sent_to_gemini: int
    num_transcript_segments: int
    accessibility_issues: List[AccessibilityIssue]


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    steps_completed: List[str]
    detail: dict


# ── Steps 7, 8, 9: describe → TTS → build accessible video ──────────────────

class DescribedIssue(BaseModel):
    frame_index: int
    timestamp: float
    frame_path: str
    issue_type: Optional[str] = None
    reason: Optional[str] = None
    description: str                    # Gemini's audio description text


class DescribeResponse(BaseModel):
    job_id: str
    num_described: int
    described_issues: List[DescribedIssue]


class TTSIssue(BaseModel):
    frame_index: int
    timestamp: float
    description: str
    audio_path: Optional[str] = None
    audio_duration: float = 0.0


class TTSResponse(BaseModel):
    job_id: str
    num_audio_clips: int
    tts_issues: List[TTSIssue]


class AccessibleVideoResponse(BaseModel):
    job_id: str
    output_video_path: str
    download_url: str
    num_pauses_inserted: int
    total_pause_duration_seconds: float


class FullAccessiblePipelineResponse(BaseModel):
    """Response from the one-shot endpoint that runs steps 7 + 8 + 9."""
    job_id: str
    num_issues_described: int
    num_audio_clips_generated: int
    output_video_path: str
    download_url: str
    total_pause_duration_seconds: float

