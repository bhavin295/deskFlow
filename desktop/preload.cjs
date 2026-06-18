const { contextBridge, ipcRenderer } = require("electron");

const isDevBuild = process.env.NODE_ENV === "development";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  usesMainTimer: true,
  isDevBuild,

  getDesqStatus: () => ipcRenderer.invoke("desq:get-status"),
  syncDeskq: () => ipcRenderer.invoke("desq:sync"),

  getTimerState: () => ipcRenderer.invoke("timer:get-state"),
  startTimer: () => ipcRenderer.invoke("timer:start"),
  stopTimer: () => ipcRenderer.invoke("timer:stop"),
  resetTimer: () => ipcRenderer.invoke("timer:reset"),
  testAlert: () => ipcRenderer.invoke("timer:test-alert"),
  simulateScreenshot: () => ipcRenderer.invoke("timer:simulate-screenshot"),
  getTimerConfig: () => ipcRenderer.invoke("timer:get-config"),
  setTimerConfig: (config) => ipcRenderer.invoke("timer:set-config", config),

  onTimerState: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on("timer:state", handler);
    return () => ipcRenderer.removeListener("timer:state", handler);
  },

  onWindowShown: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("window:shown", handler);
    return () => ipcRenderer.removeListener("window:shown", handler);
  },

  onOpenSettings: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("app:open-settings", handler);
    return () => ipcRenderer.removeListener("app:open-settings", handler);
  },

  onDesqDetected: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("tracker:desq-detected", handler);
    return () => ipcRenderer.removeListener("tracker:desq-detected", handler);
  },

  onDesqRestart: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("tracker:screenshot-restart", handler);
    return () => ipcRenderer.removeListener("tracker:screenshot-restart", handler);
  },

  onDesqTimerStopped: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("tracker:desq-timer-stopped", handler);
    return () => ipcRenderer.removeListener("tracker:desq-timer-stopped", handler);
  },

  onDesqTimerStarted: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("tracker:desq-timer-started", handler);
    return () => ipcRenderer.removeListener("tracker:desq-timer-started", handler);
  },

  onDesqStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("desq:status", handler);
    return () => ipcRenderer.removeListener("desq:status", handler);
  },

  getKeepAliveConfig: () => ipcRenderer.invoke("keep-alive:get-config"),
  setKeepAliveEnabled: (enabled) => ipcRenderer.invoke("keep-alive:set-enabled", enabled),
  setKeepAliveRotateScreens: (rotate) => ipcRenderer.invoke("keep-alive:set-rotate-screens", rotate),
  setKeepAliveIntervalMinutes: (minutes) =>
    ipcRenderer.invoke("keep-alive:set-interval-minutes", minutes),
  testKeepAliveNudge: () => ipcRenderer.invoke("keep-alive:test-nudge"),

  onKeepAliveActivity: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("keep-alive:activity", handler);
    return () => ipcRenderer.removeListener("keep-alive:activity", handler);
  },

  onKeepAliveConfig: (callback) => {
    const handler = (_event, config) => callback(config);
    ipcRenderer.on("keep-alive:config", handler);
    return () => ipcRenderer.removeListener("keep-alive:config", handler);
  },

  getAccessibilityStatus: () => ipcRenderer.invoke("accessibility:get-status"),
  requestAccessibilityAccess: () => ipcRenderer.invoke("accessibility:request"),
  openAccessibilitySettings: () => ipcRenderer.invoke("accessibility:open-settings"),

  getAlwaysOnTop: () => ipcRenderer.invoke("window:get-always-on-top"),
  setAlwaysOnTop: (value) => ipcRenderer.invoke("window:set-always-on-top", value),
  minimizeToTray: () => ipcRenderer.invoke("window:minimize-to-tray"),
  showWindow: () => ipcRenderer.invoke("window:show"),

  getLoginItem: () => ipcRenderer.invoke("login-item:get"),
  setLoginItem: (enabled) => ipcRenderer.invoke("login-item:set", enabled),
});
