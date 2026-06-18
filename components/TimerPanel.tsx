"use client";

import type { ReactNode } from "react";
import { useTracker } from "@/context/TrackerContext";
import TimerBuddy from "@/components/animations/TimerBuddy";
import TimerRingArt from "@/components/animations/TimerRingArt";

const RING_SIZE = 212;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function ProgressRing({
  progress,
  active,
  children,
}: {
  progress: number;
  active: boolean;
  children: ReactNode;
}) {
  const pct = active ? Math.min(Math.max(progress, 0), 100) : 0;
  const dashOffset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="timer-ring-shell">
      <svg
        className="timer-ring-svg"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        width={RING_SIZE}
        height={RING_SIZE}
        aria-hidden
      >
        <circle
          className="timer-ring-track"
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
        />
        {active && (
          <circle
            className="timer-ring-progress"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        )}
      </svg>
      <div
        className={`timer-face timer-face-hero relative flex flex-col items-center justify-center rounded-full${
          active ? " timer-face-live" : " timer-face-idle"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function TimerPanel() {
  const { state, elapsedSeconds, nextAlertSeconds, alertIntervalSeconds } = useTracker();
  const isRunning = state === "running" || state === "alert";
  const progress = ((alertIntervalSeconds - nextAlertSeconds) / alertIntervalSeconds) * 100;

  return (
    <section
      className={`timer-stage timer-stage-funky relative flex shrink-0 items-center justify-center${
        isRunning ? " timer-stage-live timer-stage-live-funky" : " timer-stage-idle"
      }`}
    >
      <div className="timer-stage-playful" aria-hidden>
        <TimerRingArt active={isRunning} />
        <TimerBuddy running={isRunning} />
        {isRunning && (
          <>
            <span className="timer-sonar absolute inset-0 rounded-full border border-cyan-400/35" />
            <div className="timer-orbit absolute inset-0">
              <span className="timer-orbit-dot" />
            </div>
            <div className="timer-orbit timer-orbit-reverse absolute inset-0">
              <span className="timer-orbit-dot timer-orbit-dot-alt" />
            </div>
          </>
        )}
      </div>

      <div className="relative z-10">
        <ProgressRing progress={progress} active={isRunning}>
          <p className="timer-label">Elapsed</p>
          <p
            key={elapsedSeconds}
            className={`timer-display timer-display-hero font-mono ${
              isRunning ? "timer-display-live timer-display-funky animate-timer-tick" : "timer-display-idle"
            }`}
          >
            {formatElapsed(elapsedSeconds)}
          </p>
          {isRunning ? (
            <p className="timer-sub timer-sub-hero">Next in {formatTime(nextAlertSeconds)}</p>
          ) : (
            <p className="timer-sub timer-sub-idle">Start tracking in DeskQ</p>
          )}
        </ProgressRing>
      </div>
    </section>
  );
}
