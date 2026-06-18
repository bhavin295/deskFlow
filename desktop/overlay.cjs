const path = require("node:path");
const { BrowserWindow, screen } = require("electron");

let overlayWindow = null;

function createOverlayWindow() {
  if (overlayWindow) return overlayWindow;

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: display.workArea.x,
    y: display.workArea.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "overlay-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "floating");
  const appUrl = process.env.ELECTRON_APP_URL || "http://localhost:4000";
  overlayWindow.loadURL(`${appUrl}/overlay`);
  overlayWindow.hide();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

function hideOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  overlayWindow.webContents.send("overlay:update", { mode: "hidden" });
  overlayWindow.hide();
}

/**
 * System-wide overlay — only the 3→1 alert countdown.
 * Hidden while running or stopped so it never blocks the app window.
 */
function syncSystemOverlay({
  state,
  countdown,
  showOverlay,
  countdownStart,
  alertIntervalMinutes,
  alertSound,
  alertFlash,
}) {
  if (state !== "alert" || !showOverlay) {
    hideOverlay();
    return;
  }

  const win = createOverlayWindow();
  const payload = {
    mode: "alert",
    countdown,
    countdownStart: countdownStart ?? 3,
    alertIntervalMinutes: alertIntervalMinutes ?? 11,
    alertSound: alertSound !== false,
    alertFlash: alertFlash !== false,
    visible: true,
  };

  const sendUpdate = () => {
    if (win.isDestroyed()) return;
    win.webContents.send("overlay:update", payload);
    win.show();
  };

  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", sendUpdate);
  } else {
    sendUpdate();
  }
}

function destroyOverlay() {
  if (overlayWindow) {
    overlayWindow.destroy();
    overlayWindow = null;
  }
}

module.exports = {
  createOverlayWindow,
  syncSystemOverlay,
  destroyOverlay,
};
