import type { DesqStatus } from "@/types/electron";
import timerConfig from "@/config/timer.json";

export type TrackerState = "stopped" | "running" | "alert";

export type StatusLabel = "Running" | "Waiting" | "Alert Active" | "Awaiting DeskQ";

export const ALERT_INTERVAL_SECONDS = timerConfig.ALERT_INTERVAL_MINUTES * 60;
export const COUNTDOWN_START = timerConfig.COUNTDOWN_START;

export const STORAGE_KEY = "tracker-alert-state";

export interface TrackerPersistedState {
  state: TrackerState;
  elapsedSeconds: number;
  countdown: number;
  showOverlay: boolean;
}

export interface TrackerContextValue {
  state: TrackerState;
  elapsedSeconds: number;
  countdown: number;
  showOverlay: boolean;
  statusLabel: StatusLabel;
  nextAlertSeconds: number;
  awaitingScreenshot: boolean;
  deskqStatus: DesqStatus | null;
  alertIntervalSeconds: number;
  countdownStart: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  testAlert: () => void;
}
