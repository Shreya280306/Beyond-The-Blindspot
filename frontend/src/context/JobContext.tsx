import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  uploadVideoFile,
  uploadFromYoutube,
  runPipeline,
  makeAccessible,
  type FullPipelineResponse,
  type FullAccessiblePipelineResponse,
  ApiError,
} from "@/lib/api";

export type PipelinePhase =
  | "idle"
  | "uploading"
  | "analyzing"     // steps 2-6 (chunk, frames, transcribe, diff, gemini analyze)
  | "generating"    // steps 7-9 (describe, tts, build video)
  | "done"
  | "error";

interface JobState {
  jobId: string | null;
  phase: PipelinePhase;
  error: string | null;
  videoFileName: string | null;
  pipelineResult: FullPipelineResponse | null;
  accessibleResult: FullAccessiblePipelineResponse | null;
}

interface JobContextValue extends JobState {
  /** Upload a file, then run the full blind-agent pipeline (steps 2-9) reusing the same job_id throughout. */
  startFromFile: (file: File) => Promise<void>;
  /** Upload from a YouTube URL, then run the full blind-agent pipeline reusing the same job_id throughout. */
  startFromYoutube: (url: string) => Promise<void>;
  reset: () => void;
}

const initialState: JobState = {
  jobId: null,
  phase: "idle",
  error: null,
  videoFileName: null,
  pipelineResult: null,
  accessibleResult: null,
};

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JobState>(initialState);

  const runRest = useCallback(async (jobId: string) => {
    // Steps 2-6: chunk, extract frames/audio, transcribe, diff, analyze.
    setState((s) => ({ ...s, phase: "analyzing" }));
    const pipelineResult = await runPipeline(jobId);
    setState((s) => ({ ...s, pipelineResult }));

    // Steps 7-9: describe -> TTS -> build the final accessible .mp4.
    setState((s) => ({ ...s, phase: "generating" }));
    const accessibleResult = await makeAccessible(jobId);
    setState((s) => ({ ...s, accessibleResult, phase: "done" }));
  }, []);

  const startFromFile = useCallback(
    async (file: File) => {
      setState({ ...initialState, phase: "uploading", videoFileName: file.name });
      try {
        const upload = await uploadVideoFile(file);
        setState((s) => ({ ...s, jobId: upload.job_id }));
        await runRest(upload.job_id);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Something went wrong. Is the backend running?";
        setState((s) => ({ ...s, phase: "error", error: message }));
      }
    },
    [runRest],
  );

  const startFromYoutube = useCallback(
    async (url: string) => {
      setState({ ...initialState, phase: "uploading", videoFileName: url });
      try {
        const upload = await uploadFromYoutube(url);
        setState((s) => ({ ...s, jobId: upload.job_id }));
        await runRest(upload.job_id);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : "Something went wrong. Is the backend running?";
        setState((s) => ({ ...s, phase: "error", error: message }));
      }
    },
    [runRest],
  );

  const reset = useCallback(() => setState(initialState), []);

  return (
    <JobContext.Provider value={{ ...state, startFromFile, startFromYoutube, reset }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJob(): JobContextValue {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error("useJob must be used within a JobProvider");
  return ctx;
}
