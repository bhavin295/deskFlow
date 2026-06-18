"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CountdownStage from "@/components/CountdownStage";
import { playAlertBeep } from "@/lib/alertFeedback";
import { startCountdownSession, type CountdownSession } from "@/lib/countdownTicker";

type OverlayPayload = {
  mode?: string;
  visible?: boolean;
  countdown?: number;
  countdownStart?: number;
  alertIntervalMinutes?: number;
  alertSound?: boolean;
  alertFlash?: boolean;
};

declare global {
  interface Window {
    electronOverlay?: {
      onUpdate: (callback: (payload: OverlayPayload) => void) => void;
    };
  }
}

export default function ElectronOverlayPage() {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownStart, setCountdownStart] = useState(3);
  const [alertIntervalMinutes, setAlertIntervalMinutes] = useState(11);
  const [alertSound, setAlertSound] = useState(true);
  const [alertFlash, setAlertFlash] = useState(true);
  const prevCountdown = useRef(0);
  const sessionRef = useRef<CountdownSession | null>(null);
  const visibleRef = useRef(false);
  const countdownRef = useRef(0);

  const stopSession = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
  }, []);

  const beginCountdown = useCallback(
    (seconds: number) => {
      stopSession();
      prevCountdown.current = 0;
      setCountdown(seconds);
      countdownRef.current = seconds;
      sessionRef.current = startCountdownSession(
        seconds,
        (remaining) => {
          setCountdown(remaining);
          countdownRef.current = remaining;
        },
        () => {
          sessionRef.current = null;
          visibleRef.current = false;
          setVisible(false);
          setCountdown(0);
          countdownRef.current = 0;
        },
      );
    },
    [stopSession],
  );

  useEffect(() => {
    document.body.classList.add("overlay-window");
    return () => {
      document.body.classList.remove("overlay-window");
      stopSession();
    };
  }, [stopSession]);

  useEffect(() => {
    const api = window.electronOverlay;
    if (!api?.onUpdate) return;

    api.onUpdate((data) => {
      if (data.mode === "hidden" || !data.visible) {
        stopSession();
        visibleRef.current = false;
        setVisible(false);
        setCountdown(0);
        countdownRef.current = 0;
        prevCountdown.current = 0;
        return;
      }

      if (data.mode === "alert") {
        const start = data.countdownStart ?? 3;
        const next =
          typeof data.countdown === "number" && data.countdown > 0 ? data.countdown : start;

        setCountdownStart(start);
        if (data.alertIntervalMinutes) setAlertIntervalMinutes(data.alertIntervalMinutes);
        if (data.alertSound !== undefined) setAlertSound(data.alertSound);
        if (data.alertFlash !== undefined) setAlertFlash(data.alertFlash);

        const isNewAlert = !visibleRef.current || next > countdownRef.current;
        visibleRef.current = true;
        setVisible(true);

        if (isNewAlert) {
          beginCountdown(next);
        }
      }
    });
  }, [beginCountdown, stopSession]);

  useEffect(() => {
    if (!visible || countdown <= 0) return;
    if (alertSound && countdown !== prevCountdown.current) {
      playAlertBeep(countdown);
      prevCountdown.current = countdown;
    }
  }, [visible, countdown, alertSound]);

  if (!visible) {
    return <div className="overlay-root overlay-root-hidden" aria-hidden />;
  }

  return (
    <div
      className={`overlay-root countdown-overlay countdown-overlay-fullscreen countdown-overlay-electron${alertFlash ? " countdown-overlay-flash" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Break countdown alert"
    >
      <div className="countdown-overlay-backdrop" aria-hidden />
      <CountdownStage countdown={countdown} />
    </div>
  );
}
