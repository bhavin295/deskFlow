"use client";

import { useEffect, useState } from "react";

const DURATION = 20;

export default function EyeRestTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(DURATION);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, seconds]);

  const start = () => {
    setSeconds(DURATION);
    setDone(false);
    setRunning(true);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          20-20-20 Rule
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
          Every 20 min, look at something 20 feet away for 20 seconds to reduce eye strain.
        </p>
      </div>
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-200 dark:text-zinc-800" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-sky-500 transition-all duration-1000"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - seconds / DURATION)}
          />
        </svg>
        <span className="font-mono text-4xl font-black text-zinc-800 dark:text-white">{seconds}</span>
      </div>
      {done ? (
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Eyes rested! 👀</p>
      ) : (
        <p className="text-xs text-zinc-500">Look out a window or far wall</p>
      )}
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="rounded-full bg-sky-500 px-6 py-2 text-sm font-bold text-white shadow-md shadow-sky-500/30 disabled:opacity-50"
      >
        {running ? "Resting…" : done ? "Rest Again" : "Start Eye Rest"}
      </button>
    </div>
  );
}
