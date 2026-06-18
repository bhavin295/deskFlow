"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTrackerTimer } from "@/hooks/useTrackerTimer";
import type { TrackerContextValue } from "@/types/tracker";

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { alertIntervalSeconds, settings, hydrated: settingsHydrated } = useAppSettings();
  const timer = useTrackerTimer({
    alertIntervalSeconds,
    countdownStart: settings.countdownStart,
  });

  const value: TrackerContextValue = {
    state: timer.state,
    elapsedSeconds: timer.elapsedSeconds,
    countdown: timer.countdown,
    showOverlay: timer.showOverlay,
    statusLabel: timer.statusLabel,
    nextAlertSeconds: timer.nextAlertSeconds,
    awaitingScreenshot: timer.awaitingScreenshot,
    deskqStatus: timer.deskqStatus,
    alertIntervalSeconds: timer.alertIntervalSeconds,
    countdownStart: timer.countdownStart,
    start: timer.start,
    stop: timer.stop,
    reset: timer.reset,
    testAlert: timer.testAlert,
  };

  if (!timer.hydrated || !settingsHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#151b28]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
      </div>
    );
  }

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker(): TrackerContextValue {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
}
