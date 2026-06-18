const { app, BrowserWindow, ipcMain, shell, nativeImage, screen, Notification, globalShortcut } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const serverConfig = require(path.join(__dirname, "..", "config", "server.json"));
const { BackgroundService } = require("./services/background-service.cjs");
const { TimerService, COUNTDOWN_START } = require("./timer-service.cjs");
const { createTray, destroyTray, refreshTrayFromApp } = require("./tray.cjs");
const { createOverlayWindow, syncSystemOverlay, destroyOverlay } = require("./overlay.cjs");
const { loadBrandNativeImage } = require("./icon-utils.cjs");
const { KeepAliveService } = require("./services/keep-alive-service.cjs");
const {
  getAccessibilityStatus,
  isAccessibilityGranted,
  openAccessibilitySettings,
  requestAccessibilityAccess,
} = require("./services/accessibility-service.cjs");
const { startNextServer, stopNextServer } = require("./next-server.cjs");

function getAppUrl() {
  return process.env.ELECTRON_APP_URL || serverConfig.APP_URL;
}

const IPHONE_WIDTH = 393;
const IPHONE_HEIGHT = 852;

const APP_NAME = "DeskFlow";

let mainWindow = null;
let backgroundService = null;
let timerService = null;
let tray = null;
let keepAliveService = null;
let prevShowOverlay = false;
let alwaysOnTop = false;

function getAppIcon() {
  return loadBrandNativeImage(512);
}

function setAppIcon() {
  const icon = getAppIcon();
  if (icon.isEmpty()) return;

  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
    app.dock.setIcon(icon);
  }
}

function broadcast(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
  if (
    channel === "desq:status" ||
    channel === "tracker:desq-timer-started" ||
    channel === "tracker:desq-timer-stopped"
  ) {
    keepAliveService?.syncWithSession();
    refreshTray();
  }
}

/** Exclude DeskFlow from screen capture (DeskQ screenshots) without hiding the window. */
function applyScreenshotProtection() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setContentProtection(true);
}

function refreshTray() {
  if (!tray || !timerService) return;
  refreshTrayFromApp(
    timerService.getState(),
    backgroundService?.getStatus() ?? {},
    keepAliveService?.getConfig() ?? {},
  );
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
}

function notifyAlertIfHidden(timerState) {
  if (!timerState?.showOverlay) return;
  const hidden =
    !mainWindow ||
    mainWindow.isDestroyed() ||
    !mainWindow.isVisible() ||
    !mainWindow.isFocused();
  if (!hidden) return;
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: "DeskFlow — focus alert",
    body: `${timerState.countdownStart ?? 3}-second countdown started. Click to open DeskFlow.`,
    silent: false,
  });
  notification.on("click", () => bringTrackerToFront());
  notification.show();
}

function broadcastState(state) {
  if (state.showOverlay && !prevShowOverlay) {
    notifyAlertIfHidden(state);
  }
  prevShowOverlay = Boolean(state.showOverlay);

  broadcast("timer:state", state);
  syncSystemOverlay(state);
  applyScreenshotProtection();
  keepAliveService?.syncWithSession();
  refreshTray();
}

function bringTrackerToFront() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }
  mainWindow.show();
  mainWindow.focus();
}

function getWindowPositionPath() {
  return path.join(app.getPath("userData"), "window-position.json");
}

function clampWindowPosition(x, y) {
  const display = screen.getDisplayNearestPoint({ x, y });
  const area = display.workArea;
  return {
    x: Math.min(Math.max(x, area.x), area.x + area.width - IPHONE_WIDTH),
    y: Math.min(Math.max(y, area.y), area.y + area.height - IPHONE_HEIGHT),
  };
}

function loadWindowPosition() {
  try {
    const raw = JSON.parse(fs.readFileSync(getWindowPositionPath(), "utf8"));
    if (Number.isFinite(raw?.x) && Number.isFinite(raw?.y)) {
      return clampWindowPosition(Math.round(raw.x), Math.round(raw.y));
    }
  } catch {
    /* first launch or corrupt file */
  }
  return null;
}

function saveWindowPosition(position) {
  try {
    fs.writeFileSync(getWindowPositionPath(), JSON.stringify(position, null, 2));
  } catch (err) {
    console.warn("[DeskFlow] window position save failed:", err.message);
  }
}

function getDefaultWindowPosition() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;
  return clampWindowPosition(
    Math.round(area.x + (area.width - IPHONE_WIDTH) / 2),
    Math.round(area.y + (area.height - IPHONE_HEIGHT) / 2),
  );
}

function persistMainWindowPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [x, y] = mainWindow.getPosition();
  saveWindowPosition(clampWindowPosition(x, y));
}

function createMainWindow() {
  const icon = getAppIcon();
  const initialPosition = loadWindowPosition() ?? getDefaultWindowPosition();
  let savePositionTimer = null;

  mainWindow = new BrowserWindow({
    x: initialPosition.x,
    y: initialPosition.y,
    width: IPHONE_WIDTH,
    height: IPHONE_HEIGHT,
    minWidth: IPHONE_WIDTH,
    maxWidth: IPHONE_WIDTH,
    minHeight: IPHONE_HEIGHT,
    maxHeight: IPHONE_HEIGHT,
    resizable: false,
    show: false,
    title: "",
    icon: icon.isEmpty() ? undefined : icon,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    roundedCorners: true,
    hasShadow: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  if (process.platform === "darwin" && mainWindow.setWindowButtonVisibility) {
    mainWindow.setWindowButtonVisibility(false);
  }

  mainWindow.loadURL(getAppUrl());

  mainWindow.once("ready-to-show", () => {
    applyScreenshotProtection();
    backgroundService?.syncDeskq();
    bringTrackerToFront();
    broadcastState(timerService.getState());
    promptAccessibilityIfNeeded("app-ready");
  });

  mainWindow.on("show", () => {
    broadcastState(timerService.getState());
    broadcast("window:shown");
  });

  mainWindow.on("moved", () => {
    clearTimeout(savePositionTimer);
    savePositionTimer = setTimeout(persistMainWindowPosition, 200);
  });

  mainWindow.on("close", (event) => {
    persistMainWindowPosition();
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      // Keep DeskFlow in the Mac Dock so clicking the icon reopens the window.
      if (process.platform === "darwin" && app.dock) {
        app.dock.show();
        setAppIcon();
      }
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });

  return mainWindow;
}

function getTimerPersistPath() {
  return path.join(app.getPath("userData"), "timer-session.json");
}

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  const shortcuts = [
    { accel: "CommandOrControl+Shift+H", action: hideMainWindow },
    {
      accel: "CommandOrControl+Shift+T",
      action: () => {
        timerService?.testAlert();
        bringTrackerToFront();
      },
    },
    {
      accel: "CommandOrControl+Shift+D",
      action: async () => {
        await backgroundService?.syncDeskq();
        bringTrackerToFront();
      },
    },
    {
      accel: "CommandOrControl+Shift+,",
      action: () => {
        bringTrackerToFront();
        broadcast("app:open-settings");
      },
    },
  ];

  for (const { accel, action } of shortcuts) {
    try {
      globalShortcut.register(accel, action);
    } catch (err) {
      console.warn(`[DeskFlow] shortcut ${accel} failed:`, err.message);
    }
  }
}

function setupIpc() {
  ipcMain.handle("desq:get-status", () => backgroundService?.getStatus() ?? {});
  ipcMain.handle("desq:sync", () => backgroundService?.syncDeskq() ?? {});
  ipcMain.handle("timer:get-state", () => timerService.getState());
  ipcMain.handle("timer:start", () => {
    timerService.start();
    return timerService.getState();
  });
  ipcMain.handle("timer:stop", () => {
    timerService.stop();
    return timerService.getState();
  });
  ipcMain.handle("timer:reset", () => {
    timerService.reset();
    return timerService.getState();
  });
  ipcMain.handle("timer:test-alert", () => {
    timerService.testAlert();
    return timerService.getState();
  });
  ipcMain.handle("timer:simulate-screenshot", () => {
    timerService.restartAfterScreenshot();
    return timerService.getState();
  });
  ipcMain.handle("timer:get-config", () => timerService.getConfig());
  ipcMain.handle("timer:set-config", (_event, config) => timerService.setConfig(config ?? {}));
  ipcMain.handle("keep-alive:get-config", () => keepAliveService?.getConfig() ?? {});
  ipcMain.handle("keep-alive:set-enabled", (_event, enabled) =>
    keepAliveService?.setEnabled(enabled) ?? {},
  );
  ipcMain.handle("keep-alive:set-rotate-screens", (_event, rotate) =>
    keepAliveService?.setRotateScreens(rotate) ?? {},
  );
  ipcMain.handle("keep-alive:set-interval-minutes", (_event, minutes) =>
    keepAliveService?.setIntervalMinutes(minutes) ?? {},
  );
  ipcMain.handle("keep-alive:test-nudge", async () => keepAliveService?.testNudge());
  ipcMain.handle("accessibility:get-status", () => getAccessibilityStatus());
  ipcMain.handle("accessibility:request", () => {
    const result = requestAccessibilityAccess();
    return { ...result, ...getAccessibilityStatus() };
  });
  ipcMain.handle("accessibility:open-settings", () => openAccessibilitySettings());
  ipcMain.handle("window:get-always-on-top", () => alwaysOnTop);
  ipcMain.handle("window:set-always-on-top", (_event, value) => {
    alwaysOnTop = Boolean(value);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(alwaysOnTop, "floating");
    }
    return alwaysOnTop;
  });
  ipcMain.handle("window:minimize-to-tray", () => {
    hideMainWindow();
    return true;
  });
  ipcMain.handle("window:show", () => {
    bringTrackerToFront();
    return true;
  });
  ipcMain.handle("login-item:get", () => {
    if (process.platform !== "darwin") return { supported: false, enabled: false };
    const settings = app.getLoginItemSettings();
    return { supported: true, enabled: Boolean(settings.openAtLogin) };
  });
  ipcMain.handle("login-item:set", (_event, enabled) => {
    if (process.platform !== "darwin") return { supported: false, enabled: false };
    app.setLoginItemSettings({ openAtLogin: Boolean(enabled), openAsHidden: false });
    const settings = app.getLoginItemSettings();
    return { supported: true, enabled: Boolean(settings.openAtLogin) };
  });
}

