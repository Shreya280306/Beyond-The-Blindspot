/* Realistic mock AI outputs for the demo.
   Shaped to mirror a real pipeline response so the UI feels production-grade. */

export type VisualType = "graph" | "diagram" | "equation" | "flowchart" | "demonstration";

export const sampleVideo = {
  title: "Physics 101 — Newton's Laws of Motion",
  course: "Introductory Mechanics · Lecture 04",
  duration: "12:48",
  resolution: "1080p",
  size: "248 MB",
  thumbnail:
    "linear-gradient(135deg,#0f1f1a 0%,#0b0d0e 55%,#10261f 100%)",
};

export const transcriptInsights = {
  topic: "Newton's Second Law of Motion",
  confidence: 0.97,
  keywords: ["force", "mass", "acceleration", "inertia", "net force", "free-body diagram", "equilibrium"],
  formulas: [
    { latex: "F = ma", label: "Newton's second law" },
    { latex: "a = \\frac{F_{net}}{m}", label: "Acceleration from net force" },
    { latex: "\\sum F = 0", label: "Static equilibrium" },
  ],
  concepts: [
    "A net force produces acceleration proportional to it",
    "Mass is a measure of inertia",
    "Forces combine as vectors (net force)",
    "Equal and opposite reaction pairs",
  ],
  language: "English",
  readingLevel: "Grade 11",
};

export const transcriptChunks = [
  { t: "00:42", text: "So whenever a net force acts on an object, the object accelerates in the direction of that force." },
  { t: "01:15", text: "And the bigger the mass, the harder it is to accelerate — that resistance is what we call inertia." },
  { t: "02:03", text: "Let's draw a free-body diagram. Here's the block, and these arrows are the forces acting on it." },
  { t: "03:28", text: "If we sum these vectors and the result is zero, the object is in equilibrium." },
];

export const visualDetections: {
  id: string;
  type: VisualType;
  timestamp: string;
  confidence: number;
  meta: Record<string, string>;
  note: string;
}[] = [
  {
    id: "v1",
    type: "graph",
    timestamp: "02:31",
    confidence: 0.94,
    meta: { x_axis: "time (s)", y_axis: "velocity (m/s)", trend: "linear increase" },
    note: "Velocity rises steadily — constant acceleration under constant force.",
  },
  {
    id: "v2",
    type: "diagram",
    timestamp: "03:02",
    confidence: 0.91,
    meta: { subject: "free-body diagram", forces: "weight, normal, applied" },
    note: "Block on a surface with three labelled force vectors.",
  },
  {
    id: "v3",
    type: "equation",
    timestamp: "05:10",
    confidence: 0.98,
    meta: { expression: "F = m·a", context: "derived on whiteboard" },
    note: "Instructor writes and circles the core equation.",
  },
  {
    id: "v4",
    type: "demonstration",
    timestamp: "08:44",
    confidence: 0.88,
    meta: { action: "cart pushed on track", measured: "acceleration" },
    note: "Live demo of a cart accelerating when pushed.",
  },
];

export const accessibilityClassification = {
  visual_description_needed: true,
  caption_needed: true,
  complex_language_detected: true,
  attention_risk_high: true,
};

export type AgentKey = "blind" | "deaf" | "dyslexia" | "adhd";

export const blindOutput = {
  altDescriptions: [
    {
      at: "02:31",
      title: "Velocity–time graph",
      body: "A line graph. The horizontal axis is time in seconds, from 0 to 6. The vertical axis is velocity in metres per second, from 0 to 12. A single straight line starts at the origin and rises steadily to the top-right corner, reaching about 12 m/s at 6 seconds. The constant, unbroken slope means the object speeds up at a steady rate — constant acceleration.",
    },
    {
      at: "03:02",
      title: "Free-body diagram",
      body: "A square block sits on a flat horizontal surface. Three arrows represent forces. One points straight down from the block's centre labelled weight. One points straight up labelled normal force, equal in length to the weight. A third, shorter arrow points to the right labelled applied force, indicating the block is pushed sideways.",
    },
  ],
  sonification: "Rising tone mapped to the velocity curve — pitch climbs as the line rises.",
};

export const deafOutput = {
  captions: [
    { t: "02:28", speaker: "Instructor", text: "Watch what happens to velocity over time.", cue: "[Instructor turns to the board]" },
    { t: "02:31", speaker: "Instructor", text: "It climbs in a perfectly straight line.", cue: "[Teacher draws a rising graph]" },
    { t: "03:00", speaker: "Instructor", text: "Now let's break the forces down.", cue: "[Teacher points at the diagram]" },
    { t: "03:05", speaker: "Instructor", text: "Weight down, normal up, push to the side.", cue: "[Three arrows appear on the block]" },
    { t: "08:44", speaker: "Instructor", text: "Give it a push and it accelerates.", cue: "[Teacher pushes the cart along the track]" },
  ],
};

export const dyslexiaOutput = {
  before:
    "Consequently, when a non-zero net force is exerted upon a body, the resultant acceleration is directly proportional to the magnitude of that force and inversely proportional to the body's mass.",
  after: [
    "Push an object with a force.",
    "It speeds up. This is acceleration.",
    "More force → more acceleration.",
    "More mass → less acceleration.",
    "The rule is simple: Force = mass × acceleration.",
  ],
  settings: { font: "OpenDyslexic-friendly spacing", lineHeight: "1.9", letterSpacing: "+0.04em" },
};

export const adhdOutput = {
  chunks: [
    { range: "00:00 – 03:10", title: "What is force?", summary: "Force changes motion. No force, no change.", done: true },
    { range: "03:10 – 06:20", title: "Free-body diagrams", summary: "Draw every force as an arrow. Add them up.", done: true },
    { range: "06:20 – 09:30", title: "F = ma in action", summary: "More force = faster speed-up. More mass = slower.", done: false },
    { range: "09:30 – 12:48", title: "Live cart demo", summary: "Real push, real acceleration. Theory confirmed.", done: false },
  ],
  takeaways: [
    "Net force → acceleration",
    "Heavier = harder to move",
    "F = m × a",
  ],
};

export const analytics = {
  stats: [
    { label: "Concepts extracted", value: 24, delta: "+6 vs avg", icon: "concepts" },
    { label: "Visual elements detected", value: 18, delta: "4 types", icon: "visuals" },
    { label: "Accessibility fixes generated", value: 56, delta: "+38%", icon: "fixes" },
    { label: "Learners supported", value: 4, delta: "profiles", icon: "learners" },
  ],
  perAgent: [
    { agent: "Blind", outputs: 12, color: "#34d399" },
    { agent: "Deaf", outputs: 19, color: "#22d3ee" },
    { agent: "Dyslexia", outputs: 14, color: "#a78bfa" },
    { agent: "ADHD", outputs: 11, color: "#fbbf24" },
  ],
  timeline: [62, 48, 70, 55, 81, 73, 90, 84, 96],
  coverage: 92,
};

export const processingSteps = [
  { key: "upload", label: "Uploading video", detail: "Securely streaming to the pipeline" },
  { key: "asr", label: "Speech recognition", detail: "Transcribing audio to text" },
  { key: "nlp", label: "Transcript understanding", detail: "Topic · keywords · formulas" },
  { key: "vision", label: "Vision analysis", detail: "Detecting graphs, diagrams, demos" },
  { key: "classify", label: "Accessibility classification", detail: "Deciding which supports to generate" },
  { key: "agents", label: "Specialized agents", detail: "Blind · Deaf · Dyslexia · ADHD" },
  { key: "rag", label: "Indexing to vector store", detail: "Embedding chunks for retrieval" },
];
