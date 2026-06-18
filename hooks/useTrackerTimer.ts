"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, type TrackerPersistedState, type TrackerState, type StatusLabel } from "@/types/tracker";
import type { DesqStatus, TimerStatePayload } from "@/types/electron";
import { startCountdownSession, type CountdownSession } from "@/lib/countdownTicker";

const defaultPersistedState: TrackerPersistedState = {
  state: "stopped",
  elapsedSeconds: 0,
  countdown: 0,
  showOverlay: false,
};

type TimerOptions = {
  alertIntervalSeconds: number;
  countdownStart: number;
};

function getStatusLabel(
  state: TrackerState,
  showOverlay: boolean,
  awaitingScreenshot: boolean,
): StatusLabel {
  if (state === "alert" || showOverlay) return "Alert Active";
  if (awaitingScreenshot) return "Awaiting DeskQ";
  if (state === "running") return "Running";
  return "Waiting";
}

function getNextAlertSeconds(
  elapsedSeconds: number,
  awaitingScreenshot: boolean,
  alertIntervalSeconds: number,
): number {
  if (awaitingScreenshot) return alertIntervalSeconds;
  const remainder = elapsedSeconds % alertIntervalSeconds;
  if (remainder === 0 && elapsedSeconds > 0) return alertIntervalSeconds;
  return alertIntervalSeconds - remainder;
}

function loadPersistedState(): TrackerPersistedState {
  if (typeof window === "undefined") return defaultPersistedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersistedState;
    const parsed = JSON.parse(raw) as Partial<TrackerPersistedState>;
    return {
      state: parsed.state ?? "stopped",
      elapsedSeconds: parsed.elapsedSeconds ?? 0,
      countdown: parsed.countdown ?? 0,
      showOverlay: parsed.showOverlay ?? false,
    };
  } catch {
    return defaultPersistedState;
  }
}

