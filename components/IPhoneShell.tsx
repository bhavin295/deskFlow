"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import AccessibilityBanner from "@/components/AccessibilityBanner";
import ActivityToasts from "@/components/ActivityToasts";
import AnimatedBackground from "@/components/AnimatedBackground";
import BreakHub from "@/components/BreakHub";
import type { HubItem } from "@/components/BreakHub";
import BreakFocusOverlay from "@/components/BreakFocusOverlay";
import BrowserDevBanner from "@/components/BrowserDevBanner";
import CycleSummaryToast from "@/components/CycleSummaryToast";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { PreviewCountdownProvider } from "@/components/PreviewCountdown";
import CountdownOverlay from "@/components/CountdownOverlay";
import IPhoneDock, { type HubTab } from "@/components/IPhoneDock";
import IPhoneHardware from "@/components/IPhoneHardware";
import IPhoneStatusBar from "@/components/IPhoneStatusBar";
import OnboardingWizard, { shouldShowOnboarding } from "@/components/OnboardingWizard";
import SettingsPanel from "@/components/SettingsPanel";
import AppBrand from "@/components/AppBrand";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTracker } from "@/context/TrackerContext";

export default function IPhoneShell({ children }: { children: ReactNode }) {
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<HubTab>("games");
  const [hubInitialItem, setHubInitialItem] = useState<HubItem | null>(null);
  const [breakOverlayOpen, setBreakOverlayOpen] = useState(false);
  const [autoStartBreakTimer, setAutoStartBreakTimer] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { state, showOverlay, awaitingScreenshot } = useTracker();
  const { settings, hydrated } = useAppSettings();
  const canPlay = state !== "alert" && !showOverlay;
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron);
  const prevShowOverlay = useRef(showOverlay);

  useEffect(() => {
    if (!hydrated) return;
    setOnboardingOpen(shouldShowOnboarding());
  }, [hydrated]);

  useEffect(() => {
    if (prevShowOverlay.current && !showOverlay && settings.autoOpenWellness) {
      if (settings.autoStartBreakTimer) {
        setBreakOverlayOpen(true);
      } else {
        setHubTab("wellness");
        setHubInitialItem("breathing");
        setHubOpen(true);
      }
    }
    prevShowOverlay.current = showOverlay;
  }, [showOverlay, settings.autoOpenWellness, settings.autoStartBreakTimer]);

  return (
    <div className={`iphone-chassis${isElectron ? " iphone-drag-surface" : ""}`}>
      <IPhoneHardware />

      <div className="iphone-bezel">
        <div className="iphone-screen">
          <PreviewCountdownProvider>
            <AnimatedBackground />

            <div className="iphone-island iphone-drag-region" aria-hidden>
              <span className="iphone-island-cam" />
            </div>

            <IPhoneStatusBar />

            <div className="iphone-app-header iphone-drag-region">
              <AppBrand />
            </div>

            <BrowserDevBanner />
            <AccessibilityBanner />

            <div className={`iphone-content${isElectron ? " iphone-no-drag" : ""}`}>{children}</div>

            <CountdownOverlay variant="in-app" />
            <CycleSummaryToast />
            <ActivityToasts />
            <KeyboardShortcuts onOpenSettings={() => setSettingsOpen(true)} />
            <BreakFocusOverlay
              open={breakOverlayOpen}
              onClose={() => setBreakOverlayOpen(false)}
            />

            <IPhoneDock
              canPlay={canPlay}
              onOpenHub={(tab) => {
                setHubTab(tab);
                setHubInitialItem(null);
                setAutoStartBreakTimer(false);
                setHubOpen(true);
              }}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <BreakHub
              open={hubOpen}
              initialTab={hubTab}
              initialItem={hubInitialItem}
              autoStartBreakTimer={autoStartBreakTimer}
              onClose={() => {
                setHubOpen(false);
                setHubInitialItem(null);
                setAutoStartBreakTimer(false);
              }}
            />
            <SettingsPanel
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onReplaySetup={() => setOnboardingOpen(true)}
            />
            {onboardingOpen && (
              <OnboardingWizard onComplete={() => setOnboardingOpen(false)} />
            )}
          </PreviewCountdownProvider>
        </div>
      </div>
    </div>
  );
}
