import { cn } from "@/lib/cn";

export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-ink-800 ring-hair">
        <span className="absolute inset-0 rounded-xl bg-accent-500/15 blur-md" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5">
          <path d="M9 20.5V11.5L16 8l7 3.5v9L16 24z" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="2.6" fill="#34d399" />
        </svg>
      </div>
      {withWord && (
        <div className="leading-none">
          <span className="text-[15px] font-bold tracking-tight text-mist-100">EduAccess</span>
          <span className="text-[15px] font-bold tracking-tight text-accent-400"> AI</span>
        </div>
      )}
    </div>
  );
}
