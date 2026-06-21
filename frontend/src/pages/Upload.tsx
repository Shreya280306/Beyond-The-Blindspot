import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileVideo, CheckCircle2, Loader2, ArrowRight, X, Film,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { processingSteps, sampleVideo } from "@/lib/mock";
import { cn } from "@/lib/cn";

type Phase = "idle" | "uploading" | "processing" | "done";

export default function Upload() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = useCallback(() => {
    setPhase("uploading");
    setProgress(0);
  }, []);

  // upload progress
  useEffect(() => {
    if (phase !== "uploading") return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setPhase("processing");
          return 100;
        }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(id);
  }, [phase]);

  // processing steps
  useEffect(() => {
    if (phase !== "processing") return;
    setStepIdx(0);
    const id = setInterval(() => {
      setStepIdx((s) => {
        if (s >= processingSteps.length - 1) {
          clearInterval(id);
          setTimeout(() => setPhase("done"), 700);
          return s;
        }
        return s + 1;
      });
    }, 850);
    return () => clearInterval(id);
  }, [phase]);

  const reset = () => {
    setPhase("idle");
    setProgress(0);
    setStepIdx(0);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Step 1 · Upload"
        title="Upload a lecture"
        sub="Drop a video and EduAccess AI runs the full accessibility pipeline. For the demo, any file (or the sample) works."
        action={
          phase !== "idle" ? (
            <Button variant="ghost" onClick={reset}>
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
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); start(); }}
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
                    onChange={() => start()}
                  />
                  <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-ink-800 ring-hair">
                    <span className="absolute inset-0 rounded-2xl bg-accent-500/10 blur-md transition-opacity group-hover:opacity-100" />
                    <UploadCloud className="relative h-7 w-7 text-accent-400" />
                  </div>
                  <p className="text-lg font-semibold text-mist-100">
                    Drag & drop your video here
                  </p>
                  <p className="mt-1 text-sm text-mist-500">
                    or <span className="text-accent-400">browse files</span> · MP4, MOV, WEBM up to 2GB
                  </p>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); start(); }}
                    >
                      <Film className="h-4 w-4" /> Use sample lecture
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {(phase === "uploading" || phase === "processing" || phase === "done") && (
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
                        {sampleVideo.title}.mp4
                      </p>
                      <p className="text-xs text-mist-500">
                        {sampleVideo.size} · {sampleVideo.resolution} · {sampleVideo.duration}
                      </p>
                    </div>
                    {phase === "done" ? (
                      <Badge tone="accent"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</Badge>
                    ) : (
                      <Badge tone="neutral">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {phase === "uploading" ? "Uploading" : "Processing"}
                      </Badge>
                    )}
                  </div>

                  {/* upload progress */}
                  {phase === "uploading" && (
                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-xs text-mist-500">
                        <span>Uploading to pipeline…</span>
                        <span className="font-mono text-accent-400">{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* processing steps */}
                  {(phase === "processing" || phase === "done") && (
                    <div className="mt-6 space-y-2">
                      {processingSteps.map((s, i) => {
                        const active = i === stepIdx && phase === "processing";
                        const complete = phase === "done" || i < stepIdx;
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
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: preview + tips */}
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="overflow-hidden">
            <div
              className="relative grid aspect-video place-items-center"
              style={{ background: sampleVideo.thumbnail }}
            >
              <div className="absolute inset-0 bg-dots opacity-30" />
              <div className="relative grid h-14 w-14 place-items-center rounded-full glass ring-hair">
                <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-accent-400/40" />
                <FileVideo className="h-6 w-6 text-accent-300" />
              </div>
              <span className="absolute bottom-3 right-3 rounded-md bg-ink-950/70 px-2 py-1 font-mono text-xs text-mist-300">
                {sampleVideo.duration}
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-mist-100">{sampleVideo.title}</p>
              <p className="mt-0.5 text-xs text-mist-500">{sampleVideo.course}</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-mist-100">What happens next</p>
            <ul className="mt-3 space-y-2.5 text-sm text-mist-500">
              {["Audio is transcribed & understood", "Frames scanned for visuals", "Accessibility needs detected", "4 agents generate tailored output"].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500/70" />
                  {t}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
