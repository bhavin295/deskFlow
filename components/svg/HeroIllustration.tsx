"use client";

import { useTracker } from "@/context/TrackerContext";
import { ALERT_INTERVAL_SECONDS } from "@/types/tracker";

export default function HeroIllustration() {
  const { state, nextAlertSeconds } = useTracker();
  const isRunning = state === "running" || state === "alert";
  const progress =
    ((ALERT_INTERVAL_SECONDS - nextAlertSeconds) / ALERT_INTERVAL_SECONDS) * 100;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (progress / 100) * circumference;

  const minuteAngle = (progress / 100) * 360 - 90;
  const minuteRad = (minuteAngle * Math.PI) / 180;
  const minuteX = 120 + 50 * Math.cos(minuteRad);
  const minuteY = 120 + 50 * Math.sin(minuteRad);

  const hourAngle = (progress / 100) * 36 - 90;
  const hourRad = (hourAngle * Math.PI) / 180;
  const hourX = 120 + 32 * Math.cos(hourRad);
  const hourY = 120 + 32 * Math.sin(hourRad);

  return (
    <div className="relative mx-auto w-full max-w-[220px] animate-fade-in-up">
      <svg viewBox="0 0 240 240" className="h-auto w-full drop-shadow-lg">
        <defs>
          <linearGradient id="heroRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="heroGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="120" cy="120" r="108" fill="url(#heroGlow)" className="animate-pulse-soft" />

        <circle
          cx="120"
          cy="120"
          r="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="animate-spin-slow text-zinc-200 dark:text-zinc-800"
          style={{ transformOrigin: "120px 120px" }}
        />

        <circle
          cx="120"
          cy="120"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-100 dark:text-zinc-800/80"
        />

        <circle
          cx="120"
          cy="120"
          r="90"
          fill="none"
          stroke="url(#heroRing)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isRunning ? offset : circumference}
          transform="rotate(-90 120 120)"
          className="transition-all duration-1000 ease-linear"
          filter="url(#glow)"
        />

        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 120 + 78 * Math.cos(angle);
          const y1 = 120 + 78 * Math.sin(angle);
          const x2 = 120 + 84 * Math.cos(angle);
          const y2 = 120 + 84 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? 2 : 1}
              className="text-zinc-300 dark:text-zinc-600"
            />
          );
        })}

        <circle
          cx="120"
          cy="120"
          r="58"
          className="fill-white dark:fill-zinc-900"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="1"
        />

        {/* Animated clock hands */}
        <line
          x1="120"
          y1="120"
          x2={hourX}
          y2={hourY}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 transition-all duration-1000 ease-linear dark:text-zinc-500"
        />
        <line
          x1="120"
          y1="120"
          x2={minuteX}
          y2={minuteY}
          stroke="url(#heroRing)"
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />

        <circle cx="120" cy="120" r="5" fill="url(#heroRing)" />

        {/* Center: cycle progress only — no elapsed time */}
        <text
          x="120"
          y="108"
          textAnchor="middle"
          fill="url(#heroRing)"
          fontSize="22"
          fontWeight="700"
        >
          {Math.round(progress)}%
        </text>
        <text
          x="120"
          y="128"
          textAnchor="middle"
          className="fill-zinc-400"
          fontSize="9"
          fontWeight="600"
          letterSpacing="2"
        >
          CYCLE
        </text>

        {isRunning && (
          <circle
            cx="120"
            cy="30"
            r="4"
            fill="#3b82f6"
            className="animate-orbit"
            style={{ transformOrigin: "120px 120px" }}
          />
        )}
      </svg>

      <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-white/80 px-3 py-1 shadow-md backdrop-blur-md dark:border-slate-500/25 dark:bg-slate-700/75">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            state === "alert"
              ? "bg-red-500 animate-pulse"
              : isRunning
                ? "bg-emerald-500 animate-pulse"
                : "bg-amber-500"
          }`}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {state === "alert" ? "Alert" : isRunning ? "Active" : "Idle"}
        </span>
      </div>
    </div>
  );
}
