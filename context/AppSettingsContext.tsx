"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from "@/lib/appSettings";

type AppSettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  alertIntervalSeconds: number;
  hydrated: boolean;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

async function syncTimerConfigToElectron(settings: AppSettings): Promise<void> {
  const api = window.electronAPI;
  if (!api?.usesMainTimer || !api.setTimerConfig) return;
  try {
    await api.setTimerConfig({
      alertIntervalMinutes: settings.alertIntervalMinutes,
      countdownStart: settings.countdownStart,
      alertSound: settings.alertSound,
      alertFlash: settings.alertFlash,
    });
  } catch (error) {
    console.warn("[DeskFlow] timer config sync failed:", error);
  }
}

async function syncKeepAliveToElectron(settings: AppSettings): Promise<void> {
  const api = window.electronAPI;
  if (!api?.usesMainTimer) return;
  try {
    if (api.setKeepAliveRotateScreens) {
      await api.setKeepAliveRotateScreens(settings.keepAliveRotateScreens);
    }
    if (api.setKeepAliveIntervalMinutes) {
      await api.setKeepAliveIntervalMinutes(settings.keepAliveIntervalMinutes);
    }
  } catch (error) {
    console.warn("[DeskFlow] keep-alive settings sync failed:", error);
  }
}

async function syncWindowPrefsToElectron(settings: AppSettings): Promise<void> {
  const api = window.electronAPI;
  if (!api?.usesMainTimer) return;
  try {
    if (api.setAlwaysOnTop) {
      await api.setAlwaysOnTop(settings.alwaysOnTop);
    }
    if (api.setLoginItem) {
      await api.setLoginItem(settings.launchAtLogin);
    }
  } catch (error) {
    console.warn("[DeskFlow] window prefs sync failed:", error);
  }
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const loaded = loadAppSettings();
      setSettings(loaded);
      setHydrated(true);
      void syncWindowPrefsToElectron(loaded);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void syncTimerConfigToElectron(settings);
  }, [
    hydrated,
    settings.alertIntervalMinutes,
    settings.countdownStart,
    settings.alertSound,
    settings.alertFlash,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    void syncKeepAliveToElectron(settings);
  }, [hydrated, settings.keepAliveRotateScreens, settings.keepAliveIntervalMinutes]);

  useEffect(() => {
    if (!hydrated) return;
    void syncWindowPrefsToElectron(settings);
  }, [hydrated, settings.alwaysOnTop, settings.launchAtLogin]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAppSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      alertIntervalSeconds: settings.alertIntervalMinutes * 60,
      hydrated,
    }),
    [settings, updateSettings, hydrated],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
}
