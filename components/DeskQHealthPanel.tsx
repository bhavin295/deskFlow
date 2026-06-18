"use client";

import { useCallback, useEffect, useState } from "react";
import { DESKQ_CONNECTION_LABELS, getDeskqConnectionState } from "@/lib/deskqConnection";
import { recordSessionEvent } from "@/lib/sessionHistory";
import { useTracker } from "@/context/TrackerContext";

const LAST_SYNC_KEY = "deskflow-last-deskq-sync";

type LastSync = {
  at: string;
  ok: boolean;
  message: string;
};

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCaptureTime(iso: string | null | undefined): string {
  if (!iso) return "No capture yet";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "Unknown";
  }
}

function shortPath(path: string | null | undefined): string {
  if (!path) return "Not found";
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

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
  const [lastSync, setLastSync] = useState<LastSync | null>(null);
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.syncDeskq);
  const connection = getDeskqConnectionState(deskqStatus);
  const agentPath = deskqStatus?.agentDbPath ?? deskqStatus?.logPath ?? null;
  const userDir = deskqStatus?.agentUserDir ?? null;
  const trackingActive = Boolean(deskqStatus?.deskqTrackingActive);

  useEffect(() => {
    setLastSync(loadLastSync());
  }, []);

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
        Last capture: <strong>{formatCaptureTime(deskqStatus?.lastScreenshotAt)}</strong>
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
