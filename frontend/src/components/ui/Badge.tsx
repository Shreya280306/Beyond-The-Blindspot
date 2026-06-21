import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  tone = "accent",
}: {
  children: ReactNode;
  className?: string;
  tone?: "accent" | "neutral" | "amber" | "cyan" | "violet";
}) {
  const tones = {
    accent: "text-accent-300 bg-accent-500/10 ring-accent-500/20",
    neutral: "text-mist-300 bg-ink-700/50 ring-white/10",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-500/20",
    cyan: "text-cyan-300 bg-cyan-500/10 ring-cyan-500/20",
    violet: "text-violet-300 bg-violet-500/10 ring-violet-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
