import type { ReactNode } from "react";
import { Aurora } from "./ui/Aurora";

/* Page wrapper for the dashboard routes: ambient bg + padded container. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Aurora />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-28">{children}</main>
    </div>
  );
}
