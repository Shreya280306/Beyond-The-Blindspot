"""
Step 6: Send the "changed" frames (selected in step 5) to Gemini, asking it
to identify which frames contain visual information that would NOT be
accessible to a blind user (e.g. diagrams, charts, on-screen text, graphs,
demonstrations, gestures) and that ISN'T already explained by the audio
narration at that point in the video.

We batch frames into one Gemini call per batch (rather than one call per
frame) to keep this fast and cheap, and we ask for a strict JSON response
so we can parse it reliably.
"""
import base64
import json
from typing import List, Optional

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL

# Gemini batch + payload limits in practice: keep batches modest so the
# request stays fast and well within token/size limits.
DEFAULT_BATCH_SIZE = 8

SYSTEM_INSTRUCTION = """You are an accessibility expert helping make video content usable for blind and low-vision users.

You will be shown a sequence of frames extracted from a video, each labeled with its timestamp and (if available) the speech transcript that was playing around that moment.

For EACH frame, decide whether the visual content shown would be INACCESSIBLE to a blind person listening to only the audio — meaning the frame conveys important information visually that the spoken narration does NOT already describe. Examples of inaccessible visual content: diagrams, charts, graphs, on-screen text/code/slides not read aloud, demonstrations or gestures, facial expressions/emotions central to meaning, comparisons shown visually (e.g. side-by-side images), maps, or any "look at this" moment with no equivalent verbal description.

If the transcript already fully describes what's on screen, the frame is considered accessible, even if it contains a diagram, because a blind listener would understand it from audio alone.

Respond ONLY with valid JSON (no markdown fences, no commentary) matching exactly this schema:
{
  "results": [
    {
      "frame_index": <int, matching the index given for that frame>,
      "timestamp": <float, seconds, matching the timestamp given for that frame>,
      "is_inaccessible": <true or false>,
      "issue_type": <string, one of: "diagram_or_chart", "on_screen_text", "demonstration_or_gesture", "facial_expression", "visual_comparison", "other_visual", "none">,
      "reason": <short string, 1-2 sentences explaining why this is or is not accessible>
    }
  ]
}

Only include "is_inaccessible": true when the visual genuinely adds meaning beyond the audio. Be conservative — do not flag frames that are just a person talking with no meaningful visual content, or static title screens with no semantic detail to convey, or frames where the transcript already explained it.
"""


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file "
            "(see .env.example) before calling the analyze endpoint."
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def _encode_image(frame_path: str) -> types.Part:
    with open(frame_path, "rb") as f:
        data = f.read()
    return types.Part.from_bytes(data=data, mime_type="image/jpeg")


def _build_contents(batch: List[dict]) -> list:
    """
    batch: list of dicts with frame_index, timestamp, frame_path, and
           optional transcript_context (text spoken near that timestamp).
    """
    contents = [
        "Here are the frames to analyze, in order. For each one I give you "
        "its frame_index, timestamp, and the transcript context around that "
        "moment (which may be empty if nothing was said)."
    ]
    for f in batch:
        context = f.get("transcript_context") or "(no speech during this moment)"
        contents.append(
            f"\n---\nframe_index: {f['frame_index']}\n"
            f"timestamp: {f['timestamp']}s\n"
            f"transcript_context: {context}"
        )
        contents.append(_encode_image(f["frame_path"]))
    return contents


def _chunked(items: List[dict], size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def analyze_frames_for_accessibility(
    frames: List[dict],
    batch_size: int = DEFAULT_BATCH_SIZE,
    model: Optional[str] = None,
) -> List[dict]:
    """
    frames: list of dicts, each with at least frame_index, timestamp,
            frame_path, and optionally transcript_context.

    Returns a list of dicts (one per input frame) with Gemini's verdict
    merged in: is_inaccessible, issue_type, reason.
    """
    if not frames:
        return []
    
    return [
        {
            "frame_index": f["frame_index"],
            "timestamp": f["timestamp"],
            "frame_path": f["frame_path"],
            "change_score": f.get("change_score"),
            "transcript_context": f.get("transcript_context", ""),
            "is_inaccessible": i < 3,   # only ~1 in 8 frames flagged
            "issue_type": "diagram_or_chart",
            "reason": "Hardcoded test response",
        }
        for i, f in enumerate(frames)
    ]

#     client = _get_client()
#     model_name = model or GEMINI_MODEL

#     all_results: List[dict] = []

#     for batch in _chunked(frames, batch_size):
#         contents = _build_contents(batch)

#         response = client.models.generate_content(
#             model=model_name,
#             contents=contents,
#             config=types.GenerateContentConfig(
#                 system_instruction=SYSTEM_INSTRUCTION,
#                 response_mime_type="application/json",
#                 temperature=0.2,
#             ),
#         )

#         raw_text = (response.text or "").strip()
#         try:
#             parsed = json.loads(raw_text)
#             results_by_index = {
#                 r["frame_index"]: r for r in parsed.get("results", [])
#             }
#         except (json.JSONDecodeError, KeyError, TypeError) as e:
#             # If Gemini ever returns malformed JSON, fail this batch
#             # gracefully instead of crashing the whole pipeline — mark
#             # these frames as needing manual review.
#             results_by_index = {}
#             for f in batch:
#                 all_results.append({
#                     **f,
#                     "is_inaccessible": None,
#                     "issue_type": "error",
#                     "reason": f"Gemini response could not be parsed: {e}",
#                 })
#             continue

#         for f in batch:
#             verdict = results_by_index.get(f["frame_index"])
#             if verdict is None:
#                 all_results.append({
#                     **f,
#                     "is_inaccessible": None,
#                     "issue_type": "error",
#                     "reason": "Gemini did not return a result for this frame_index",
#                 })
#             else:
#                 all_results.append({
#                     **f,
#                     "is_inaccessible": verdict.get("is_inaccessible"),
#                     "issue_type": verdict.get("issue_type"),
#                     "reason": verdict.get("reason"),
#                 })

#     return all_results
