"use client";

import { useTracker } from "@/context/TrackerContext";

type SessionPhase = "focus" | "alert" | "awaiting" | "idle";

function getSessionPhase(
  state: string,
  showOverlay: boolean,
  awaitingScreenshot: boolean,
): SessionPhase {
  if (showOverlay || state === "alert") return "alert";
  if (awaitingScreenshot) return "awaiting";
  if (state === "running") return "focus";
  return "idle";
}

const PHASES = [
  { id: "focus" as const, label: "Focus" },
  { id: "alert" as const, label: "Alert" },
  { id: "awaiting" as const, label: "Awaiting DeskQ" },
];

export default function SessionPhaseBar() {
  const { state, showOverlay, awaitingScreenshot } = useTracker();
  const phase = getSessionPhase(state, showOverlay, awaitingScreenshot);
  const phaseIndex = phase === "idle" ? -1 : PHASES.findIndex((item) => item.id === phase);

  return (
    <div className="session-phase-bar" role="list" aria-label="Session phase">
      {PHASES.map((item, index) => {
        const isActive = phase === item.id;
        const isPast = phaseIndex > index;

        return (
          <div key={item.id} className="session-phase-item" role="listitem">
            <span
              className={`session-phase-node${isActive ? " session-phase-node-active" : ""}${isPast ? " session-phase-node-past" : ""}${phase === "idle" ? " session-phase-node-idle" : ""}`}
            >
              <span className="session-phase-dot" aria-hidden />
              <span className="session-phase-label">{item.label}</span>
            </span>
            {index < PHASES.length - 1 && (
              <span
                className={`session-phase-connector${phaseIndex > index ? " session-phase-connector-done" : ""}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