function promptAccessibilityIfNeeded(reason) {
  if (process.platform !== "darwin") return;
  if (isAccessibilityGranted()) return;

  const status = getAccessibilityStatus();
  console.log(
    `[DeskFlow] Accessibility not granted (${reason}) — enable "${status.appName}" in ${status.settingsPath}`,
  );
  requestAccessibilityAccess();
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function bootstrap() {
  loadEnvFile(path.join(__dirname, "..", ".env.local"));
  loadEnvFile(path.join(__dirname, "..", ".env"));

  app.setName(APP_NAME);
  setAppIcon();

  timerService = new TimerService({ persistPath: getTimerPersistPath() });
  timerService.on("state", broadcastState);
  console.log(`[tracker-alert] alert countdown: ${COUNTDOWN_START}s`);

  // Register IPC before any renderer loads so early settings sync never hits missing handlers.
  setupIpc();

  createMainWindow();
  createOverlayWindow();

  backgroundService = new BackgroundService(broadcast, timerService);
  backgroundService.start();
  const deskqStatus = backgroundService.getStatus();
  console.log(
    `[DeskFlow] DeskQ link: ${deskqStatus.running ? deskqStatus.mode ?? "log" : "idle"} ${
      deskqStatus.agentDbPath ?? deskqStatus.logPath ?? "(not configured)"
    }`,
  );

  keepAliveService = new KeepAliveService({
    getSessionActive: () => {
      const timer = timerService.getState();
      const deskq = backgroundService.getStatus();
      const deskqActive = Boolean(deskq?.deskqTrackingActive);
      const timerActive =
        timer.engaged &&
        (timer.state === "running" || timer.state === "alert" || timer.awaitingScreenshot);
      return deskqActive || timerActive;
    },
    onSessionActive: () => promptAccessibilityIfNeeded("session-active"),
    onActivity: (payload) => broadcast("keep-alive:activity", payload),
    onConfigChange: (config) => {
      broadcast("keep-alive:config", config);
      refreshTray();
    },
  });
  keepAliveService.start();
  keepAliveService.syncWithSession();

  tray = createTray({
    onShow: bringTrackerToFront,
    onHide: hideMainWindow,
    onSync: async () => {
      await backgroundService?.syncDeskq();
      bringTrackerToFront();
    },
    onTestAlert: () => {
      timerService?.testAlert();
      bringTrackerToFront();
    },
    onQuit: () => {
      app.isQuitting = true;
      app.quit();
    },
  });
  refreshTray();
  registerGlobalShortcuts();
}

app.whenReady().then(async () => {
  try {
    if (app.isPackaged) {
      await startNextServer(serverConfig.PORT || 4000);
    }
    bootstrap();
  } catch (err) {
    console.error("[DeskFlow] Failed to start:", err);
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  stopNextServer();
  timerService?.destroy();
  backgroundService?.stop();
  keepAliveService?.destroy();
  destroyOverlay();
  destroyTray();
});

app.on("activate", () => bringTrackerToFront());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
