const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");
const { powerMonitor } = require("electron");
const {
  getAccessibilityStatus,
  isAccessibilityGranted,
  requestAccessibilityAccess,
} = require("./accessibility-service.cjs");
const { rotateToNextScreen } = require("./screen-rotate.cjs");

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // 10 min — 5 min buffer before typical DeskQ 15 min idle stop
const DEFAULT_IDLE_THRESHOLD_S = 30;
const DEFAULT_NUDGE_PX = 6;
const DEFAULT_CHECK_EVERY_MS = 60 * 1000;
const NUDGE_SCRIPT_JXA = path.join(__dirname, "..", "scripts", "nudge-pointer.jxa.js");
const NUDGE_SCRIPT_SWIFT = path.join(__dirname, "..", "scripts", "nudge-pointer.swift");

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(raw, fallback = false) {
  if (raw == null || raw === "") return fallback;
  const value = String(raw).trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes") return true;
  if (value === "0" || value === "false" || value === "no") return false;
  return fallback;
}

function execCommand(file, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { timeout: 30_000, env: { ...process.env, ...extraEnv } },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr?.trim() || err.message || String(err)));
          return;
        }
        resolve(String(stdout ?? "").trim());
      },
    );
  });
}

class KeepAliveService {
  #enabled = false;
  #intervalMs = DEFAULT_INTERVAL_MS;
  #idleThresholdS = DEFAULT_IDLE_THRESHOLD_S;
  #nudgePx = DEFAULT_NUDGE_PX;
  #checkEveryMs = DEFAULT_CHECK_EVERY_MS;
  #rotateScreens = false;
  #lastNudgeAt = null;
  #lastError = null;
  #timer = null;
  #getSessionActive = () => false;
  #onSessionActive = null;
  #onActivity = null;
  #onConfigChange = null;
  #accessibilityPrompted = false;
  #nudgeInFlight = false;
  #desktopCycleIndex = 0;
  #lastNudgeMethod = "nudge";

