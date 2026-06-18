"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Breathe In", seconds: 4, scale: 1.15 },
  { label: "Hold", seconds: 4, scale: 1.15 },
  { label: "Breathe Out", seconds: 4, scale: 0.85 },
  { label: "Hold", seconds: 4, scale: 0.85 },
] as const;

export default function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);

  const phase = PHASES[phaseIdx];

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        const nextPhase = (phaseIdx + 1) % PHASES.length;
        if (nextPhase === 0) setCycles((c) => c + 1);
        setPhaseIdx(nextPhase);
        return PHASES[nextPhase].seconds;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phaseIdx]);

  const toggle = () => {
    if (!running) {
      setPhaseIdx(0);
      setSecondsLeft(PHASES[0].seconds);
      setCycles(0);
    }
    setRunning((r) => !r);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="breathing-ring flex h-36 w-36 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-cyan-500/10 transition-transform duration-[4000ms] ease-in-out"
        style={{ transform: `scale(${running ? phase.scale : 1})` }}
      >
        <div className="text-center">
          <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">{phase.label}</p>
          <p className="font-mono text-3xl font-black text-zinc-800 dark:text-white">{secondsLeft}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Box breathing · {cycles} cycle{cycles !== 1 ? "s" : ""} complete
      </p>
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-bold text-white shadow-md shadow-cyan-500/30"
      >
        {running ? "Pause" : "Start Breathing"}
      </button>
    </div>
  );
}
