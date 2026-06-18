"use client";

import { useEffect, useState } from "react";
import { DESKQ_CONNECTION_LABELS, getDeskqConnectionState } from "@/lib/deskqConnection";
import { useTracker } from "@/context/TrackerContext";

function formatStatusTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatNextAlert(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function IPhoneStatusBar() {
  const { state, nextAlertSeconds, showOverlay, deskqStatus } = useTracker();
  const [time, setTime] = useState("--:--");

  const connection = getDeskqConnectionState(deskqStatus);
  const connectionLabel = DESKQ_CONNECTION_LABELS[connection];
  const isSessionActive = state === "running" || state === "alert" || showOverlay;

  useEffect(() => {
    const tick = () => setTime(formatStatusTime(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ios-status-bar iphone-drag-region">
      <span className="ios-status-time">{time}</span>
      <div className="ios-status-meta">
        {isSessionActive && (
          <span className="ios-status-next">Next · {formatNextAlert(nextAlertSeconds)}</span>
        )}
        <span
          className={`ios-status-deskq ios-status-deskq-${connection}`}
          title={`DeskQ: ${connectionLabel}`}
          aria-label={`DeskQ: ${connectionLabel}`}
        >
          <span className="ios-status-deskq-dot" aria-hidden />
        </span>
      </div>
    </div>
  );
}
