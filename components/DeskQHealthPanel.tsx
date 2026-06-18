"use client";

import { useCallback, useState } from "react";
import { DESKQ_CONNECTION_LABELS, getDeskqConnectionState } from "@/lib/deskqConnection";
import { recordSessionEvent } from "@/lib/sessionHistory";
import { formatCaptureTime, formatRelativeTime } from "@/lib/timeFormat";
import { useTracker } from "@/context/TrackerContext";

function shortPath(path: string | null | undefined): string {
  if (!path) return "Not found";
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

const LAST_SYNC_KEY = "deskflow-last-deskq-sync";

type LastSync = {
  at: string;
  ok: boolean;
  message: string;
};

function loadLastSync(): LastSync | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    return raw ? (JSON.parse(raw) as LastSync) : null;
  } catch {
    return null;
  }
}

function saveLastSync(sync: LastSync) {
  localStorage.setItem(LAST_SYNC_KEY, JSON.stringify(sync));
}

export default function DeskQHealthPanel() {
  const { deskqStatus } = useTracker();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<LastSync | null>(() => loadLastSync());
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.syncDeskq);
  const connection = getDeskqConnectionState(deskqStatus);
  const agentPath = deskqStatus?.agentDbPath ?? deskqStatus?.logPath ?? null;
  const userDir = deskqStatus?.agentUserDir ?? null;
  const trackingActive = Boolean(deskqStatus?.deskqTrackingActive);

  const handleSync = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.syncDeskq || syncing) return;
    setSyncing(true);
    try {
      await api.syncDeskq();
      const result: LastSync = {
        at: new Date().toISOString(),
        ok: true,
        message: "DeskQ synced successfully",
      };
      saveLastSync(result);
      setLastSync(result);
      recordSessionEvent("sync_ok", result.message);
    } catch (err) {
      const result: LastSync = {
        at: new Date().toISOString(),
        ok: false,
        message: err instanceof Error ? err.message : "Sync failed",
      };
      saveLastSync(result);
      setLastSync(result);
      recordSessionEvent("sync_fail", result.message);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return (
    <div className="deskq-health-panel">
      <div className="deskq-health-chips">
        <span className={`deskq-chip deskq-chip-${connection}`}>
          {DESKQ_CONNECTION_LABELS[connection]}
        </span>
        <span className={`deskq-chip ${trackingActive ? "deskq-chip-tracking" : "deskq-chip-idle"}`}>
          {trackingActive ? "Tracking on" : "Tracking off"}
        </span>
      </div>

      <p className="deskq-health-row">
        Last capture: <strong>{formatCaptureTime(deskqStatus?.lastScreenshotAt) ?? "No capture yet"}</strong>
      </p>

      {lastSync && (
        <p className={`deskq-health-row deskq-sync-result-${lastSync.ok ? "ok" : "fail"}`}>
          Last sync {formatRelativeTime(lastSync.at)} — {lastSync.message}
        </p>
      )}

      <p className="deskq-health-agent" title={agentPath ?? undefined}>
        Agent DB: <span>{shortPath(agentPath)}</span>
      </p>

      {userDir && (
        <p className="deskq-health-agent" title={userDir}>
          User folder: <span>{shortPath(userDir)}</span>
        </p>
      )}

      {userDir && connection === "disconnected" && (
        <p className="deskq-health-warning" role="status">
          Found DeskQ data for <span>{shortPath(userDir)}</span> — open DeskQ Agent for this user.
        </p>
      )}

      {isElectron && (
        <button
          type="button"
          className="ui-btn ui-btn-ghost deskq-sync-btn-ui"
          onClick={() => void handleSync()}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync DeskQ now"}
        </button>
      )}
    </div>
  );
}
