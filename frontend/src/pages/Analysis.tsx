import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hash, Sigma, Lightbulb, BarChart3, Workflow, Variable,
  PlayCircle, Eye, Ear, Type, Zap, ArrowRight, FileText, ScanLine,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard, MotionCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  transcriptInsights, visualDetections, accessibilityClassification,
  transcriptChunks, sampleVideo,
} from "@/lib/mock";
import type { VisualType } from "@/lib/mock";
import { cn } from "@/lib/cn";

const visualIcon: Record<VisualType, typeof BarChart3> = {
  graph: BarChart3,
  diagram: Workflow,
  equation: Variable,
  flowchart: Workflow,
  demonstration: PlayCircle,
};

const classifyMeta = [
  { key: "visual_description_needed", label: "Visual descriptions", icon: Eye, tone: "accent" as const, who: "Blind" },
  { key: "caption_needed", label: "Enhanced captions", icon: Ear, tone: "cyan" as const, who: "Deaf" },
  { key: "complex_language_detected", label: "Language simplification", icon: Type, tone: "violet" as const, who: "Dyslexia" },
  { key: "attention_risk_high", label: "Attention chunking", icon: Zap, tone: "amber" as const, who: "ADHD" },
] as const;

export default function Analysis() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Step 2 · Understanding"
        title="AI analysis"
        sub="What the pipeline understood from the lecture — across speech and vision — and the supports it decided to generate."
        action={
          <Link to="/output">
            <Button variant="primary">View outputs <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        }
      />

      {/* video summary bar */}
      <MotionCard className="mt-8 flex flex-wrap items-center gap-4 p-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: sampleVideo.thumbnail }}>
          <PlayCircle className="h-6 w-6 text-accent-300" />
        </div>
        <div className="mr-auto">
          <p className="text-sm font-semibold text-mist-100">{sampleVideo.title}</p>
          <p className="text-xs text-mist-500">{sampleVideo.course} · {sampleVideo.duration}</p>
        </div>
        <Badge tone="accent">
          <ScanLine className="h-3.5 w-3.5" /> {Math.round(transcriptInsights.confidence * 100)}% confidence
        </Badge>
        <Badge tone="neutral">{transcriptInsights.readingLevel} reading level</Badge>
      </MotionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ── Transcript understanding ── */}
        <div className="space-y-6 lg:col-span-2">
          <MotionCard className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-300">Transcript understanding</h2>
            </div>

            <div className="rounded-xl bg-ink-900/60 p-4 ring-hair">
              <p className="text-xs uppercase tracking-wide text-mist-600">Detected topic</p>
              <p className="mt-1 text-xl font-bold text-gradient-accent">{transcriptInsights.topic}</p>
            </div>

            {/* keywords */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-mist-600">
                <Hash className="h-3.5 w-3.5" /> Keywords
              </div>
              <div className="flex flex-wrap gap-2">
                {transcriptInsights.keywords.map((k, i) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg bg-ink-800 px-2.5 py-1 text-xs font-medium text-mist-300 ring-hair"
                  >
                    {k}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* formulas */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {transcriptInsights.formulas.map((f) => (
                <div key={f.latex} className="rounded-xl bg-ink-900/60 p-4 ring-hair">
                  <Sigma className="h-4 w-4 text-accent-400" />
                  <p className="mt-2 font-mono text-lg text-mist-100">{f.latex}</p>
                  <p className="mt-1 text-xs text-mist-500">{f.label}</p>
                </div>
              ))}
            </div>

            {/* concepts */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-mist-600">
                <Lightbulb className="h-3.5 w-3.5" /> Key concepts
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {transcriptInsights.concepts.map((c) => (
                  <li key={c} className="flex items-start gap-2 rounded-lg bg-ink-800/50 p-2.5 text-sm text-mist-300 ring-hair">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </MotionCard>

          {/* visual analysis */}
          <MotionCard className="p-6" delay={0.05}>
            <div className="mb-5 flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-accent-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-300">Vision analysis</h2>
              <Badge tone="neutral" className="ml-auto">{visualDetections.length} detected</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {visualDetections.map((v, i) => {
                const Icon = visualIcon[v.type];
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="group rounded-xl bg-ink-900/60 p-4 ring-hair transition-colors hover:bg-ink-800/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-800 ring-hair">
                        <Icon className="h-4 w-4 text-accent-400" />
                      </div>
                      <span className="font-mono text-xs text-mist-600">{v.timestamp}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold capitalize text-mist-100">{v.type}</p>
                    <p className="mt-1 text-xs leading-relaxed text-mist-500">{v.note}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(v.meta).map(([k, val]) => (
                        <span key={k} className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-mist-500 ring-hair">
                          {k}: {val}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                        <div className="h-full rounded-full bg-accent-500/70" style={{ width: `${v.confidence * 100}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-mist-500">{Math.round(v.confidence * 100)}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </MotionCard>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* classification */}
          <MotionCard className="p-6" delay={0.1}>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mist-300">Accessibility classification</h2>
            <p className="mb-4 text-xs text-mist-500">Supports the engine chose to generate.</p>
            <div className="space-y-2.5">
              {classifyMeta.map((c) => {
                const on = accessibilityClassification[c.key as keyof typeof accessibilityClassification];
                return (
                  <div key={c.key} className={cn(
                    "flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset",
                    on ? "bg-accent-500/5 ring-accent-500/20" : "bg-ink-800/40 ring-white/5 opacity-60",
                  )}>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-800 ring-hair">
                      <c.icon className="h-4 w-4 text-accent-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-mist-100">{c.label}</p>
                      <p className="text-xs text-mist-500">For {c.who} learners</p>
                    </div>
                    <span className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      on ? "bg-accent-500" : "bg-ink-600",
                    )}>
                      <span className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                        on ? "translate-x-4" : "translate-x-1",
                      )} />
                    </span>
                  </div>
                );
              })}
            </div>
          </MotionCard>

          {/* transcript preview */}
          <MotionCard className="p-6" delay={0.15}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-mist-300">Transcript</h2>
            <div className="space-y-3">
              {transcriptChunks.map((c) => (
                <div key={c.t} className="flex gap-3">
                  <span className="shrink-0 font-mono text-xs text-accent-400/80">{c.t}</span>
                  <p className="text-sm leading-relaxed text-mist-400">{c.text}</p>
                </div>
              ))}
            </div>
            <Link to="/output" className="mt-5 block">
              <Button variant="outline" className="w-full">
                Generate accessible outputs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </MotionCard>
        </div>
      </div>
    </AppShell>
  );
}
