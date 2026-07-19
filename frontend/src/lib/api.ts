<<<<<<< HEAD
/**
 * Thin client for the "Beyond The Blindspot" FastAPI backend
 * (see app/main.py / app/routers/*.py).
 *
 * Only wires the endpoints needed for the blind-agent flow:
 *   1. upload (file or YouTube link)               -> job_id
 *   2-6. pipeline/run/{job_id}                      -> accessibility_issues
 *   7-9. make-accessible/{job_id}                   -> output_video_path
 *   download/{job_id}                                -> final .mp4
 *   status/{job_id}                                  -> progress polling
 *
 * job_id is returned by upload and then threaded through every other
 * call automatically by the caller (see JobContext) — you never need
 * to type it in twice.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

const API = `${API_BASE_URL}/api/v1`;

// ── Shared types (mirrors app/schemas.py) ────────────────────────────────
=======
/* Real backend client for the Accessible Video Analyzer FastAPI service.
   Base URL comes from VITE_API_URL (set in .env), defaults to local dev. */

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";
>>>>>>> 9627663cb366b4d4e593c13b2cb6071636fb0bed

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

<<<<<<< HEAD
export interface FullPipelineResponse {
=======
export interface PipelineResult {
>>>>>>> 9627663cb366b4d4e593c13b2cb6071636fb0bed
  job_id: string;
  duration_seconds: number | null;
  num_chunks: number;
  num_frames_extracted: number;
  num_changed_frames_sent_to_gemini: number;
  num_transcript_segments: number;
  accessibility_issues: AccessibilityIssue[];
}

<<<<<<< HEAD
export interface FullAccessiblePipelineResponse {
  job_id: string;
  num_issues_described: number;
  num_audio_clips_generated: number;
  output_video_path: string;
  download_url: string;
  total_pause_duration_seconds: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  steps_completed: string[];
  detail: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // body wasn't JSON; fall back to statusText
    }
    throw new ApiError(res.status, detail);
=======
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
>>>>>>> 9627663cb366b4d4e593c13b2cb6071636fb0bed
  }
  return res.json() as Promise<T>;
}

<<<<<<< HEAD
// ── Step 1: upload ────────────────────────────────────────────────────────

export async function uploadVideoFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API}/upload/file`, { method: "POST", body: formData });
  return unwrap<UploadResponse>(res);
}

export async function uploadFromYoutube(youtubeUrl: string): Promise<UploadResponse> {
  const res = await fetch(`${API}/upload/youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ youtube_url: youtubeUrl }),
  });
  return unwrap<UploadResponse>(res);
}

// ── Steps 2-6 in one call ────────────────────────────────────────────────

export async function runPipeline(jobId: string): Promise<FullPipelineResponse> {
  const res = await fetch(`${API}/pipeline/run/${jobId}`, { method: "POST" });
  return unwrap<FullPipelineResponse>(res);
}

// ── Steps 7-9 in one call: describe -> TTS -> build accessible video ────

export async function makeAccessible(jobId: string): Promise<FullAccessiblePipelineResponse> {
  const res = await fetch(`${API}/make-accessible/${jobId}`, { method: "POST" });
  return unwrap<FullAccessiblePipelineResponse>(res);
}

// ── Status polling ───────────────────────────────────────────────────────

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API}/status/${jobId}`);
  return unwrap<JobStatusResponse>(res);
}

// ── Final video ───────────────────────────────────────────────────────────

/** Direct download URL for the final accessible .mp4 (GET /download/{job_id}). */
export function downloadUrl(jobId: string): string {
  return `${API}/download/${jobId}`;
}

/** A URL under /storage that can be used to preview an extracted frame image. */
export function storageUrl(relativePath: string): string {
  // frame_path / output_video_path etc. come back as paths like
  // "app/storage/jobs/{job_id}/frames/frame_000007.jpg" — strip the
  // leading "app/" since /storage is mounted at app/storage.
  const cleaned = relativePath.replace(/^app\/storage\//, "");
  return `${API_BASE_URL}/storage/${cleaned}`;
}

/**
 * Runs the full blind-agent pipeline end to end for a freshly uploaded job:
 * pipeline/run (steps 2-6) then make-accessible (steps 7-9).
 * Reuses the same job_id throughout — call this right after upload.
 */
export async function runBlindAgentPipeline(
  jobId: string,
): Promise<{ pipeline: FullPipelineResponse; accessible: FullAccessiblePipelineResponse }> {
  const pipeline = await runPipeline(jobId);
  const accessible = await makeAccessible(jobId);
  return { pipeline, accessible };
=======
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
>>>>>>> 9627663cb366b4d4e593c13b2cb6071636fb0bed
}
