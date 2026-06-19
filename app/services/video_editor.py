"""
Step 9: Build the final accessible video by inserting a "pause-and-describe"
clip at each inaccessible timestamp, then concatenating everything back into
a single downloadable .mp4.

Strategy (pure FFmpeg, no MoviePy dependency):

For each inaccessible timestamp T_i, we:
  1. Cut the source video into segments at each T_i (with a small look-back
     so the pause starts just before the diagram appears, not mid-frame).
  2. For each pause point, build a "description clip":
       - Extract the last frame of the preceding segment as a still image.
       - Hold that still image for a short lead-in (0.5s silence) so the
         viewer registers the pause, then play the description audio.
         Total clip duration = 0.5s + audio_duration + 0.5s tail.
       - Mix the silence + TTS audio into a single WAV, then mux with
         the looped still frame into a short .mp4.
  3. Concatenate: seg_0 → pause_0 → seg_1 → pause_1 → ... → seg_N
     using ffmpeg's concat demuxer (-f concat -safe 0).

We re-encode all pause clips to match the source video's codec/resolution
so the concat demuxer works without needing unsafe stream-copy tricks.
Source segments are re-encoded too (with -c:v libx264 -c:a aac) to
guarantee a uniform stream so concat never stumbles on incompatible headers.

Output: app/storage/jobs/{job_id}/output/accessible_video.mp4
"""
import subprocess
from pathlib import Path
from typing import List, Optional

from app.config import job_dir

# Silence padding around the description audio (seconds)
LEAD_IN_SECONDS = 0.5
TAIL_SECONDS = 0.5

# How far before the flagged timestamp to make the cut (seconds).
# Cutting 0.2s early means the pause starts just before the diagram
# appears on screen, which feels more natural than cutting right on it.
CUT_OFFSET_SECONDS = 0.2


def build_accessible_video(
    job_id: str,
    source_path: str,
    described_issues: List[dict],
    duration_seconds: Optional[float] = None,
) -> str:
    """
    described_issues: list of dicts with at minimum:
        timestamp    (float)
        audio_path   (str | None)
        audio_duration (float)

    Returns the path to the finished accessible .mp4 file.
    """
    d = job_dir(job_id)
    work_dir = d / "output"
    work_dir.mkdir(exist_ok=True)

    # Filter to only issues that actually have TTS audio
    issues_with_audio = [
        i for i in described_issues
        if i.get("audio_path") and i.get("audio_duration", 0) > 0
    ]

    # If nothing to insert, just copy the source video
    if not issues_with_audio:
        output_path = work_dir / "accessible_video.mp4"
        _run(["ffmpeg", "-y", "-i", source_path, "-c", "copy", str(output_path)])
        return str(output_path)

    # Sort by timestamp ascending
    issues_with_audio = sorted(issues_with_audio, key=lambda x: x["timestamp"])

    # Build cut points: clamp to [0, duration] and apply look-back offset
    total_duration = duration_seconds or _probe_duration_seconds(source_path)
    cut_times = []
    for issue in issues_with_audio:
        t = max(0.0, issue["timestamp"] - CUT_OFFSET_SECONDS)
        cut_times.append(round(t, 3))

    # ------------------------------------------------------------------ #
    # Step A: slice the source video at each cut point into N+1 segments  #
    # ------------------------------------------------------------------ #
    segment_paths = _split_source(source_path, cut_times, total_duration, work_dir)

    # ------------------------------------------------------------------ #
    # Step B: build one "pause clip" per issue                            #
    # ------------------------------------------------------------------ #
    pause_paths = []
    for idx, issue in enumerate(issues_with_audio):
        # Use the last frame of the preceding segment as the still image
        preceding_segment = segment_paths[idx]
        still_path = work_dir / f"still_{idx}.jpg"
        _extract_last_frame(preceding_segment, still_path)

        pause_path = work_dir / f"pause_{idx}.mp4"
        _build_pause_clip(
            still_path=still_path,
            audio_path=issue["audio_path"],
            audio_duration=issue["audio_duration"],
            output_path=pause_path,
        )
        pause_paths.append(pause_path)

    # ------------------------------------------------------------------ #
    # Step C: concatenate everything                                       #
    # ------------------------------------------------------------------ #
    # Order: seg_0 → pause_0 → seg_1 → pause_1 → ... → seg_N
    concat_list_path = work_dir / "concat_list.txt"
    ordered_clips = []
    for i, seg in enumerate(segment_paths):
        ordered_clips.append(seg)
        if i < len(pause_paths):
            ordered_clips.append(pause_paths[i])

    with concat_list_path.open("w") as f:
        for clip in ordered_clips:
            f.write(f"file '{clip.resolve()}'\n")

    output_path = work_dir / "accessible_video.mp4"
    _run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list_path),
        "-c:v", "libx264", "-preset", "veryfast",
        "-c:a", "aac", "-ar", "44100",
        "-movflags", "+faststart",
        str(output_path),
    ])

    return str(output_path)


