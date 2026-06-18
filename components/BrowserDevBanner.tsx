"use client";

export default function BrowserDevBanner() {
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron);

  if (process.env.NODE_ENV !== "development" || isElectron) return null;

  return (
    <div className="browser-dev-banner" role="status">
      <span className="browser-dev-badge">Web preview</span>
      <span className="browser-dev-copy">DeskQ sync unavailable — use Electron for full testing</span>
    </div>
  );
}
