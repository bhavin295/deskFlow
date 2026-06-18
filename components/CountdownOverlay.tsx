"use client";

import { useEffect, useRef } from "react";
import { useTracker } from "@/context/TrackerContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import CountdownStage from "@/components/CountdownStage";
import { playAlertBeep, shouldPlayAlertSound, shouldShowAlertFlash } from "@/lib/alertFeedback";

type CountdownOverlayProps = {
  variant?: "fullscreen" | "in-app";
};

export default function CountdownOverlay({ variant = "fullscreen" }: CountdownOverlayProps) {
  const { showOverlay, countdown } = useTracker();
  const { settings } = useAppSettings();
  const prevCountdown = useRef(0);
  const usesMainTimer =
    typeof window !== "undefined" && Boolean(window.electronAPI?.usesMainTimer);

  useEffect(() => {
    if (!showOverlay || countdown <= 0) return;
    if (countdown !== prevCountdown.current) {
      if (shouldPlayAlertSound(settings)) playAlertBeep(countdown, { settings });
      prevCountdown.current = countdown;
    }
  }, [showOverlay, countdown, settings]);

  if (!showOverlay) return null;

  if (usesMainTimer) return null;

  const isInApp = variant === "in-app";
  const compact = isInApp;

  return (
    <div
      className={`countdown-overlay iphone-no-drag ${isInApp ? "countdown-overlay-in-app" : "countdown-overlay-fullscreen"}${shouldShowAlertFlash(settings) ? " countdown-overlay-flash" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Break countdown alert"
    >
      <div className="countdown-overlay-backdrop" aria-hidden />
      <CountdownStage countdown={countdown} compact={compact} />
    </div>
  );
}
