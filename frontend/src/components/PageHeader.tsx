import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";

export function PageHeader({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <Badge tone="accent" className="mb-3">{eyebrow}</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-mist-500">{sub}</p>}
      </div>
      {action}
    </motion.div>
  );
}
