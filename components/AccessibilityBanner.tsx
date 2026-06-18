"use client";

import { useEffect, useState } from "react";
import { useTracker } from "@/context/TrackerContext";
import type { AccessibilityStatus } from "@/types/electron";

export default function AccessibilityBanner() {
  const { state, awaitingScreenshot, showOverlay } = useTracker();
  const [accessibility, setAccessibility] = useState<AccessibilityStatus | null>(null);
  const sessionActive =
    state === "running" || state === "alert" || awaitingScreenshot || showOverlay;
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron);

  useEffect(() => {
    if (!isElectron || !sessionActive) return;
    void window.electronAPI?.getAccessibilityStatus?.().then(setAccessibility);
  }, [isElectron, sessionActive]);

  if (!isElectron || !sessionActive || accessibility?.granted) return null;

  return (
    <div className="accessibility-banner" role="alert">
      <p className="accessibility-banner-title">Accessibility permission required</p>
      <p className="accessibility-banner-copy">
        Keep-alive cannot nudge the cursor until {accessibility?.appName ?? "DeskFlow"} is allowed in
        System Settings → Privacy & Security → Accessibility.
      </p>
      <button
        type="button"
        className="ui-btn ui-btn-ghost ui-btn-compact"
        onClick={() => void window.electronAPI?.openAccessibilitySettings?.()}
      >
        Open Settings
      </button>
    </div>
  );
}
