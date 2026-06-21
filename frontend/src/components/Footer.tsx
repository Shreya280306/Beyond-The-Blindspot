import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center">
        <Logo />
        <p className="max-w-md text-sm text-mist-500">
          One lecture, every learner. AI accessibility for educational video —
          built for the people captions forget.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-mist-500">
          <span className="hover:text-mist-100 cursor-default transition-colors">Privacy</span>
          <span className="hover:text-mist-100 cursor-default transition-colors">Accessibility statement</span>
          <span className="hover:text-mist-100 cursor-default transition-colors">Docs</span>
          <span className="hover:text-mist-100 cursor-default transition-colors">Contact</span>
        </div>
        <p className="text-xs text-mist-600">
          © 2026 EduAccess AI · A hackathon project. Designed for WCAG-minded learning.
        </p>
      </div>
    </footer>
  );
}
