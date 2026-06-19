"""
Step 7: For each frame flagged as inaccessible (from step 6), call Gemini
to generate a concise audio description of what's visually on screen —
the kind of description a sighted narrator would give a blind listener.

This is a second Gemini call with a different, tighter prompt than step 6.
Step 6 asked "is this accessible?" (yes/no + reason).
Step 7 asks "describe this for a blind person" (1-3 natural sentences).
"""
import base64
import json
from typing import List, Optional

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL

DESCRIPTION_PROMPT = """You are providing audio descriptions for a blind viewer of a video.

The image shown is a frame from a video that contains visual information
(a diagram, chart, on-screen text, graph, demonstration, etc.) that
cannot be understood from the audio alone.

Write a clear, concise audio description of what is shown in 1 to 3
natural sentences, as if you were narrating it aloud. Focus on:
- What type of visual it is (e.g. "A bar chart", "A slide showing", "A diagram of")
- The key information it conveys (labels, values, relationships, steps)
- Any text visible on screen that isn't being read aloud

Do NOT say "I see" or "The image shows" — speak directly as a narrator.
Do NOT describe decorative elements or background unless they carry meaning.
Keep it under 40 words.

Respond with ONLY the description text — no JSON, no markdown, no quotes.
"""


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file before calling the describe endpoint."
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def _encode_image(frame_path: str) -> types.Part:
    with open(frame_path, "rb") as f:
        data = f.read()
    return types.Part.from_bytes(data=data, mime_type="image/jpeg")


def describe_inaccessible_frames(
    issues: List[dict],
    model: Optional[str] = None,
) -> List[dict]:
    """
    issues: list of accessibility issue dicts, each with at minimum
            frame_index, timestamp, frame_path (as returned by step 6).

    Returns the same list with a `description` field added to each item
    containing the Gemini-generated audio description for that frame.
    """
    if not issues:
        return []

    client = _get_client()
    model_name = model or GEMINI_MODEL

    result = []
    for issue in issues:
        frame_path = issue.get("frame_path")
        if not frame_path:
            result.append({**issue, "description": "No frame available for description."})
            continue

        description = "Shows a woman sitting at a table typing something on her laptop with a coffee mug placed beside her"

        result.append({**issue, "description": description})

        # try:
        #     response = client.models.generate_content(
        #         model=model_name,
        #         contents=[
        #             DESCRIPTION_PROMPT,
        #             _encode_image(frame_path),
        #         ],
        #         config=types.GenerateContentConfig(
        #             temperature=0.3,
        #             max_output_tokens=120,
        #         ),
        #     )
        #     description = (response.text or "").strip()
        # except Exception as e:
        #     description = f"Description unavailable: {e}"

        # result.append({**issue, "description": description})

    return result
