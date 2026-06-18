"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "ready" | "go" | "early" | "result";

const STORAGE_KEY = "tracker-reaction-best";

export default function ReactionGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [resultMs, setResultMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const goAt = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRound = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPhase("waiting");
    setResultMs(null);
    const delay = 1200 + Math.random() * 2800;
    timeoutRef.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
    }, delay);
  }, []);

  const onTap = () => {
    if (phase === "idle" || phase === "result" || phase === "early") {
      startRound();
      return;
    }
    if (phase === "waiting") {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPhase("early");
      return;
    }
    if (phase === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      setResultMs(ms);
      setPhase("result");
      setBest((b) => {
        if (b === null || ms < b) {
          localStorage.setItem(STORAGE_KEY, String(ms));
          return ms;
        }
        return b;
      });
    }
  };

  const label: Record<Phase, string> = {
    idle: "Tap to Start",
    waiting: "Wait for green…",
    ready: "Get ready…",
    go: "TAP NOW!",
    early: "Too early! Tap to retry",
    result: resultMs !== null ? `${resultMs} ms` : "Tap to retry",
  };

  const color: Record<Phase, string> = {
    idle: "bg-zinc-700",
    waiting: "bg-rose-600",
    ready: "bg-amber-500",
    go: "bg-emerald-500 animate-pulse-soft",
    early: "bg-orange-600",
    result: "bg-indigo-600",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-zinc-500">
          Best{" "}
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {best !== null ? `${best} ms` : "—"}
          </span>
        </p>
        <p className="text-[10px] text-zinc-400">Tap when screen turns green</p>
      </div>
      <button
        type="button"
        onClick={onTap}
        className={`reaction-pad mx-auto flex h-44 w-full max-w-[280px] flex-col items-center justify-center rounded-2xl text-white shadow-lg transition-colors duration-150 ${color[phase]}`}
      >
        <span className="text-2xl font-black tracking-tight">{label[phase]}</span>
        {phase === "result" && resultMs !== null && (
          <span className="mt-2 text-xs font-medium opacity-80">Tap to play again</span>
        )}
      </button>
    </div>
  );
}
