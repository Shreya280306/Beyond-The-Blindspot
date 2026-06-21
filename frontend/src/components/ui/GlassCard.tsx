import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl glass ring-hair",
        glow && "glow-accent",
        hover &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800/70 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MotionCard({
  children,
  className,
  delay = 0,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative rounded-2xl glass ring-hair", glow && "glow-accent", className)}
    >
      {children}
    </motion.div>
  );
}
