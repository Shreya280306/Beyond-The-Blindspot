import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60";

  const variants: Record<Variant, string> = {
    primary:
      "bg-accent-500 text-ink-950 hover:bg-accent-400 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.7)]",
    ghost: "text-mist-300 hover:text-mist-100 hover:bg-ink-700/50",
    outline:
      "text-mist-100 ring-hair bg-ink-800/40 hover:bg-ink-700/60 backdrop-blur",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
