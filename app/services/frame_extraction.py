"""
Step 3 (frames): Extract one frame every `interval_seconds` from the
*source* video (not from the chunks) so timestamps are simple and precise.
We still keep the chunking step (step 2) as its own pipeline stage because
it's useful independently (e.g. for chunked audio processing or future
parallelization), but frame extraction reads straight from the source file.
"""
import subprocess
from pathlib import Path
from typing import List, Optional

from app.config import job_dir


def extract_frames(
    job_id: str,
    source_path: str,
    interval_seconds: float,
    duration_seconds: Optional[float] = None,
) -> List[dict]:
    d = job_dir(job_id)
    frames_dir = d / "frames"
    for f in frames_dir.glob("*.jpg"):
        f.unlink()

    pattern = str(frames_dir / "frame_%06d.jpg")

    # fps=1/N gives us exactly one frame every N seconds, timestamped from
    # the start of the video.
    vf = f"fps=1/{interval_seconds}"
    cmd = [
        "ffmpeg", "-y",
        "-i", source_path,
        "-vf", vf,
        "-vsync", "vfr",
        "-q:v", "2",
        pattern,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed to extract frames: {proc.stderr[-2000:]}")

    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    if not frame_files:
        raise RuntimeError("ffmpeg ran but produced no frames")

    frames = []
    for idx, path in enumerate(frame_files):
        timestamp = round(idx * interval_seconds, 3)
        if duration_seconds is not None and timestamp > duration_seconds:
            break
        frames.append({
            "frame_index": idx,
            "frame_path": str(path),
            "timestamp": timestamp,
        })
    return frames
