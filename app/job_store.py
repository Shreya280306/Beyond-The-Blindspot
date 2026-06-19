"""
Simple JSON-file backed job store.

Each job (one uploaded/downloaded video) gets a unique job_id (uuid4).
We persist a state.json inside that job's folder so the FastAPI process
can be restarted without losing track of where a job is in the pipeline,
and so each step endpoint can read what previous steps produced.

This is intentionally simple (no DB) since this is a hackathon project.
Swap for Redis/Postgres later if needed.
"""
import json
import threading
from pathlib import Path
from typing import Any, Optional

from app.config import job_dir

_lock = threading.Lock()


def _state_path(job_id: str) -> Path:
    return job_dir(job_id) / "state.json"


def init_job(job_id: str, **initial_fields: Any) -> dict:
    state = {
        "job_id": job_id,
        "status": "created",
        "steps_completed": [],
        **initial_fields,
    }
    save_job(job_id, state)
    return state


def save_job(job_id: str, state: dict) -> None:
    with _lock:
        path = _state_path(job_id)
        path.write_text(json.dumps(state, indent=2, default=str))


def load_job(job_id: str) -> Optional[dict]:
    path = _state_path(job_id)
    if not path.exists():
        return None
    with _lock:
        return json.loads(path.read_text())


def update_job(job_id: str, **fields: Any) -> dict:
    state = load_job(job_id)
    if state is None:
        raise FileNotFoundError(f"No job found with id {job_id}")
    state.update(fields)
    save_job(job_id, state)
    return state


def mark_step_complete(job_id: str, step_name: str, **extra_fields: Any) -> dict:
    state = load_job(job_id)
    if state is None:
        raise FileNotFoundError(f"No job found with id {job_id}")
    completed = set(state.get("steps_completed", []))
    completed.add(step_name)
    state["steps_completed"] = sorted(completed)
    state.update(extra_fields)
    save_job(job_id, state)
    return state


def require_job(job_id: str) -> dict:
    state = load_job(job_id)
    if state is None:
        raise FileNotFoundError(f"No job found with id '{job_id}'. Upload a video first.")
    return state
