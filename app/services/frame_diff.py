"""
Step 5: Detect meaningful changes between consecutive extracted frames
using OpenCV, so we only send *changed* frames to Gemini in step 6
(saves API calls/cost and avoids redundant analysis of near-identical
frames, e.g. a static slide held on screen for 10 seconds).

Method: convert each frame pair to grayscale, take an absolute difference,
threshold it, and compute the percentage of pixels that changed
significantly. If that percentage exceeds FRAME_DIFF_THRESHOLD, we mark
the *later* frame of the pair as a "changed" frame worth sending to Gemini.

The very first frame is always included, since there's no prior frame to
compare it to and it may itself contain a diagram/chart.
"""
from typing import List

import cv2
import numpy as np

from app.config import FRAME_DIFF_THRESHOLD


def _percent_pixels_changed(img1: np.ndarray, img2: np.ndarray, pixel_diff_thresh: int = 30) -> float:
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # Slight blur reduces sensitivity to camera/encoder noise so we don't
    # flag near-static frames as "changed" due to compression artifacts.
    gray1 = cv2.GaussianBlur(gray1, (5, 5), 0)
    gray2 = cv2.GaussianBlur(gray2, (5, 5), 0)

    diff = cv2.absdiff(gray1, gray2)
    _, thresholded = cv2.threshold(diff, pixel_diff_thresh, 255, cv2.THRESH_BINARY)

    changed_pixels = int(np.count_nonzero(thresholded))
    total_pixels = thresholded.size
    return 100.0 * changed_pixels / total_pixels


def detect_changed_frames(frames: List[dict], threshold: float = None) -> List[dict]:
    """
    frames: list of dicts with at least {frame_index, frame_path, timestamp},
            ordered by timestamp ascending (as produced by frame_extraction).

    Returns the subset of `frames` considered meaningfully different from
    the frame immediately before them (plus always the first frame), each
    augmented with a `change_score` field (% of pixels changed vs previous
    frame; None for the first frame).
    """
    if threshold is None:
        threshold = FRAME_DIFF_THRESHOLD

    if not frames:
        return []

    changed = []
    prev_img = None

    for frame in frames:
        img = cv2.imread(frame["frame_path"])
        if img is None:
            continue

        if prev_img is None:
            changed.append({**frame, "change_score": None})
        else:
            score = _percent_pixels_changed(prev_img, img)
            if score >= threshold:
                changed.append({**frame, "change_score": round(score, 3)})

        prev_img = img

    return changed
