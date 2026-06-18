const { Tray, Menu } = require("electron");
const { loadBrandNativeImage } = require("./icon-utils.cjs");

let tray = null;
let trayCallbacks = {
  onShow: () => {},
  onHide: () => {},
  onQuit: () => {},
  onSync: () => {},
  onTestAlert: () => {},
};

function buildTrayIcon() {
  return loadBrandNativeImage(18);
}

function formatClock(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function deskqLine(deskqStatus) {
  if (!deskqStatus?.running || !deskqStatus?.agentDbPath) return "DeskQ: not linked";
  if (deskqStatus.deskqTrackingActive) return "DeskQ: tracking";
  return "DeskQ: linked";
}

function phaseLabel(timerState) {
  if (timerState?.showOverlay || timerState?.state === "alert") return "Alert";
  if (timerState?.awaitingScreenshot) return "Awaiting";
  if (timerState?.state === "running") return "Focus";
  return "Idle";
}

function buildTrayStatus(timerState, deskqStatus, keepAliveConfig) {
  const phase = phaseLabel(timerState);
  const showNext =
    timerState?.state === "running" &&
    !timerState?.awaitingScreenshot &&
    !timerState?.showOverlay;

  return {
    phase,
    statusLabel:
      phase === "Focus"
        ? "Running"
        : phase === "Alert"
          ? "Alert Active"
          : phase === "Awaiting"
            ? "Awaiting DeskQ"
            : "Waiting",
    elapsedText: formatClock(timerState?.elapsedSeconds ?? 0),
    nextAlertText: showNext ? formatClock(timerState.nextAlertSeconds) : null,
    deskqText: deskqLine(deskqStatus),
    keepAliveOn: Boolean(keepAliveConfig?.enabled && keepAliveConfig?.accessibilityGranted),
  };
}

function updateTrayMenu(status) {
  if (!tray) return;

  const { phase, statusLabel, elapsedText, nextAlertText, deskqText, keepAliveOn } = status;
  const tooltipParts = [`DeskFlow — ${phase}`, elapsedText, deskqText];
  if (nextAlertText) tooltipParts.push(`Next ${nextAlertText}`);
  tray.setToolTip(tooltipParts.join(" · "));

  const items = [
    { label: `Phase: ${phase}`, enabled: false },
    { label: `Elapsed: ${elapsedText}`, enabled: false },
    { label: deskqText, enabled: false },
    nextAlertText ? { label: `Next alert: ${nextAlertText}`, enabled: false } : null,
    { label: `Keep-alive: ${keepAliveOn ? "On" : "Off"}`, enabled: false },
    { type: "separator" },
    { label: "Show DeskFlow", click: trayCallbacks.onShow },
    { label: "Hide DeskFlow", click: trayCallbacks.onHide },
    { type: "separator" },
    { label: "Sync DeskQ", click: trayCallbacks.onSync },
    { label: "Test alert", click: trayCallbacks.onTestAlert },
    { type: "separator" },
    { label: "Quit", click: trayCallbacks.onQuit },
  ].filter(Boolean);

  tray.setContextMenu(Menu.buildFromTemplate(items));
}

function createTray(callbacks) {
  if (tray) return tray;

  trayCallbacks = { ...trayCallbacks, ...callbacks };
  tray = new Tray(buildTrayIcon());
  updateTrayMenu({
    phase: "Idle",
    statusLabel: "Waiting",
    elapsedText: "0:00",
    nextAlertText: null,
    deskqText: "DeskQ: not linked",
    keepAliveOn: false,
  });
  tray.on("click", trayCallbacks.onShow);

  return tray;
}

function refreshTrayFromApp(timerState, deskqStatus, keepAliveConfig) {
  updateTrayMenu(buildTrayStatus(timerState, deskqStatus, keepAliveConfig));
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, destroyTray, refreshTrayFromApp, buildTrayStatus };
