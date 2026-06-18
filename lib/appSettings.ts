import timerConfig from "@/config/timer.json";

export const APP_SETTINGS_KEY = "tracker-alert-settings";

export type SoundProfile = "soft" | "normal" | "silent";

export type AppSettings = {
  alertIntervalMinutes: number;
  countdownStart: number;
  alertSound: boolean;
  alertFlash: boolean;
  autoOpenWellness: boolean;
  autoStartBreakTimer: boolean;
  keepAliveRotateScreens: boolean;
  keepAliveIntervalMinutes: number;
  playfulMode: boolean;
  breakTimerMinutes: number;
  soundProfile: SoundProfile;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  awaitingTimeoutMinutes: number;
  launchAtLogin: boolean;
  alwaysOnTop: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  alertIntervalMinutes: timerConfig.ALERT_INTERVAL_MINUTES,
  countdownStart: timerConfig.COUNTDOWN_START,
  alertSound: true,
  alertFlash: true,
  autoOpenWellness: true,
  autoStartBreakTimer: true,
  keepAliveRotateScreens: true,
  keepAliveIntervalMinutes: 10,
  playfulMode: false,
  breakTimerMinutes: 5,
  soundProfile: "normal",
  quietHoursEnabled: false,
  quietHoursStart: 18,
  quietHoursEnd: 9,
  awaitingTimeoutMinutes: 20,
  launchAtLogin: false,
  alwaysOnTop: false,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      alertIntervalMinutes: clamp(
        parsed.alertIntervalMinutes ?? DEFAULT_SETTINGS.alertIntervalMinutes,
        5,
        30,
      ),
      countdownStart: clamp(parsed.countdownStart ?? DEFAULT_SETTINGS.countdownStart, 1, 10),
      alertSound: parsed.alertSound ?? DEFAULT_SETTINGS.alertSound,
      alertFlash: parsed.alertFlash ?? DEFAULT_SETTINGS.alertFlash,
      autoOpenWellness: parsed.autoOpenWellness ?? DEFAULT_SETTINGS.autoOpenWellness,
      autoStartBreakTimer: parsed.autoStartBreakTimer ?? DEFAULT_SETTINGS.autoStartBreakTimer,
      keepAliveRotateScreens:
        parsed.keepAliveRotateScreens ?? DEFAULT_SETTINGS.keepAliveRotateScreens,
      keepAliveIntervalMinutes: clamp(
        parsed.keepAliveIntervalMinutes ?? DEFAULT_SETTINGS.keepAliveIntervalMinutes,
        5,
        15,
      ),
      playfulMode: parsed.playfulMode ?? DEFAULT_SETTINGS.playfulMode,
      breakTimerMinutes: clamp(
        parsed.breakTimerMinutes ?? DEFAULT_SETTINGS.breakTimerMinutes,
        1,
        15,
      ),
      soundProfile: parsed.soundProfile ?? DEFAULT_SETTINGS.soundProfile,
      quietHoursEnabled: parsed.quietHoursEnabled ?? DEFAULT_SETTINGS.quietHoursEnabled,
      quietHoursStart: clamp(parsed.quietHoursStart ?? DEFAULT_SETTINGS.quietHoursStart, 0, 23),
      quietHoursEnd: clamp(parsed.quietHoursEnd ?? DEFAULT_SETTINGS.quietHoursEnd, 0, 23),
      awaitingTimeoutMinutes: clamp(
        parsed.awaitingTimeoutMinutes ?? DEFAULT_SETTINGS.awaitingTimeoutMinutes,
        12,
        45,
      ),
      launchAtLogin: parsed.launchAtLogin ?? DEFAULT_SETTINGS.launchAtLogin,
      alwaysOnTop: parsed.alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
