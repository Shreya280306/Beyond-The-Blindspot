import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain, ScanLine, Wand2, Users, TrendingUp, Activity, Gauge,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard, MotionCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { analytics } from "@/lib/mock";

const statIcon = {
  concepts: Brain,
  visuals: ScanLine,
  fixes: Wand2,
  learners: Users,
} as const;

export default function Analytics() {
  const maxAgent = Math.max(...analytics.perAgent.map((a) => a.outputs));
  const maxBar = Math.max(...analytics.timeline);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Step 4 · Insights"
        title="Impact analytics"
        sub="How much accessibility EduAccess AI generated from a single lecture — and where it went."
      />

      {/* stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analytics.stats.map((s, i) => {
          const Icon = statIcon[s.icon as keyof typeof statIcon];
          return (
            <MotionCard key={s.label} delay={i * 0.07} className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-800 ring-hair">
                  <Icon className="h-5 w-5 text-accent-400" />
                </div>
                <Badge tone="accent" className="text-[10px]"><TrendingUp className="h-3 w-3" /> {s.delta}</Badge>
              </div>
              <Counter value={s.value} />
              <p className="mt-1 text-sm text-mist-500">{s.label}</p>
            </MotionCard>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* timeline area chart */}
        <MotionCard className="p-6 lg:col-span-2">
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-300">Processing throughput</h2>
            <Badge tone="neutral" className="ml-auto">last run</Badge>
          </div>
          <div className="flex h-48 items-end gap-2">
            {analytics.timeline.map((v, i) => (
              <motion.div
                key={i}
                className="group relative flex-1 rounded-t-lg bg-gradient-to-t from-accent-600/30 to-accent-400/80"
                initial={{ height: 0 }}
                whileInView={{ height: `${(v / maxBar) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-mist-300 opacity-0 ring-hair transition-opacity group-hover:opacity-100">
                  {v}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex justify-between font-mono text-[10px] text-mist-600">
            <span>00:00</span><span>06:24</span><span>12:48</span>
          </div>
        </MotionCard>

        {/* coverage gauge */}
        <MotionCard className="flex flex-col items-center justify-center p-6" delay={0.1}>
          <Gauge className="h-4 w-4 text-accent-400" />
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-mist-300">Accessibility coverage</p>
          <Ring value={analytics.coverage} />
          <p className="text-center text-xs text-mist-500">
            of detected visual & language barriers were resolved
          </p>
        </MotionCard>
      </div>

      {/* per-agent breakdown */}
      <MotionCard className="mt-6 p-6" delay={0.15}>
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-mist-300">Outputs by agent</h2>
        <div className="space-y-4">
          {analytics.perAgent.map((a, i) => (
            <div key={a.agent} className="flex items-center gap-4">
              <span className="w-20 shrink-0 text-sm font-medium text-mist-300">{a.agent}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-800">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${a.color}55, ${a.color})` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(a.outputs / maxAgent) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-sm text-mist-300">{a.outputs}</span>
            </div>
          ))}
        </div>
      </MotionCard>
    </AppShell>
  );
}

/* count-up number */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <p ref={ref} className="mt-4 text-3xl font-bold tabular-nums text-mist-100">
      {n}
    </p>
  );
}

/* circular progress ring */
function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative my-5 grid h-40 w-40 place-items-center">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#g)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (value / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold text-gradient-accent">{value}%</span>
      </div>
    </div>
  );
}
