# EduAccess AI

> One lecture, every learner — AI-powered accessibility for educational video.

EduAccess AI analyzes educational videos using speech recognition, computer vision,
an accessibility classification engine, RAG retrieval, and four specialized AI agents
to rebuild a single lecture into personalized experiences for **blind**, **deaf**,
**dyslexic**, and **ADHD** learners.

## ✨ Features

- **Landing page** — hero, problem framing, feature grid, animated workflow, CTA
- **Upload dashboard** — drag & drop, live upload progress, processing pipeline
- **AI analysis** — topic / keywords / formulas / concepts, vision detections, accessibility classification
- **Accessibility outputs** — Blind / Deaf / Dyslexia / ADHD modes, each with tailored AI output
- **Analytics** — impact stats, throughput chart, coverage ring, per-agent breakdown

## 🛠 Tech stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Framer Motion
- React Router
- lucide-react icons

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## 📁 Structure

```
src/
  components/      # Navbar, Footer, AppShell, PageHeader, ui/ primitives
  pages/           # Landing, Upload, Analysis, Output, Analytics
  lib/             # mock data + helpers
  index.css        # design tokens & theme
```

## 🎨 Design

Dark charcoal base with an emerald accent, glassmorphism surfaces, an ambient
aurora background, and motion-driven reveals — built to look like a premium AI
SaaS product.

---

A hackathon project. Demo data is mocked to mirror a real pipeline response.
