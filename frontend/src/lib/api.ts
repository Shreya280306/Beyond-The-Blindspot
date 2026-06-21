/* Real backend client for the Accessible Video Analyzer FastAPI service.
   Base URL comes from VITE_API_URL (set in .env), defaults to local dev. */

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

export interface UploadResponse {
  job_id: string;
  source_type: string;
  duration_seconds: number | null;
  file_size_bytes: number;
  message: string;
}

export interface AccessibilityIssue {
  frame_index: number;
  timestamp: number;
  frame_path: string;
  issue_type: string | null;
  reason: string | null;
  change_score: number | null;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface PipelineResult {
  job_id: string;
  duration_seconds: number | null;
  num_chunks: number;
  num_frames_extracted: number;
  num_changed_frames_sent_to_gemini: number;
  num_transcript_segments: number;
  transcript: TranscriptSegment[];
  language: string | null;
  language_probability: number | null;
  accessibility_issues: AccessibilityIssue[];
}

/** Response from POST /make-accessible/{job_id} (steps 7+8+9: describe -> TTS -> build video). */
export interface AccessibleVideoResult {
  job_id: string;
  num_issues_described: number;
  num_audio_clips_generated: number;
  output_video_path: string;
  download_url: string;
  total_pause_duration_seconds: number;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** Step 1: upload a video file, get a job_id back. */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/v1/upload/file`, {
    method: "POST",
    body: form,
  });
  return asJson<UploadResponse>(res);
}

/** Steps 2-6: run the whole analysis pipeline for an uploaded job. Can take a while. */
export async function runPipeline(jobId: string): Promise<PipelineResult> {
  const res = await fetch(`${API_URL}/api/v1/pipeline/run/${jobId}`, {
    method: "POST",
  });
  return asJson<PipelineResult>(res);
}

/**
 * Steps 7-9 in one call: describe each flagged frame -> text-to-speech ->
 * build the final accessible .mp4 (pause-and-describe edits inserted).
 * Requires steps 1-6 (runPipeline) to have completed for this job_id first.
 * This can take a while — FFmpeg re-encodes the full video.
 */
export async function makeAccessible(jobId: string): Promise<AccessibleVideoResult> {
  const res = await fetch(`${API_URL}/api/v1/make-accessible/${jobId}`, {
    method: "POST",
  });
  return asJson<AccessibleVideoResult>(res);
}

/** Direct (streamable) URL for the final accessible .mp4 — use for <video src> or a download link. */
export function downloadUrl(jobId: string): string {
  return `${API_URL}/api/v1/download/${jobId}`;
}

/**
 * Triggers an actual save-to-disk download of the final .mp4.
 * Fetches the file as a blob first rather than relying on an <a download>
 * pointed at a different origin (frontend dev server vs backend), since
 * browsers often ignore the `download` attribute cross-origin and just
 * navigate to the file instead of saving it.
 */
export async function downloadAccessibleVideo(jobId: string): Promise<void> {
  const res = await fetch(downloadUrl(jobId));
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `accessible_${jobId.slice(0, 8)}.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Turn a backend frame_path (e.g. "app/storage/jobs/x/frames/f.jpg")
    into a URL the browser can load via the mounted /storage route. */
export function frameUrl(framePath: string): string {
  const norm = framePath.replace(/\\/g, "/");
  const idx = norm.indexOf("storage/");
  const rel = idx >= 0 ? norm.slice(idx + "storage/".length) : norm;
  return `${API_URL}/storage/${rel}`;
}

/** Formats seconds as m:ss for timestamps next to transcript lines / frames. */
export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", hi: "Hindi",
  zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese", ru: "Russian",
  ar: "Arabic", it: "Italian", nl: "Dutch", tr: "Turkish", pl: "Polish",
  ta: "Tamil", te: "Telugu", mr: "Marathi", bn: "Bengali", ur: "Urdu",
};

export function languageLabel(code: string | null): string | null {
  if (!code) return null;
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

export interface TranscriptStats {
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number | null;
  segmentCount: number;
}

/**
 * Derives only what's honestly computable from the real transcript —
 * no fabricated topic/keyword/formula extraction, since the backend
 * doesn't run any NLP step beyond Whisper transcription.
 */
export function transcriptStats(transcript: TranscriptSegment[], durationSeconds: number | null): TranscriptStats {
  const wordCount = transcript.reduce((sum, seg) => sum + seg.text.split(/\s+/).filter(Boolean).length, 0);
  const spokenSeconds = transcript.length
    ? transcript[transcript.length - 1].end - transcript[0].start
    : (durationSeconds ?? 0);
  const wordsPerMinute = spokenSeconds > 0 ? Math.round((wordCount / spokenSeconds) * 60) : null;
  return {
    wordCount,
    durationSeconds: durationSeconds ?? spokenSeconds,
    wordsPerMinute,
    segmentCount: transcript.length,
  };
}
