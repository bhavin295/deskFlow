"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTracker } from "@/context/TrackerContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import {
  AlertIcon,
  RunningIcon,
  ShieldIcon,
  WaitingIcon,
} from "@/components/svg/Icons";
import StatusBuddy from "@/components/animations/StatusBuddy";
import { getDeskqConnectionState } from "@/lib/deskqConnection";
import { recordSessionEvent } from "@/lib/sessionHistory";
import type { StatusLabel } from "@/types/tracker";
import type { ComponentType } from "react";

type IconProps = { className?: string };

const STATUS_ICONS: Record<StatusLabel, ComponentType<IconProps>> = {
  Running: RunningIcon,
  Waiting: WaitingIcon,
  "Awaiting DeskQ": ShieldIcon,
  "Alert Active": AlertIcon,
};

const PHASES = [
  { id: "focus", label: "Focus" },
  { id: "alert", label: "Alert" },
  { id: "awaiting", label: "Awaiting" },
  { id: "sync", label: "Sync" },
] as const;

type PhaseId = (typeof PHASES)[number]["id"];

const DESKQ_LINE_LABELS = {
  disconnected: "DeskQ not linked",
  linked: "DeskQ linked",
  tracking: "DeskQ tracking",
} as const;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatScreenshotTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

function getPhase(
  state: string,
  showOverlay: boolean,
  awaitingScreenshot: boolean,
  syncing: boolean,
): PhaseId | "idle" {
  if (showOverlay || state === "alert") return "alert";
  if (awaitingScreenshot) return "awaiting";
  if (syncing) return "sync";
  if (state === "running") return "focus";
  return "idle";
}

function phaseIndex(phase: PhaseId | "idle"): number {
  if (phase === "idle") return -1;
  return PHASES.findIndex((p) => p.id === phase);
}

