"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";
import { formatMmSs } from "@/lib/timeFormat";

type BreakFocusOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function BreakFocusTimer({ minutes, onClose }: { minutes: number; onClose: () => void }) {
  const total = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(total);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const done = secondsLeft <= 0;

  return (
    <div className="break-focus-card">
      <p className="break-focus-eyebrow">Break time</p>
      <p className="break-focus-time">{done ? "0:00" : formatMmSs(secondsLeft)}</p>
      <p className="break-focus-hint">
        {done ? "Ready when you are" : `${minutes}-minute rest · breathe & stretch`}
      </p>
      <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
        {done ? "Back to focus" : "Skip break"}
      </button>
    </div>
  );
}

export default function BreakFocusOverlay({ open, onClose }: BreakFocusOverlayProps) {
  const { settings } = useAppSettings();
  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!open) return null;

  return (
    <div className="break-focus-overlay" role="dialog" aria-modal="true" aria-label="Break timer">
      <div className="break-focus-backdrop" aria-hidden />
      <BreakFocusTimer
        key={settings.breakTimerMinutes}
        minutes={settings.breakTimerMinutes}
        onClose={handleClose}
      />
    </div>
  );
}
