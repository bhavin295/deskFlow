const { app, shell, systemPreferences } = require("electron");

const ACCESSIBILITY_SETTINGS_URLS = [
  "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility",
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
];

function isMac() {
  return process.platform === "darwin";
}

function getAccessibilityAppName() {
  if (!isMac()) return null;
  // Dev runs as Electron.app — user must enable that entry in Accessibility.
  return app.isPackaged ? "DeskFlow" : "Electron";
}

function isAccessibilityGranted() {
  if (!isMac()) return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}

/** Shows the macOS Accessibility consent dialog and opens System Settings if needed. */
function requestAccessibilityAccess() {
  if (!isMac()) {
    return { granted: true, prompted: false, appName: null };
  }

  const granted = systemPreferences.isTrustedAccessibilityClient(true);
  return {
    granted,
    prompted: true,
    appName: getAccessibilityAppName(),
  };
}

async function openAccessibilitySettings() {
  if (!isMac()) return false;

  for (const url of ACCESSIBILITY_SETTINGS_URLS) {
    try {
      await shell.openExternal(url);
      return true;
    } catch {
      /* try fallback URL */
    }
  }
  return false;
}

function getAccessibilityStatus() {
  const appName = getAccessibilityAppName();
  return {
    platformSupported: isMac(),
    granted: isAccessibilityGranted(),
    appName,
    settingsPath: "System Settings → Privacy & Security → Accessibility",
    devMode: isMac() && !app.isPackaged,
  };
}

module.exports = {
  getAccessibilityAppName,
  getAccessibilityStatus,
  isAccessibilityGranted,
  openAccessibilitySettings,
  requestAccessibilityAccess,
};
