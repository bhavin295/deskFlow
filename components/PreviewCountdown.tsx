"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTracker } from "@/context/TrackerContext";
import CountdownStage from "@/components/CountdownStage";
import { playAlertBeep, shouldPlayAlertSound, shouldShowAlertFlash } from "@/lib/alertFeedback";
import { startCountdownSession, type CountdownSession } from "@/lib/countdownTicker";
import { BellIcon } from "@/components/svg/Icons";

type PreviewCountdownContextValue = {
  startPreview: () => void;
  previewing: boolean;
};

const PreviewCountdownContext = createContext<PreviewCountdownContextValue | null>(null);

export function PreviewCountdownProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings();
  const { showOverlay } = useTracker();
  const [previewing, setPreviewing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const prevCountdown = useRef(0);
  const sessionRef = useRef<CountdownSession | null>(null);

  const stopSession = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
  }, []);

  const startPreview = useCallback(() => {
    if (previewing) return;
    stopSession();
    prevCountdown.current = 0;
    const start = settings.countdownStart;
    setCountdown(start);
    setPreviewing(true);
    sessionRef.current = startCountdownSession(
      start,
      setCountdown,
      () => {
        sessionRef.current = null;
        setPreviewing(false);
        setCountdown(0);
      },
    );
  }, [previewing, settings.countdownStart, stopSession]);

  useEffect(() => {
    if (showOverlay && previewing) {
      stopSession();
      setPreviewing(false);
      setCountdown(0);
    }
  }, [showOverlay, previewing, stopSession]);

  useEffect(() => () => stopSession(), [stopSession]);

  useEffect(() => {
    if (!previewing || countdown <= 0) return;
    if (countdown !== prevCountdown.current) {
      if (shouldPlayAlertSound(settings)) playAlertBeep(countdown, { settings });
      prevCountdown.current = countdown;
    }
  }, [previewing, countdown, settings.alertSound]);

  return (
    <PreviewCountdownContext.Provider value={{ startPreview, previewing }}>
      {children}
      {previewing && (
        <div
          className={`countdown-overlay iphone-no-drag countdown-overlay-in-app preview-countdown-overlay${shouldShowAlertFlash(settings) ? " countdown-overlay-flash" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Preview countdown demo"
        >
          <div className="countdown-overlay-backdrop" aria-hidden />
          <CountdownStage countdown={countdown} compact />
        </div>
      )}
    </PreviewCountdownContext.Provider>
  );
}

export function PreviewCountdownDockSlot() {
  const { state, awaitingScreenshot, showOverlay } = useTracker();
  const { startPreview, previewing } = usePreviewCountdown();
  const isActive = state === "running" || state === "alert" || awaitingScreenshot || showOverlay;
  const isDev =
    process.env.NODE_ENV === "development" ||
    Boolean(typeof window !== "undefined" && window.electronAPI?.isDevBuild);

  if (!isDev) return null;

  return (
    <button
      type="button"
      className="dock-util-slot dock-util-slot-preview"
      onClick={startPreview}
      disabled={isActive || previewing}
      title="Demo the alert countdown — does not start a session"
      aria-label="Preview countdown"
    >
      <span className="dock-util-icon dock-util-icon-preview" aria-hidden>
        <BellIcon className="h-4 w-4" />
      </span>
      <span className="dock-util-label">Preview</span>
    </button>
  );
}

export function usePreviewCountdown(): PreviewCountdownContextValue {
  const context = useContext(PreviewCountdownContext);
  if (!context) {
    throw new Error("usePreviewCountdown must be used within PreviewCountdownProvider");
  }
  return context;
}
