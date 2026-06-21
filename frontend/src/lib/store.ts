/* Tiny localStorage-backed store so a real pipeline result from the
   Upload page survives navigation to Analysis / Output. */

import type { PipelineResult } from "@/lib/api";

const KEY = "eduaccess:lastResult";

export function saveResult(result: PipelineResult): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

export function loadResult(): PipelineResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PipelineResult) : null;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
