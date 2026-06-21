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

export interface PipelineResult {
  job_id: string;
  duration_seconds: number | null;
  num_chunks: number;
  num_frames_extracted: number;
  num_changed_frames_sent_to_gemini: number;
  num_transcript_segments: number;
  accessibility_issues: AccessibilityIssue[];
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

/** Steps 2-6: run the whole pipeline for an uploaded job. Can take a while. */
export async function runPipeline(jobId: string): Promise<PipelineResult> {
  const res = await fetch(`${API_URL}/api/v1/pipeline/run/${jobId}`, {
    method: "POST",
  });
  return asJson<PipelineResult>(res);
}

/** Turn a backend frame_path (e.g. "app/storage/jobs/x/frames/f.jpg")
    into a URL the browser can load via the mounted /storage route. */
export function frameUrl(framePath: string): string {
  const norm = framePath.replace(/\\/g, "/");
  const idx = norm.indexOf("storage/");
  const rel = idx >= 0 ? norm.slice(idx + "storage/".length) : norm;
  return `${API_URL}/storage/${rel}`;
}
