"""
Step 2: Split the source video into fixed-duration chunks (.mp4) using ffmpeg.

We use ffmpeg's segment muxer with -reset_timestamps so each chunk is an
independently playable .mp4 starting at t=0, but we record the *original*
start time of each chunk (relative to the source video) so downstream
timestamps stay accurate.
"""
import subprocess
from pathlib import Path
from typing import List

from app.config import job_dir


def split_into_chunks(job_id: str, source_path: str, chunk_seconds: float) -> List[dict]:
    d = job_dir(job_id)
    chunks_dir = d / "chunks"
    for f in chunks_dir.glob("*.mp4"):
        f.unlink()

    pattern = str(chunks_dir / "chunk_%05d.mp4")

    # We always re-encode (rather than -c copy) and force a keyframe at
    # every segment boundary. For hackathon-style use cases the requested
    # chunk_seconds is often small (e.g. 1-2s), which is usually smaller
    # than the source video's keyframe interval (GOP size) -- stream
    # copying in that case silently produces wrong (too-long) chunks
    # since ffmpeg's segment muxer can only cut on existing keyframes.
    # Re-encoding is slower but guarantees chunks of exactly the
    # requested length.
    cmd = [
        "ffmpeg", "-y",
        "-i", source_path,
        "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac",
        "-map", "0",
        "-f", "segment",
        "-segment_time", str(chunk_seconds),
        "-reset_timestamps", "1",
        "-force_key_frames", f"expr:gte(t,n_forced*{chunk_seconds})",
        pattern,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    chunk_files = sorted(chunks_dir.glob("chunk_*.mp4"))

    if proc.returncode != 0 or not chunk_files:
        raise RuntimeError(f"ffmpeg failed to split video into chunks: {proc.stderr[-1500:]}")

    chunks = []
    for idx, path in enumerate(chunk_files):
        start_time = idx * chunk_seconds
        chunks.append({
            "chunk_index": idx,
            "chunk_path": str(path),
            "start_time": round(start_time, 3),
            "end_time": round(start_time + chunk_seconds, 3),
        })
    return chunks
