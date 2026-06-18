"use client";

import { useEffect, useState } from "react";
import type { DesqStatus } from "@/types/electron";

export function useElectronBridge() {
  const [isElectron, setIsElectron] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [desqStatus, setDesqStatus] = useState<DesqStatus | null>(null);
  const [lastDesqEvent, setLastDesqEvent] = useState<string | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    queueMicrotask(() => setIsElectron(true));
    api.getAlwaysOnTop?.().then(setAlwaysOnTop);
    api.getDesqStatus().then(setDesqStatus);

    const unsubStatus = api.onDesqStatus(setDesqStatus);
    const unsubDetected = api.onDesqDetected((p) => {
      if (p.line) setLastDesqEvent(p.line);
    });
    const unsubRestart = api.onDesqRestart((p) => {
      setLastDesqEvent(`Restarted from 1 — ${p.line ?? "screenshot"}`);
    });

    return () => {
      unsubStatus();
      unsubDetected();
      unsubRestart();
    };
  }, []);

  const toggleAlwaysOnTop = async () => {
    const api = window.electronAPI;
    if (!api) return;
    if (!api.setAlwaysOnTop) return;
    const next = await api.setAlwaysOnTop(!alwaysOnTop);
    setAlwaysOnTop(next);
  };

  const minimizeToTray = () => {
    window.electronAPI?.minimizeToTray?.();
  };

  return {
    isElectron,
    alwaysOnTop,
    desqStatus,
    lastDesqEvent,
    toggleAlwaysOnTop,
    minimizeToTray,
  };
}