  constructor({ getSessionActive, onSessionActive, onActivity, onConfigChange }) {
    this.#getSessionActive = getSessionActive;
    this.#onSessionActive = onSessionActive;
    this.#onActivity = onActivity;
    this.#onConfigChange = onConfigChange;
    this.#intervalMs = parsePositiveInt(process.env.DESKFLOW_KEEP_ALIVE_INTERVAL_MS, DEFAULT_INTERVAL_MS);
    this.#idleThresholdS = parsePositiveInt(
      process.env.DESKFLOW_KEEP_ALIVE_IDLE_THRESHOLD_S,
      DEFAULT_IDLE_THRESHOLD_S,
    );
    this.#nudgePx = parsePositiveInt(process.env.DESKFLOW_KEEP_ALIVE_NUDGE_PX, DEFAULT_NUDGE_PX);
    this.#checkEveryMs = parsePositiveInt(
      process.env.DESKFLOW_KEEP_ALIVE_CHECK_MS,
      DEFAULT_CHECK_EVERY_MS,
    );
    this.#rotateScreens = parseBool(process.env.DESKFLOW_KEEP_ALIVE_ROTATE_SCREENS, true);
  }

  isPlatformSupported() {
    return process.platform === "darwin" || process.platform === "win32";
  }

  getConfig() {
    const accessibility = getAccessibilityStatus();
    return {
      enabled: this.#enabled,
      intervalMinutes: Math.round(this.#intervalMs / 60_000),
      idleThresholdSeconds: this.#idleThresholdS,
      nudgePixels: this.#nudgePx,
      rotateScreens: this.#rotateScreens,
      platformSupported: this.isPlatformSupported(),
      lastNudgeAt: this.#lastNudgeAt ? new Date(this.#lastNudgeAt).toISOString() : null,
      lastError: this.#lastError,
      accessibilityGranted: accessibility.granted,
      accessibilityAppName: accessibility.appName,
      accessibilitySettingsPath: accessibility.settingsPath,
      accessibilityDevMode: accessibility.devMode,
    };
  }

  setEnabled(enabled) {
    this.#enabled = Boolean(enabled);
    this.#onConfigChange?.(this.getConfig());
    return this.getConfig();
  }

  setRotateScreens(rotate) {
    this.#rotateScreens = Boolean(rotate);
    this.#onConfigChange?.(this.getConfig());
    return this.getConfig();
  }

  setIntervalMinutes(minutes) {
    const parsed = Number.parseInt(String(minutes ?? ""), 10);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 15) {
      this.#intervalMs = parsed * 60_000;
    }
    this.#onConfigChange?.(this.getConfig());
    return this.getConfig();
  }

  syncWithSession() {
    const shouldEnable = this.#getSessionActive();
    const accessibilityGranted = isAccessibilityGranted();

    if (shouldEnable && accessibilityGranted) {
      this.#lastError = null;
    }

    if (this.#enabled === shouldEnable) {
      this.#onConfigChange?.(this.getConfig());
      return this.getConfig();
    }

    this.#enabled = shouldEnable;
    console.log(
      `[DeskFlow] keep-alive auto-${shouldEnable ? "on" : "off"} (session ${shouldEnable ? "active" : "stopped"})`,
    );

    if (shouldEnable) {
      this.#onSessionActive?.();
      if (process.platform === "darwin" && !accessibilityGranted && !this.#accessibilityPrompted) {
        this.#accessibilityPrompted = true;
        requestAccessibilityAccess();
        this.#lastError = `Allow ${getAccessibilityStatus().appName} in System Settings → Privacy & Security → Accessibility`;
      }
    } else {
      this.#accessibilityPrompted = false;
      this.#lastNudgeAt = null;
    }

    this.#onConfigChange?.(this.getConfig());
    return this.getConfig();
  }

  start() {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.#tick(), this.#checkEveryMs);
    this.#tick();
  }

  stop() {
    if (!this.#timer) return;
    clearInterval(this.#timer);
    this.#timer = null;
  }

  destroy() {
    this.stop();
  }

  async testNudge() {
    if (!this.isPlatformSupported()) {
      throw new Error(`Keep-alive not supported on ${process.platform}`);
    }
    if (process.platform === "darwin" && !isAccessibilityGranted()) {
      throw new Error(`Allow ${getAccessibilityStatus().appName} in System Settings → Privacy & Security → Accessibility`);
    }
    await this.#nudgePointer();
    const idleAfter = powerMonitor.getSystemIdleTime();
    return { ok: true, idleAfter };
  }

  #tick() {
    if (!this.#enabled || !this.isPlatformSupported()) return;
    if (!this.#getSessionActive()) return;
    if (this.#nudgeInFlight) return;

    if (process.platform === "darwin" && !isAccessibilityGranted()) {
      const { appName, settingsPath } = getAccessibilityStatus();
      this.#lastError = `Allow ${appName} in ${settingsPath}`;
      this.#onConfigChange?.(this.getConfig());
      return;
    }

    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (idleSeconds < this.#idleThresholdS) return;

    const now = Date.now();
    if (this.#lastNudgeAt && now - this.#lastNudgeAt < this.#intervalMs) return;

    const idleBefore = powerMonitor.getSystemIdleTime();
    this.#nudgeInFlight = true;

    this.#nudgePointer()
      .then(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 150);
          }),
      )
      .then(() => {
        const idleAfter = powerMonitor.getSystemIdleTime();
        const effective = idleAfter < idleBefore || idleAfter <= 2;
        this.#lastNudgeAt = now;
        this.#lastError = effective
          ? null
          : "Nudge ran but system idle time did not reset — check Accessibility permission";
        const method = this.#rotateScreens ? this.#lastNudgeMethod : "nudge";
        const message = effective ? `${method} · idle reset OK` : this.#lastError;
        console.log(
          `[DeskFlow] keep-alive nudge ${method} (idle before ${idleBefore}s, after ${idleAfter}s, effective=${effective})`,
        );
        this.#onActivity?.({
          at: new Date(now).toISOString(),
          idleSeconds: idleBefore,
          idleAfter,
          effective,
          method,
          message,
          ok: effective,
        });
        this.#onConfigChange?.(this.getConfig());
      })
      .catch((err) => {
        this.#lastError = err.message ?? String(err);
        console.warn("[DeskFlow] keep-alive nudge failed:", this.#lastError);
        this.#onActivity?.({
          at: new Date().toISOString(),
          idleSeconds: idleBefore,
          ok: false,
          effective: false,
          method: this.#rotateScreens ? this.#lastNudgeMethod : "nudge",
          message: this.#lastError,
        });
        this.#onConfigChange?.(this.getConfig());
      })
      .finally(() => {
        this.#nudgeInFlight = false;
      });
  }

  #nudgePointer() {
    if (process.platform === "darwin") {
      return this.#nudgeMac();
    }
    if (process.platform === "win32") {
      return this.#nudgeWindows();
    }
    return Promise.reject(new Error(`Keep-alive not supported on ${process.platform}`));
  }

  async #nudgeMac() {
    const nudgeEnv = {
      DESKFLOW_KEEP_ALIVE_NUDGE_PX: String(this.#nudgePx),
    };
    let rotateLabel = "in-place";

    if (this.#rotateScreens) {
      const rotated = await rotateToNextScreen({
        execCommand,
        desktopCycleIndex: this.#desktopCycleIndex,
      });
      this.#desktopCycleIndex = rotated.desktopCycleIndex;
      nudgeEnv.DESKFLOW_JUMP_X = String(rotated.target.x);
      nudgeEnv.DESKFLOW_JUMP_Y = String(rotated.target.y);
      rotateLabel = rotated.target.kind;
      this.#lastNudgeMethod = rotateLabel.includes("Cmd") ? "Cmd+Tab" : rotateLabel;
    }

    if (fs.existsSync(NUDGE_SCRIPT_JXA) && !this.#rotateScreens) {
      try {
        await execCommand("osascript", ["-l", "JavaScript", NUDGE_SCRIPT_JXA], nudgeEnv);
        return;
      } catch (err) {
        console.warn("[DeskFlow] JXA keep-alive nudge failed, trying Swift:", err.message);
      }
    }

    if (fs.existsSync(NUDGE_SCRIPT_SWIFT)) {
      const output = await execCommand("swift", [NUDGE_SCRIPT_SWIFT, String(this.#nudgePx)], nudgeEnv);
      console.log(`[DeskFlow] keep-alive rotate: ${rotateLabel} · ${output || "ok"}`);
      return;
    }

    throw new Error("Keep-alive nudge scripts missing — reinstall DeskFlow");
  }

  #nudgeWindows() {
    const px = this.#nudgePx;
    const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DeskFlowMouse {
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT lpPoint);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
}
"@
$p = New-Object DeskFlowMouse+POINT
[DeskFlowMouse]::GetCursorPos([ref]$p) | Out-Null
$x = $p.X
$y = $p.Y
[DeskFlowMouse]::SetCursorPos($x + ${px}, $y) | Out-Null
Start-Sleep -Milliseconds 40
[DeskFlowMouse]::SetCursorPos($x + ${px}, $y + ${px}) | Out-Null
Start-Sleep -Milliseconds 40
[DeskFlowMouse]::SetCursorPos($x, $y + ${px}) | Out-Null
Start-Sleep -Milliseconds 40
[DeskFlowMouse]::SetCursorPos($x, $y) | Out-Null
`;
    return execCommand("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps]);
  }
}

module.exports = { KeepAliveService };
