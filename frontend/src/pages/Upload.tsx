import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileVideo, CheckCircle2, Loader2, ArrowRight, X, Link2, AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useJob, type PipelinePhase } from "@/context/JobContext";
import { cn } from "@/lib/cn";

const stepsForPhase: { key: PipelinePhase; label: string; detail: string }[] = [
  { key: "uploading", label: "Uploading video", detail: "Sending the file to the pipeline — this becomes your job_id" },
  { key: "analyzing", label: "Analyzing (steps 2–6)", detail: "Chunking · frames · transcript (Whisper) · frame diffing · vision analysis" },
  { key: "generating", label: "Generating accessible video (steps 7–9)", detail: "Audio descriptions · text-to-speech · building the final .mp4" },
];

const order: PipelinePhase[] = ["uploading", "analyzing", "generating", "done"];

export default function Upload() {
  const nav = useNavigate();
  const job = useJob();
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState<"file" | "youtube">("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      void job.startFromFile(file);
    },
    [job],
  );

  const handleYoutubeSubmit = useCallback(() => {
    if (!youtubeUrl.trim()) return;
    void job.startFromYoutube(youtubeUrl.trim());
  }, [job, youtubeUrl]);

  const phase = job.phase;
  const isBusy = phase === "uploading" || phase === "analyzing" || phase === "generating";
  const currentStepIdx = order.indexOf(phase);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Step 1 · Upload"
        title="Upload a lecture"
        sub="Drop a video file or paste a YouTube link. EduAccess AI runs the real blind-agent pipeline against your FastAPI backend — the same job_id is reused automatically for every step."
        action={
          phase !== "idle" ? (
            <Button variant="ghost" onClick={job.reset}>
              <X className="h-4 w-4" /> Reset
            </Button>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* Left: dropzone / status */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="drop"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                {/* mode switch */}
                <div className="mb-4 inline-flex rounded-xl bg-ink-800/60 p-1 ring-hair">
                  <button
                    onClick={() => setMode("file")}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                      mode === "file" ? "bg-accent-500 text-ink-950" : "text-mist-400 hover:text-mist-200",
                    )}
                  >
                    Upload file
                  </button>
                  <button
                    onClick={() => setMode("youtube")}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                      mode === "youtube" ? "bg-accent-500 text-ink-950" : "text-mist-400 hover:text-mist-200",
                    )}
                  >
                    YouTube link
                  </button>
                </div>

                {mode === "file" ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                      "group relative grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-14 text-center transition-all",
                      drag
                        ? "border-accent-400 bg-accent-500/5 scale-[1.01]"
                        : "border-white/10 bg-ink-850/50 hover:border-accent-500/40 hover:bg-ink-800/50",
                    )}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-ink-800 ring-hair">
                      <span className="absolute inset-0 rounded-2xl bg-accent-500/10 blur-md transition-opacity group-hover:opacity-100" />
                      <UploadCloud className="relative h-7 w-7 text-accent-400" />
                    </div>
                    <p className="text-lg font-semibold text-mist-100">
                      Drag & drop your video here
                    </p>
                    <p className="mt-1 text-sm text-mist-500">
                      or <span className="text-accent-400">browse files</span> · MP4, MOV, WEBM
                    </p>
                  </div>
                ) : (
                  <GlassCard className="p-8">
                    <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-800 ring-hair">
                      <Link2 className="h-6 w-6 text-accent-400" />
                    </div>
                    <p className="text-lg font-semibold text-mist-100">Paste a YouTube URL</p>
                    <p className="mt-1 text-sm text-mist-500">The backend downloads it with yt-dlp (up to 720p) before processing.</p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleYoutubeSubmit()}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 rounded-xl bg-ink-900/60 px-4 py-2.5 text-sm text-mist-100 ring-hair outline-none placeholder:text-mist-600 focus:ring-accent-500/40"
                      />
                      <Button variant="primary" onClick={handleYoutubeSubmit} disabled={!youtubeUrl.trim()}>
                        Run pipeline <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {(isBusy || phase === "done" || phase === "error") && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6">
                  {/* file row */}
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-800 ring-hair">
                      <FileVideo className="h-6 w-6 text-accent-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-mist-100">
                        {job.videoFileName ?? "video"}
                      </p>
                      {job.jobId && (
                        <p className="truncate font-mono text-xs text-mist-500">job_id: {job.jobId}</p>
                      )}
                    </div>
                    {phase === "done" ? (
                      <Badge tone="accent"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</Badge>
                    ) : phase === "error" ? (
                      <Badge tone="amber"><AlertTriangle className="h-3.5 w-3.5" /> Failed</Badge>
                    ) : (
                      <Badge tone="neutral">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Working
                      </Badge>
                    )}
                  </div>

                  {phase === "error" && (
                    <div className="mt-5 rounded-xl bg-amber-500/5 p-4 text-sm text-amber-200 ring-1 ring-inset ring-amber-500/20">
                      {job.error}
                    </div>
                  )}

                  {/* processing steps */}
                  {(isBusy || phase === "done") && (
                    <div className="mt-6 space-y-2">
                      {stepsForPhase.map((s) => {
                        const sIdx = order.indexOf(s.key);
                        const active = s.key === phase;
                        const complete = phase === "done" || sIdx < currentStepIdx;
                        return (
                          <div
                            key={s.key}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                              active && "bg-accent-500/5 ring-1 ring-inset ring-accent-500/20",
                            )}
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center">
                              {complete ? (
                                <CheckCircle2 className="h-5 w-5 text-accent-400" />
                              ) : active ? (
                                <Loader2 className="h-4 w-4 animate-spin text-accent-400" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-ink-600" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "text-sm font-medium",
                                complete || active ? "text-mist-100" : "text-mist-600",
                              )}>
                                {s.label}
                              </p>
                              {active && <p className="text-xs text-mist-500">{s.detail}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {phase === "done" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex flex-wrap gap-3"
                    >
                      <Button variant="primary" onClick={() => nav("/analysis")}>
                        View AI analysis <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => nav("/output")}>
                        Jump to outputs
                      </Button>
                    </motion.div>
                  )}

                  {phase === "error" && (
                    <div className="mt-6">
                      <Button variant="outline" onClick={job.reset}>Try again</Button>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: tips */}
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-mist-100">What happens next</p>
            <ul className="mt-3 space-y-2.5 text-sm text-mist-500">
              {[
                "Upload returns a job_id, reused for every step",
                "Pipeline run: transcribe, detect frame changes, vision analysis",
                "Blind agent: describe → text-to-speech → build accessible .mp4",
                "Download the final accessible video",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500/70" />
                  {t}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-mist-100">Backend required</p>
            <p className="mt-2 text-sm leading-relaxed text-mist-500">
              Start it first: <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-xs text-accent-300">uvicorn app.main:app --reload --port 8000</code>
            </p>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
