import type { TrackerState } from "./tracker";

export interface DesqStatus {
  running: boolean;
  mode?: "log" | "agent";
  logPath: string | null;
  agentDbPath?: string | null;
  agentUserDir?: string | null;
  deskqTrackingActive?: boolean;
  lastScreenshotAt?: string | null;
  patterns: string[];
}

export interface DesqPayload {
  line?: string;
  at?: string;
  source?: string;
  message?: string;
}

export interface TimerConfig {
  alertIntervalMinutes: number;
  countdownStart: number;
  alertSound?: boolean;
  alertFlash?: boolean;
}

export interface TimerStatePayload {
  state: TrackerState;
  elapsedSeconds: number;
  countdown: number;
  showOverlay: boolean;
  nextAlertSeconds: number;
  awaitingScreenshot?: boolean;
  engaged?: boolean;
  countdownStart?: number;
  alertIntervalSeconds?: number;
  alertIntervalMinutes?: number;
  alertSound?: boolean;
  alertFlash?: boolean;
}

export interface KeepAliveConfig {
  enabled: boolean;
  intervalMinutes: number;
  idleThresholdSeconds: number;
  nudgePixels?: number;
  rotateScreens?: boolean;
  platformSupported: boolean;
  lastNudgeAt: string | null;
  lastError: string | null;
  accessibilityGranted?: boolean;
  accessibilityAppName?: string | null;
  accessibilitySettingsPath?: string;
  accessibilityDevMode?: boolean;
}

export interface AccessibilityStatus {
  platformSupported: boolean;
  granted: boolean;
  appName: string | null;
  settingsPath: string;
  devMode: boolean;
}

export interface KeepAliveActivityPayload {
  at: string;
  idleSeconds: number;
  idleAfter?: number;
  effective?: boolean;
  ok?: boolean;
  method?: string;
  message?: string;
}

export interface LoginItemStatus {
  supported: boolean;
  enabled: boolean;
}

export interface ElectronAPI {
  platform: string;
  isElectron: true;
  usesMainTimer?: boolean;
  isDevBuild?: boolean;
  getDesqStatus: () => Promise<DesqStatus>;
  syncDeskq?: () => Promise<{ status: DesqStatus; timer: TimerStatePayload }>;
  getTimerState: () => Promise<TimerStatePayload>;
  startTimer: () => Promise<TimerStatePayload>;
  stopTimer: () => Promise<TimerStatePayload>;
  resetTimer: () => Promise<TimerStatePayload>;
  testAlert: () => Promise<TimerStatePayload>;
  simulateScreenshot: () => Promise<TimerStatePayload>;
  getTimerConfig?: () => Promise<TimerConfig>;
  setTimerConfig?: (config: Partial<TimerConfig>) => Promise<TimerConfig>;
  onTimerState: (callback: (state: TimerStatePayload) => void) => () => void;
  onWindowShown: (callback: () => void) => () => void;
  onDesqDetected: (callback: (payload: DesqPayload) => void) => () => void;
  onDesqRestart: (callback: (payload: DesqPayload) => void) => () => void;
  onDesqTimerStopped: (callback: (payload: DesqPayload) => void) => () => void;
  onDesqTimerStarted: (callback: (payload: DesqPayload) => void) => () => void;
  onDesqStatus: (callback: (status: DesqStatus) => void) => () => void;
  getKeepAliveConfig?: () => Promise<KeepAliveConfig>;
  setKeepAliveEnabled?: (enabled: boolean) => Promise<KeepAliveConfig>;
  setKeepAliveRotateScreens?: (rotate: boolean) => Promise<KeepAliveConfig>;
  setKeepAliveIntervalMinutes?: (minutes: number) => Promise<KeepAliveConfig>;
  testKeepAliveNudge?: () => Promise<{ ok: boolean; idleAfter: number }>;
  onKeepAliveActivity?: (callback: (payload: KeepAliveActivityPayload) => void) => () => void;
  onKeepAliveConfig?: (callback: (config: KeepAliveConfig) => void) => () => void;
  getAccessibilityStatus?: () => Promise<AccessibilityStatus>;
  requestAccessibilityAccess?: () => Promise<AccessibilityStatus & { prompted: boolean }>;
  openAccessibilitySettings?: () => Promise<boolean>;
  getAlwaysOnTop?: () => Promise<boolean>;
  setAlwaysOnTop?: (value: boolean) => Promise<boolean>;
  minimizeToTray?: () => Promise<boolean>;
  showWindow?: () => Promise<boolean>;
  getLoginItem?: () => Promise<LoginItemStatus>;
  setLoginItem?: (enabled: boolean) => Promise<LoginItemStatus>;
  onOpenSettings?: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
