import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Ear, Type, Zap, Volume2, Captions, BookOpen, ListChecks,
  ArrowRight, CheckCircle2, Circle, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  blindOutput, deafOutput, dyslexiaOutput, adhdOutput,
} from "@/lib/mock";
import type { AgentKey } from "@/lib/mock";
import { cn } from "@/lib/cn";

const tabs: { key: AgentKey; label: string; icon: typeof Eye; tone: "accent" | "cyan" | "violet" | "amber"; desc: string }[] = [
  { key: "blind", label: "Blind Mode", icon: Eye, tone: "accent", desc: "Visuals turned into rich descriptions" },
  { key: "deaf", label: "Deaf Mode", icon: Ear, tone: "cyan", desc: "Captions with visual action cues" },
  { key: "dyslexia", label: "Dyslexia Mode", icon: Type, tone: "violet", desc: "Simplified, readable language" },
  { key: "adhd", label: "ADHD Mode", icon: Zap, tone: "amber", desc: "Chunked lecture + takeaways" },
];

export default function Output() {
  const [tab, setTab] = useState<AgentKey>("blind");
  const active = tabs.find((t) => t.key === tab)!;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Step 3 · Personalized output"
        title="Accessible experiences"
        sub="The same lecture, regenerated four ways by specialized AI agents. Switch modes to see each learner's version."
      />

      {/* tab bar */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-4 text-left ring-1 ring-inset transition-all",
                on
                  ? "bg-ink-800/80 ring-accent-500/30"
                  : "bg-ink-850/50 ring-white/5 hover:bg-ink-800/60",
              )}
            >
              {on && (
                <motion.span
                  layoutId="tab-glow"
                  className="absolute inset-0 bg-gradient-to-br from-accent-500/10 to-transparent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <div className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl ring-hair transition-colors",
                  on ? "bg-accent-500/15" : "bg-ink-800",
                )}>
                  <t.icon className={cn("h-5 w-5", on ? "text-accent-300" : "text-mist-400")} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", on ? "text-mist-100" : "text-mist-300")}>{t.label}</p>
                  <p className="text-xs text-mist-600">{t.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* panel */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center gap-2">
              <active.icon className="h-5 w-5 text-accent-400" />
              <h2 className="text-lg font-bold text-mist-100">{active.label}</h2>
              <Badge tone="accent" className="ml-2"><Sparkles className="h-3 w-3" /> AI generated</Badge>
            </div>

            {tab === "blind" && <BlindPanel />}
            {tab === "deaf" && <DeafPanel />}
            {tab === "dyslexia" && <DyslexiaPanel />}
            {tab === "adhd" && <AdhdPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

/* ───────── Blind ───────── */
function BlindPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {blindOutput.altDescriptions.map((d, i) => (
          <motion.div
            key={d.at}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <Badge tone="accent"><Eye className="h-3.5 w-3.5" /> {d.title}</Badge>
                <span className="font-mono text-xs text-mist-600">{d.at}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-mist-200">{d.body}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-medium text-mist-300 ring-hair transition-colors hover:text-accent-300">
                <Volume2 className="h-3.5 w-3.5" /> Play audio description
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      <GlassCard className="h-fit p-5">
        <Volume2 className="h-5 w-5 text-accent-400" />
        <p className="mt-3 text-sm font-semibold text-mist-100">Sonification</p>
        <p className="mt-1 text-sm leading-relaxed text-mist-500">{blindOutput.sonification}</p>
        <div className="mt-4 flex items-end gap-1">
          {[3, 5, 8, 6, 10, 9, 13, 12, 16, 15, 19].map((h, i) => (
            <motion.span
              key={i}
              className="w-2 rounded-full bg-accent-500/60"
              initial={{ height: 4 }}
              animate={{ height: h * 3 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ───────── Deaf ───────── */
function DeafPanel() {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Captions className="h-4 w-4 text-accent-400" />
        <p className="text-sm font-semibold text-mist-100">Enhanced captions with visual cues</p>
      </div>
      <div className="space-y-2">
        {deafOutput.captions.map((c, i) => (
          <motion.div
            key={c.t}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-4 rounded-xl bg-ink-900/50 p-3.5 ring-hair"
          >
            <span className="shrink-0 font-mono text-xs text-accent-400/80">{c.t}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-mist-100">
                <span className="font-semibold text-mist-300">{c.speaker}: </span>
                {c.text}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/20">
                <Eye className="h-3 w-3" /> {c.cue}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ───────── Dyslexia ───────── */
function DyslexiaPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard className="p-5">
        <Badge tone="neutral" className="mb-3">Original</Badge>
        <p className="text-[15px] leading-relaxed text-mist-500">{dyslexiaOutput.before}</p>
      </GlassCard>
      <GlassCard className="p-5" glow>
        <Badge tone="violet" className="mb-3"><BookOpen className="h-3.5 w-3.5" /> Simplified</Badge>
        <ul className="space-y-3" style={{ lineHeight: dyslexiaOutput.settings.lineHeight, letterSpacing: dyslexiaOutput.settings.letterSpacing }}>
          {dyslexiaOutput.after.map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-2.5 text-[17px] font-medium text-mist-100"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
              {line}
            </motion.li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {Object.entries(dyslexiaOutput.settings).map(([k, v]) => (
            <span key={k} className="rounded-md bg-ink-800 px-2 py-1 text-xs text-mist-500 ring-hair">
              {k}: <span className="text-mist-300">{v}</span>
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ───────── ADHD ───────── */
function AdhdPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {adhdOutput.chunks.map((c, i) => (
          <motion.div
            key={c.range}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <GlassCard className="flex items-center gap-4 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-800 font-mono text-sm font-bold text-amber-300 ring-hair">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-mist-100">{c.title}</p>
                  <span className="font-mono text-[10px] text-mist-600">{c.range}</span>
                </div>
                <p className="mt-0.5 text-sm text-mist-500">{c.summary}</p>
              </div>
              {c.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-mist-600" />
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
      <GlassCard className="h-fit p-5" glow>
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-amber-300" />
          <p className="text-sm font-semibold text-mist-100">Quick takeaways</p>
        </div>
        <div className="mt-4 space-y-2.5">
          {adhdOutput.takeaways.map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 ring-1 ring-inset ring-amber-500/20"
            >
              {t}
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-mist-500">
          <ArrowRight className="h-3.5 w-3.5 text-accent-400" />
          50% less reading, same understanding
        </div>
      </GlassCard>
    </div>
  );
}
