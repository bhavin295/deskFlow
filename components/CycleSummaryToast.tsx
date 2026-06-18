"use client";

import { useEffect, useRef, useState } from "react";
import { useTracker } from "@/context/TrackerContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { recordSessionEvent } from "@/lib/sessionHistory";

export default function CycleSummaryToast() {
  const { state, awaitingScreenshot, alertIntervalSeconds } = useTracker();
  const { settings } = useAppSettings();
  const [message, setMessage] = useState<string | null>(null);
  const prevAwaiting = useRef(false);

  useEffect(() => {
    if (prevAwaiting.current && !awaitingScreenshot && state === "running") {
      const minutes = Math.round(alertIntervalSeconds / 60);
      setMessage(`${minutes} min done · DeskQ synced · next cycle started`);
      recordSessionEvent("cycle_complete", "DeskQ cycle synced", { minutes });
      const id = window.setTimeout(() => setMessage(null), 5000);
      prevAwaiting.current = awaitingScreenshot;
      return () => window.clearTimeout(id);
    }
    prevAwaiting.current = awaitingScreenshot;
  }, [awaitingScreenshot, state, alertIntervalSeconds]);

  if (!message) return null;

  return (
    <div className="cycle-summary-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
