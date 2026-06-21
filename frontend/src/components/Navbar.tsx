import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

const links = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/analysis", label: "Analysis" },
  { to: "/output", label: "Outputs" },
  { to: "/analytics", label: "Analytics" },
];

export function Navbar() {
  const { pathname } = useLocation();
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav className="flex w-full max-w-6xl items-center justify-between rounded-2xl glass ring-hair px-3 py-2.5 pl-4">
        <Link to="/">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-mist-100" : "text-mist-500 hover:text-mist-100",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-ink-700/70 ring-hair"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/upload" className="hidden sm:block">
            <Button variant="primary">Launch demo</Button>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
