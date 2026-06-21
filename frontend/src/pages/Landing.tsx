import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Eye, Ear, Type, Zap, Captions, ScanText,
  AudioLines, Cpu, Database, Sparkles, Play, ShieldCheck,
} from "lucide-react";
import { Aurora } from "@/components/ui/Aurora";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard, MotionCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/Section";
import { Footer } from "@/components/Footer";

const ease = [0.22, 1, 0.36, 1] as const;

const audiences = [
  { icon: Eye, tone: "accent" as const, title: "Blind learners", pain: "Can't see graphs, diagrams or demos", fix: "Rich spoken-style descriptions of every visual" },
  { icon: Ear, tone: "cyan" as const, title: "Deaf learners", pain: "Plain captions miss what the teacher does", fix: "Captions enriched with visual action cues" },
  { icon: Type, tone: "violet" as const, title: "Dyslexic learners", pain: "Dense academic language is exhausting", fix: "Simplified, short-sentence rewrites" },
  { icon: Zap, tone: "amber" as const, title: "ADHD learners", pain: "Long lectures cause overload", fix: "Bite-size chunks + quick takeaways" },
];

const features = [
  { icon: AudioLines, title: "Speech understanding", body: "Transcribes audio, then extracts topic, keywords, formulas and concepts automatically." },
  { icon: ScanText, title: "Computer vision", body: "Detects graphs, diagrams, equations, flowcharts and live demonstrations frame-by-frame." },
  { icon: ShieldCheck, title: "Accessibility classifier", body: "Decides which supports a video actually needs — no guesswork, no noise." },
  { icon: Sparkles, title: "Specialized agents", body: "Four expert AI agents generate tailored output for each kind of learner." },
  { icon: Database, title: "RAG retrieval", body: "Transcript, visuals and concepts are embedded so only relevant context is used." },
  { icon: Cpu, title: "Real-time pipeline", body: "Upload to personalized output in one continuous, observable flow." },
];

const flow = [
  { icon: Play, label: "Upload video", sub: "Drag & drop a lecture" },
  { icon: AudioLines, label: "AI analysis", sub: "Speech + vision" },
  { icon: ShieldCheck, label: "Detect needs", sub: "Classification engine" },
  { icon: Sparkles, label: "Personalized output", sub: "Per-learner experience" },
];

export default function Landing() {
  return (
    <div className="relative">
      <Aurora dense />

      {/* ───────────── Hero ───────────── */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-36 text-center sm:pt-44">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Badge tone="accent" className="mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            AI accessibility engine · live demo
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="text-gradient">One lecture,</span>{" "}
          <span className="text-gradient-accent">every learner.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="mt-6 max-w-xl text-pretty text-lg text-mist-300"
        >
          EduAccess AI watches educational video the way four different learners need it to —
          and rebuilds it for the blind, deaf, dyslexic, and easily-distracted.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.25 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/upload">
            <Button variant="primary" className="px-6 py-3 text-[15px]">
              Try the live demo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/analysis">
            <Button variant="outline" className="px-6 py-3 text-[15px]">
              <Play className="h-4 w-4" /> See AI analysis
            </Button>
          </Link>
        </motion.div>

        {/* Hero product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease, delay: 0.35 }}
          className="relative mt-16 w-full max-w-4xl"
        >
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-accent-500/30 to-transparent blur-sm" />
          <GlassCard className="relative overflow-hidden p-2">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="ml-3 font-mono text-xs text-mist-600">eduaccess.ai / analysis</span>
            </div>
            <div className="grid gap-3 rounded-2xl bg-ink-900/60 p-4 sm:grid-cols-3">
              {audiences.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.5, ease }}
                  className="rounded-xl bg-ink-800/70 p-4 text-left ring-hair"
                >
                  <a.icon className="h-5 w-5 text-accent-400" />
                  <p className="mt-3 text-sm font-semibold text-mist-100">{a.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mist-500">{a.fix}</p>
                </motion.div>
              )).slice(0, 3)}
            </div>
          </GlassCard>
        </motion.div>

        {/* trust strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-wider text-mist-600">
          <span>Speech recognition</span>
          <span className="text-accent-500/40">•</span>
          <span>Computer vision</span>
          <span className="text-accent-500/40">•</span>
          <span>RAG retrieval</span>
          <span className="text-accent-500/40">•</span>
          <span>4 specialized agents</span>
        </div>
      </section>

      {/* ───────────── Problem / audiences ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="The problem"
          title={<>Captions were never enough</>}
          sub="The same video fails four different learners in four different ways. EduAccess AI fixes each one."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => (
            <MotionCard key={a.title} delay={i * 0.07} className="group p-6 transition-colors hover:bg-ink-800/70">
              <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-ink-800 ring-hair">
                <a.icon className="h-5 w-5 text-accent-400" />
              </div>
              <h3 className="text-base font-semibold text-mist-100">{a.title}</h3>
              <p className="mt-2 text-sm text-mist-500">{a.pain}</p>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-500/5 p-3 ring-1 ring-inset ring-accent-500/15">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                <p className="text-xs leading-relaxed text-accent-200/90">{a.fix}</p>
              </div>
            </MotionCard>
          ))}
        </div>
      </section>

      {/* ───────────── Features ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="The engine"
          title={<>A full pipeline, not a wrapper</>}
          sub="Five AI systems work together to understand a lecture deeply — then rebuild it for everyone."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <MotionCard key={f.title} delay={i * 0.06} className="group p-6 hover:bg-ink-800/70 transition-colors">
              <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent-500/20 to-transparent ring-hair">
                <f.icon className="h-5 w-5 text-accent-300" />
              </div>
              <h3 className="text-base font-semibold text-mist-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-500">{f.body}</p>
            </MotionCard>
          ))}
        </div>
      </section>

      {/* ───────────── Workflow ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow="How it works" title={<>Upload → Analyze → Detect → Deliver</>} />
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent md:block" />
          <div className="grid gap-6 md:grid-cols-4">
            {flow.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl glass ring-hair">
                  <span className="absolute inset-0 rounded-2xl bg-accent-500/10 blur-md" />
                  <s.icon className="relative h-6 w-6 text-accent-400" />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-accent-500 text-xs font-bold text-ink-950">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-mist-100">{s.label}</p>
                <p className="mt-1 text-xs text-mist-500">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <MotionCard className="relative overflow-hidden p-10 text-center sm:p-16" glow>
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/20 blur-[100px]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
              See one video become four accessible experiences
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-mist-400">
              Run the full pipeline on a sample lecture — no signup, no setup. Watch the agents work in real time.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/upload">
                <Button variant="primary" className="px-7 py-3 text-[15px]">
                  Launch the demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="ghost" className="px-6 py-3 text-[15px]">View analytics</Button>
              </Link>
            </div>
          </div>
        </MotionCard>
      </section>

      <Footer />
    </div>
  );
}