export function useTrackerTimer({ alertIntervalSeconds, countdownStart }: TimerOptions) {
  const [state, setState] = useState<TrackerState>("stopped");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [nextAlertSeconds, setNextAlertSeconds] = useState(alertIntervalSeconds);
  const [awaitingScreenshot, setAwaitingScreenshot] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [usesMainTimer, setUsesMainTimer] = useState(false);
  const [deskqStatus, setDeskqStatus] = useState<DesqStatus | null>(null);
  const alertTriggeredAt = useRef<number | null>(null);
  const engagedRef = useRef(false);
  const countdownSession = useRef<CountdownSession | null>(null);

  const applyMainState = useCallback((s: TimerStatePayload) => {
    setState(s.state);
    setElapsedSeconds(s.elapsedSeconds);
    setCountdown(s.countdown);
    setShowOverlay(s.showOverlay);
    setNextAlertSeconds(s.nextAlertSeconds);
    setAwaitingScreenshot(Boolean(s.awaitingScreenshot));
    if (s.engaged !== undefined) engagedRef.current = s.engaged;
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    const isMain = Boolean(api?.usesMainTimer);

    queueMicrotask(() => setUsesMainTimer(isMain));

    if (isMain && api) {
      api.getTimerState().then((s) => {
        applyMainState(s);
        setHydrated(true);
      });

      const unsubTimer = api.onTimerState(applyMainState);
      const unsubShow = api.onWindowShown(() => {
        api.getTimerState().then(applyMainState);
      });
      const unsubDeskq = api.onDesqStatus(setDeskqStatus);
      api.getDesqStatus().then(setDeskqStatus);
      api.syncDeskq?.().then((result) => {
        if (result?.timer) applyMainState(result.timer);
        if (result?.status) setDeskqStatus(result.status);
      });

      return () => {
        unsubTimer();
        unsubShow();
        unsubDeskq();
      };
    }

    const persisted = loadPersistedState();
    if (persisted.countdown > countdownStart) {
      persisted.countdown = countdownStart;
    }
    if (persisted.showOverlay) {
      persisted.showOverlay = false;
      persisted.countdown = 0;
      if (persisted.state === "alert") persisted.state = "stopped";
    }
    queueMicrotask(() => {
      setState(persisted.state);
      setElapsedSeconds(persisted.elapsedSeconds);
      setCountdown(persisted.countdown);
      setShowOverlay(persisted.showOverlay);
      if (persisted.showOverlay) alertTriggeredAt.current = persisted.elapsedSeconds;
      setNextAlertSeconds(getNextAlertSeconds(persisted.elapsedSeconds, false, alertIntervalSeconds));
      setHydrated(true);
    });
  }, [applyMainState, alertIntervalSeconds, countdownStart]);

  useEffect(() => {
    if (!hydrated || usesMainTimer) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state, elapsedSeconds, countdown, showOverlay }),
    );
  }, [state, elapsedSeconds, countdown, showOverlay, hydrated, usesMainTimer]);

  useEffect(() => {
    if (usesMainTimer || state !== "running") return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (
          next > 0 &&
          next % alertIntervalSeconds === 0 &&
          alertTriggeredAt.current !== next
        ) {
          alertTriggeredAt.current = next;
          setState("alert");
          setCountdown(countdownStart);
          setShowOverlay(true);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state, usesMainTimer, alertIntervalSeconds, countdownStart]);

  useEffect(() => {
    if (usesMainTimer || state !== "alert" || !showOverlay) {
      countdownSession.current?.cancel();
      countdownSession.current = null;
      return;
    }

    const start = countdown > 0 ? countdown : countdownStart;
    setCountdown(start);

    countdownSession.current?.cancel();
    countdownSession.current = startCountdownSession(
      start,
      setCountdown,
      () => {
        countdownSession.current = null;
        setShowOverlay(false);
        setState("stopped");
        setElapsedSeconds(0);
        setAwaitingScreenshot(engagedRef.current);
        alertTriggeredAt.current = null;
        setCountdown(0);
      },
    );

    return () => {
      countdownSession.current?.cancel();
      countdownSession.current = null;
    };
  }, [state, showOverlay, usesMainTimer, countdownStart]);

  useEffect(() => {
    if (usesMainTimer) return;
    setNextAlertSeconds(getNextAlertSeconds(elapsedSeconds, awaitingScreenshot, alertIntervalSeconds));
  }, [elapsedSeconds, awaitingScreenshot, alertIntervalSeconds, usesMainTimer]);

  const start = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.usesMainTimer) {
      const s = await api.startTimer();
      applyMainState(s);
      return;
    }
    engagedRef.current = true;
    setAwaitingScreenshot(false);
    setState("running");
  }, [applyMainState]);

  const stop = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.usesMainTimer) {
      const s = await api.stopTimer();
      applyMainState(s);
      return;
    }
    engagedRef.current = false;
    setAwaitingScreenshot(false);
    setState("stopped");
    setShowOverlay(false);
    setCountdown(0);
  }, [applyMainState]);

  const reset = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.usesMainTimer) {
      const s = await api.resetTimer();
      applyMainState(s);
      return;
    }
    engagedRef.current = false;
    setAwaitingScreenshot(false);
    setState("stopped");
    setElapsedSeconds(0);
    setCountdown(0);
    setShowOverlay(false);
    alertTriggeredAt.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }, [applyMainState]);

  const testAlert = useCallback(async () => {
    const api = window.electronAPI;
    if (api?.usesMainTimer) {
      const s = await api.testAlert();
      applyMainState(s);
      return;
    }
    engagedRef.current = true;
    setAwaitingScreenshot(false);
    setState("alert");
    setCountdown(countdownStart);
    setShowOverlay(true);
  }, [applyMainState, countdownStart]);

  return {
    state,
    elapsedSeconds,
    countdown,
    showOverlay,
    statusLabel: getStatusLabel(state, showOverlay, awaitingScreenshot),
    nextAlertSeconds: usesMainTimer
      ? nextAlertSeconds
      : getNextAlertSeconds(elapsedSeconds, awaitingScreenshot, alertIntervalSeconds),
    awaitingScreenshot,
    deskqStatus,
    start,
    stop,
    reset,
    testAlert,
    hydrated,
    isSystemOverlay: usesMainTimer,
    alertIntervalSeconds,
    countdownStart,
  };
}