# ------------------------------------------------------------------ #
# Internal helpers                                                     #
# ------------------------------------------------------------------ #

def _run(cmd: list, check: bool = True):
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if check and proc.returncode != 0:
        raise RuntimeError(
            f"FFmpeg command failed:\n{' '.join(cmd)}\n\nstderr:\n{proc.stderr[-2000:]}"
        )
    return proc


def _probe_duration_seconds(path) -> float:
    try:
        proc = subprocess.run(
            ["ffprobe", "-v", "error",
             "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1",
             str(path)],
            capture_output=True, text=True, check=True,
        )
        return float(proc.stdout.strip())
    except (subprocess.CalledProcessError, ValueError):
        return 0.0


def _split_source(
    source_path: str,
    cut_times: List[float],
    total_duration: float,
    work_dir: Path,
) -> List[Path]:
    """
    Splits source_path at each time in cut_times into N+1 segments.
    Each segment is re-encoded to h264/aac for concat compatibility.
    Returns the list of segment paths in order.
    """
    boundaries = [0.0] + cut_times + [total_duration]
    segments = []

    for i in range(len(boundaries) - 1):
        start = boundaries[i]
        end = boundaries[i + 1]
        duration = end - start
        if duration < 0.05:
            continue

        seg_path = work_dir / f"seg_{i:04d}.mp4"

        # Place -ss and -t AFTER -i so they are output-side timestamps —
        # this is slower than input seeking but guarantees accurate cuts
        # regardless of keyframe placement in the source.
        _run([
            "ffmpeg", "-y",
            "-i", source_path,
            "-ss", str(start),
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "veryfast",
            "-c:a", "aac", "-ar", "44100",
            "-avoid_negative_ts", "make_zero",
            str(seg_path),
        ])
        segments.append(seg_path)

    return segments


def _extract_last_frame(video_path: Path, output_jpg: Path):
    """Extract the very last frame of a video clip as a JPEG."""
    _run([
        "ffmpeg", "-y",
        "-sseof", "-0.5",           # seek 0.5s from end
        "-i", str(video_path),
        "-frames:v", "1",
        "-q:v", "2",
        str(output_jpg),
    ])


def _build_pause_clip(
    still_path: Path,
    audio_path: str,
    audio_duration: float,
    output_path: Path,
):
    """
    Build a short video clip that shows `still_path` as a freeze-frame
    while playing silence (lead-in) + the TTS description audio + silence
    (tail). This is the "pause" the viewer sees while hearing the description.

    The clip is encoded as h264/aac to match the source segments so the
    final concat step works without re-encoding everything again.
    """
    total_pause_duration = LEAD_IN_SECONDS + audio_duration + TAIL_SECONDS

    # Build the audio track: silence_lead + description_audio + silence_tail
    # We do this with ffmpeg's amix/concat audio filter.
    silence_lead_duration = LEAD_IN_SECONDS
    silence_tail_duration = TAIL_SECONDS

    # ffmpeg filter graph:
    #   input 0 = still image (video only — no audio stream)
    #   input 1 = silence lead (anullsrc)     → [1:a]
    #   input 2 = TTS mp3                     → [2:a]
    #   input 3 = silence tail (anullsrc)     → [3:a]
    # concat all three audio parts into one audio stream
    audio_filter = (
        f"[1:a]atrim=duration={silence_lead_duration}[lead];"
        f"[2:a]aresample=44100[desc];"
        f"[3:a]atrim=duration={silence_tail_duration}[tail];"
        f"[lead][desc][tail]concat=n=3:v=0:a=1[outa]"
    )

    _run([
        "ffmpeg", "-y",
        # Input 0: still image looped as video
        "-loop", "1", "-framerate", "25", "-i", str(still_path),
        # Input 1: silence lead (anullsrc generates silent audio)
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
        # Input 2: TTS description audio
        "-i", audio_path,
        # Input 3: silence tail
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
        # Filter: stitch the three audio parts together
        "-filter_complex", audio_filter,
        "-map", "0:v",              # video from still image
        "-map", "[outa]",           # assembled audio
        "-t", str(total_pause_duration),
        "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage",
        "-c:a", "aac", "-ar", "44100",
        "-shortest",
        str(output_path),
    ])
