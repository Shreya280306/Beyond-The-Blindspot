import subprocess
from pathlib import Path
from typing import List

from app.config import job_dir


def text_to_speech(job_id: str, described_issues: List[dict]) -> List[dict]:
    import pyttsx3

    d = job_dir(job_id)
    audio_dir = d / "audio"

    result = []
    for issue in described_issues:
        frame_index = issue["frame_index"]
        description = issue.get("description", "").strip()

        if not description:
            result.append({**issue, "audio_path": None, "audio_duration": 0.0})
            continue

        wav_path = audio_dir / f"desc_{frame_index}.wav"
        mp3_path = audio_dir / f"desc_{frame_index}.mp3"

        # Fresh engine per file — reusing one engine across a loop can
        # deadlock SAPI5 on Windows.
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.setProperty("volume", 1.0)
        engine.save_to_file(description, str(wav_path))
        engine.runAndWait()
        engine.stop()
        del engine

        subprocess.run([
            "ffmpeg", "-y", "-i", str(wav_path),
            "-codec:a", "libmp3lame", "-q:a", "4",
            str(mp3_path)
        ], capture_output=True)

        # wav_path.unlink(missing_ok=True)

        duration = _probe_duration(mp3_path)
        result.append({
            **issue,
            "audio_path": str(mp3_path),
            "audio_duration": duration,
        })

    return result

def _probe_duration(path: Path) -> float:
    try:
        proc = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True, text=True, check=True,
        )
        return round(float(proc.stdout.strip()), 3)
    except (subprocess.CalledProcessError, ValueError):
        return 0.0