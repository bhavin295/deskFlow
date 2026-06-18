"use client";

import { useCallback, useState } from "react";
import { getDeskqSyncMessage } from "@/lib/deskqSyncMessage";
import { getDeskqConnectionState } from "@/lib/deskqConnection";
import { useTracker } from "@/context/TrackerContext";
import { ShieldIcon } from "@/components/svg/Icons";

export default function DeskQSyncStrip() {
  const { deskqStatus } = useTracker();
  const [syncing, setSyncing] = useState(false);
  const deskqLinked = Boolean(deskqStatus?.running && deskqStatus?.agentDbPath);
  const deskqTracking = Boolean(deskqStatus?.deskqTrackingActive);
  const connection = getDeskqConnectionState(deskqStatus);
  const { title, detail } = getDeskqSyncMessage(deskqLinked, deskqTracking);
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.syncDeskq);

  const handleSync = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.syncDeskq || syncing) return;
    setSyncing(true);
    try {
      await api.syncDeskq();
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return (
    <div
      className={`deskq-sync-strip deskq-sync-strip-${connection}`}
      role="status"
      aria-live="polite"
    >
      <span className="deskq-sync-icon" aria-hidden>
        <ShieldIcon className="h-4 w-4" />
      </span>
      <span className="deskq-sync-copy">
        <span className="deskq-sync-title">{title}</span>
        <span className="deskq-sync-detail">{detail}</span>
      </span>
      {connection === "tracking" && <span className="deskq-sync-pulse" aria-hidden />}
      {isElectron && (
        <button
          type="button"
          className="deskq-sync-btn"
          onClick={() => void handleSync()}
          disabled={syncing}
          title="Refresh DeskQ connection"
        >
          {syncing ? "…" : "Sync"}
        </button>
      )}
    </div>
  );
}
