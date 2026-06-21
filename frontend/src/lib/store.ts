/* Tiny localStorage-backed store so real pipeline results from the
   Upload page survive navigation to Analysis / Output. */

import type { PipelineResult, AccessibleVideoResult } from "@/lib/api";

const RESULT_KEY = "eduaccess:lastResult";
const VIDEO_KEY = "eduaccess:lastAccessibleVideo";

export function saveResult(result: PipelineResult): void {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

export function loadResult(): PipelineResult | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as PipelineResult) : null;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  try {
    localStorage.removeItem(RESULT_KEY);
  } catch {
    /* ignore */
  }
}

/** Step 7-9 result: the final accessible .mp4 info (job_id, download_url, etc). */
export function saveAccessibleVideo(result: AccessibleVideoResult): void {
  try {
    localStorage.setItem(VIDEO_KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function loadAccessibleVideo(): AccessibleVideoResult | null {
  try {
    const raw = localStorage.getItem(VIDEO_KEY);
    return raw ? (JSON.parse(raw) as AccessibleVideoResult) : null;
  } catch {
    return null;
  }
}

export function clearAccessibleVideo(): void {
  try {
    localStorage.removeItem(VIDEO_KEY);
  } catch {
    /* ignore */
  }
}
