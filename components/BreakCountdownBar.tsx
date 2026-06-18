"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";

type BreakCountdownBarProps = {
  active: boolean;
  autoStart?: boolean;
  onDismiss?: () => void;
};

function formatBreakTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function BreakCountdownBar({
  active,
  autoStart = false,
  onDismiss,
}: BreakCountdownBarProps) {
  const { settings } = useAppSettings();
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.breakTimerMinutes * 60);

  const startTimer = useCallback(() => {
    setSecondsLeft(settings.breakTimerMinutes * 60);
    setRunning(true);
  }, [settings.breakTimerMinutes]);

  useEffect(() => {
    if (!active) {
      setRunning(false);
      return;
    }
    if (autoStart) startTimer();
  }, [active, autoStart, startTimer]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, secondsLeft]);

  if (!active) return null;

  const finished = secondsLeft <= 0 && !running;

  return (
    <div className={`break-countdown-bar${finished ? " break-countdown-bar-done" : ""}`} role="status">
      <div className="break-countdown-copy">
        <span className="break-countdown-title">
          {finished ? "Break time is up" : running ? "Back in" : "Break timer"}
        </span>
        <span className="break-countdown-time">
          {finished ? "Ready to focus" : running ? formatBreakTime(secondsLeft) : `${settings.breakTimerMinutes} min`}
        </span>
      </div>
      <div className="break-countdown-actions">
        {!running && !finished && (
          <button type="button" className="break-countdown-btn" onClick={startTimer}>
            Start {settings.breakTimerMinutes}m
          </button>
        )}
        {running && (
          <button type="button" className="break-countdown-btn break-countdown-btn-secondary" onClick={() => setRunning(false)}>
            Pause
          </button>
        )}
        {onDismiss && (
          <button type="button" className="break-countdown-btn break-countdown-btn-secondary" onClick={onDismiss}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
