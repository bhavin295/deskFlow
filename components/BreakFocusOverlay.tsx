"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";

type BreakFocusOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BreakFocusOverlay({ open, onClose }: BreakFocusOverlayProps) {
  const { settings } = useAppSettings();
  const total = settings.breakTimerMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(total);

  const start = useCallback(() => {
    setSecondsLeft(settings.breakTimerMinutes * 60);
  }, [settings.breakTimerMinutes]);

  useEffect(() => {
    if (!open) return;
    start();
  }, [open, start]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, secondsLeft]);

  if (!open) return null;

  const done = secondsLeft <= 0;

  return (
    <div className="break-focus-overlay" role="dialog" aria-modal="true" aria-label="Break timer">
      <div className="break-focus-backdrop" aria-hidden />
      <div className="break-focus-card">
        <p className="break-focus-eyebrow">Break time</p>
        <p className="break-focus-time">{done ? "0:00" : formatTime(secondsLeft)}</p>
        <p className="break-focus-hint">
          {done ? "Ready when you are" : `${settings.breakTimerMinutes}-minute rest · breathe & stretch`}
        </p>
        <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
          {done ? "Back to focus" : "Skip break"}
        </button>
      </div>
    </div>
  );
}
