"use client";

import { useState } from "react";

const STRETCHES = [
  {
    title: "Neck Rolls",
    duration: "30 sec",
    steps: "Slowly roll your head in a circle — 5 each direction. Relax shoulders.",
    icon: "🔄",
  },
  {
    title: "Shoulder Shrugs",
    duration: "20 sec",
    steps: "Raise shoulders to ears, hold 3 sec, release. Repeat 8 times.",
    icon: "💪",
  },
  {
    title: "Wrist Circles",
    duration: "30 sec",
    steps: "Extend arms, rotate wrists clockwise then counter-clockwise.",
    icon: "✋",
  },
  {
    title: "Standing Reach",
    duration: "20 sec",
    steps: "Interlace fingers, reach overhead, lean gently side to side.",
    icon: "🙆",
  },
  {
    title: "Hip Flexor",
    duration: "30 sec each",
    steps: "Lunge position, gentle push forward. Switch legs. Great after sitting.",
    icon: "🦵",
  },
];

export default function StretchGuide() {
  const [idx, setIdx] = useState(0);
  const stretch = STRETCHES[idx];

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{stretch.icon}</span>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">{stretch.title}</p>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {stretch.duration}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {stretch.steps}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIdx((i) => (i - 1 + STRETCHES.length) % STRETCHES.length)}
          className="rounded-lg bg-zinc-200/80 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-zinc-400">
          {idx + 1} / {STRETCHES.length}
        </span>
        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % STRETCHES.length)}
          className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
