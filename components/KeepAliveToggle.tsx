"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityIcon } from "@/components/svg/Icons";
import { useTracker } from "@/context/TrackerContext";
import type { AccessibilityStatus, KeepAliveConfig } from "@/types/electron";

const DEFAULT_CONFIG: KeepAliveConfig = {
  enabled: false,
  intervalMinutes: 10,
  idleThresholdSeconds: 30,
  platformSupported: false,
  lastNudgeAt: null,
  lastError: null,
  accessibilityGranted: false,
  accessibilityAppName: null,
  accessibilitySettingsPath: "System Settings → Privacy & Security → Accessibility",
  accessibilityDevMode: false,
};

function isSessionActive(
  state: string,
  awaitingScreenshot: boolean,
  deskqTracking: boolean,
): boolean {
  const timerActive =
    state === "running" || state === "alert" || awaitingScreenshot;
  return deskqTracking || timerActive;
}

export default function KeepAliveToggle() {
  const { state, awaitingScreenshot, deskqStatus } = useTracker();
  const [config, setConfig] = useState<KeepAliveConfig | null>(null);
  const [accessibility, setAccessibility] = useState<AccessibilityStatus | null>(null);
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.usesMainTimer);

  const sessionActive = isSessionActive(
    state,
    awaitingScreenshot,
    Boolean(deskqStatus?.deskqTrackingActive),
  );

  const refreshAccessibility = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.getAccessibilityStatus) return;
    try {
      setAccessibility(await api.getAccessibilityStatus());
    } catch {
      setAccessibility(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.getKeepAliveConfig) return;
    try {
      const next = await api.getKeepAliveConfig();
      setConfig(next);
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
    await refreshAccessibility();
  }, [refreshAccessibility]);

  useEffect(() => {
    if (!isElectron) return;
    void refresh();
    const api = window.electronAPI;
    const unsubConfig = api?.onKeepAliveConfig?.((next) => {
      setConfig(next);
      void refreshAccessibility();
    });
    const unsubActivity = api?.onKeepAliveActivity?.(() => {
      void refresh();
    });
    const onFocus = () => {
      void refreshAccessibility();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      unsubConfig?.();
      unsubActivity?.();
      window.removeEventListener("focus", onFocus);
    };
  }, [isElectron, refresh, refreshAccessibility]);

  async function handleGrantAccess() {
    const api = window.electronAPI;
    if (!api?.requestAccessibilityAccess) return;
    await api.requestAccessibilityAccess();
    await refresh();
  }

  async function handleOpenSettings() {
    const api = window.electronAPI;
    if (!api?.openAccessibilitySettings) return;
    await api.openAccessibilitySettings();
    await refresh();
  }

  if (!isElectron || !config) return null;

  const enabled = sessionActive && config.enabled;
  const granted = accessibility?.granted ?? config.accessibilityGranted ?? false;
  const appName = accessibility?.appName ?? config.accessibilityAppName ?? "DeskFlow";
  const showPermissionStatus = config.platformSupported;
  const needsAccessibility = showPermissionStatus && !granted;

  const rotateNote = config.rotateScreens ? " · Cmd+Tab each nudge" : "";

  const detail = needsAccessibility
    ? `Allow ${appName} in System Settings → Accessibility`
    : sessionActive
      ? enabled
        ? config.lastNudgeAt
          ? `Last nudge ${new Date(config.lastNudgeAt).toLocaleTimeString()} · every ${config.intervalMinutes} min · ${config.nudgePixels ?? 6}px drag${rotateNote}`
          : `Every ${config.intervalMinutes} min when idle · ${config.nudgePixels ?? 6}px drag${rotateNote}`
        : "Starting with your session…"
      : "Turns on automatically when DeskQ tracking starts";

  return (
    <div className="keep-alive-row">
      {needsAccessibility && sessionActive && (
        <div className="keep-alive-access" role="region" aria-label="Accessibility permission">
          <p className="keep-alive-hint" role="status">
            Keep-alive needs Accessibility permission. In dev mode, enable <strong>{appName}</strong>{" "}
            (not DeskFlow) in System Settings.
          </p>
          <div className="keep-alive-access-actions">
            <button type="button" className="keep-alive-access-btn" onClick={() => void handleGrantAccess()}>
              Show permission prompt
            </button>
            <button
              type="button"
              className="keep-alive-access-btn keep-alive-access-btn-secondary"
              onClick={() => void handleOpenSettings()}
            >
              Open System Settings
            </button>
          </div>
        </div>
      )}

      {config.lastError && enabled && granted && (
        <p className="keep-alive-hint" role="status">
          {config.lastError}
        </p>
      )}

      <div
        className={`keep-alive-btn keep-alive-btn-status ${enabled && granted ? "keep-alive-btn-on keep-alive-btn-funky" : ""}`}
        role="status"
        aria-live="polite"
        title={
          enabled && granted
            ? `Keep-alive on — nudge every ${config.intervalMinutes} min when idle`
            : "Keep-alive follows your DeskQ session"
        }
      >
        <span className={`keep-alive-icon ${enabled && granted ? "keep-alive-icon-on" : ""}`}>
          <ActivityIcon className="h-4 w-4" />
        </span>
        <span className="keep-alive-copy">
          <span className="keep-alive-label">Keep alive</span>
          <span className="keep-alive-detail">{detail}</span>
        </span>
        <span className="keep-alive-pills">
          {showPermissionStatus && (
            <span
              className={`keep-alive-status-pill ${
                granted
                  ? "keep-alive-status-pill-perm-granted"
                  : "keep-alive-status-pill-perm-required"
              }`}
              title={
                granted
                  ? "Accessibility permission granted"
                  : `Accessibility permission required for ${appName}`
              }
            >
              <span className="keep-alive-status-dot" aria-hidden />
              {granted ? "Granted" : "Required"}
            </span>
          )}
          <span
            className={`keep-alive-status-pill keep-alive-status-pill-session ${
              enabled && granted ? "keep-alive-status-pill-session-on" : ""
            }`}
          >
            <span className="keep-alive-status-dot" aria-hidden />
            {enabled && granted ? "On" : "Off"}
          </span>
        </span>
      </div>
    </div>
  );
}