export default function SessionStatusRow() {
  const {
    statusLabel,
    state,
    showOverlay,
    awaitingScreenshot,
    deskqStatus,
    nextAlertSeconds,
  } = useTracker();
  const { settings } = useAppSettings();
  const [deskqSyncing, setDeskqSyncing] = useState(false);
  const [cycleSyncing, setCycleSyncing] = useState(false);
  const [awaitingMinutes, setAwaitingMinutes] = useState(0);
  const prevAwaiting = useRef(awaitingScreenshot);
  const awaitingSince = useRef<number | null>(null);
  const missedLogged = useRef(false);

  const connection = getDeskqConnectionState(deskqStatus);
  const deskqTracking = connection === "tracking";
  const isRunning = state === "running" || state === "alert";
  const isIdle = state === "stopped" && !showOverlay && !awaitingScreenshot;
  const phase = getPhase(state, showOverlay, awaitingScreenshot, cycleSyncing);
  const activePhaseIndex = phaseIndex(phase);
  const Icon = STATUS_ICONS[statusLabel];
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.syncDeskq);
  const lastShot = formatScreenshotTime(deskqStatus?.lastScreenshotAt);

  useEffect(() => {
    if (prevAwaiting.current && !awaitingScreenshot && state === "running") {
      setCycleSyncing(true);
      const id = window.setTimeout(() => setCycleSyncing(false), 2800);
      prevAwaiting.current = awaitingScreenshot;
      return () => window.clearTimeout(id);
    }
    prevAwaiting.current = awaitingScreenshot;
  }, [awaitingScreenshot, state]);

  useEffect(() => {
    if (awaitingScreenshot) {
      if (!awaitingSince.current) awaitingSince.current = Date.now();
      const tick = () => {
        if (!awaitingSince.current) return;
        setAwaitingMinutes(Math.floor((Date.now() - awaitingSince.current) / 60_000));
      };
      tick();
      const id = window.setInterval(tick, 30_000);
      return () => window.clearInterval(id);
    }
    awaitingSince.current = null;
    missedLogged.current = false;
    setAwaitingMinutes(0);
  }, [awaitingScreenshot]);

  useEffect(() => {
    if (
      awaitingScreenshot &&
      awaitingMinutes >= settings.awaitingTimeoutMinutes &&
      !missedLogged.current
    ) {
      missedLogged.current = true;
      recordSessionEvent(
        "screenshot_missed",
        `Awaiting screenshot > ${settings.awaitingTimeoutMinutes} min`,
      );
    }
  }, [awaitingScreenshot, awaitingMinutes, settings.awaitingTimeoutMinutes]);

  const handleSync = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.syncDeskq || deskqSyncing) return;
    setDeskqSyncing(true);
    try {
      await api.syncDeskq();
    } finally {
      setDeskqSyncing(false);
    }
  }, [deskqSyncing]);

  const detailLine = (() => {
    if (isRunning && !showOverlay && !awaitingScreenshot) return null;

    if (statusLabel === "Awaiting DeskQ") {
      if (awaitingMinutes >= settings.awaitingTimeoutMinutes) {
        return `DeskQ may have stopped — check Agent (waiting ${awaitingMinutes} min)`;
      }
      return lastShot
        ? `Listening for screenshot · last capture ${lastShot}`
        : "Listening for DeskQ screenshot (usually 12–18 min)";
    }
    if (statusLabel === "Waiting") {
      if (connection === "disconnected") return null;
      if (!deskqTracking) {
        return "Start tracking in DeskQ Agent to begin your focus session";
      }
      return "DeskQ is tracking — session will sync automatically";
    }
    if (statusLabel === "Alert Active") {
      return `${settings.countdownStart}s countdown before resuming`;
    }
    return null;
  })();

  return (
    <div
      className={`session-status-row${isRunning && !showOverlay ? " session-status-row-running" : ""}${statusLabel === "Awaiting DeskQ" ? " session-status-awaiting" : ""}`}
    >
      <div className="session-phase-bar session-phase-bar-inline" role="list" aria-label="Session phase">
        {PHASES.map((item, index) => {
          const isActive = phase === item.id;
          const isPast = activePhaseIndex > index;
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
                  className={`session-phase-connector${activePhaseIndex > index ? " session-phase-connector-done" : ""}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={`session-status-main session-status-${connection}`}>
        <span className={`session-status-icon session-tone-${statusLabel.replace(/\s+/g, "-").toLowerCase()}`}>
          <Icon className="h-4 w-4" />
        </span>

        <div className="session-status-copy">
          <p className="session-status-line">
            <span className="session-status-label">{statusLabel}</span>
            <span className="session-status-sep" aria-hidden>
              ·
            </span>
            <span className="session-status-deskq">{DESKQ_LINE_LABELS[connection]}</span>
            {isRunning && !showOverlay && !awaitingScreenshot && (
              <>
                <span className="session-status-sep" aria-hidden>
                  ·
                </span>
                <span className="session-status-timer">{formatTime(nextAlertSeconds)} to alert</span>
              </>
            )}
          </p>
          {detailLine && <p className="session-status-detail">{detailLine}</p>}
        </div>

        <div className="session-status-actions">
          {isElectron && (
            <button
              type="button"
              className="ui-btn ui-btn-ghost ui-btn-compact"
              onClick={() => void handleSync()}
              disabled={deskqSyncing}
            >
              {deskqSyncing ? "…" : "Sync"}
            </button>
          )}
          <div className="session-status-playful">
            <StatusBuddy status={statusLabel} />
          </div>
        </div>
      </div>

      {isIdle && connection === "disconnected" && (
        <div className="session-idle-empty">
          <p className="session-idle-title">Start tracking in DeskQ</p>
          <ol className="session-idle-steps">
            <li>Install and open DeskQ Agent</li>
            <li>Launch DeskFlow (Electron app)</li>
            <li>Tap Start tracking in DeskQ</li>
          </ol>
        </div>
      )}
    </div>
  );
}
