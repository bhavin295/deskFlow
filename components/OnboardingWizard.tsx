"use client";

import { useCallback, useEffect, useState } from "react";
import { usePreviewCountdown } from "@/components/PreviewCountdown";
import { useTracker } from "@/context/TrackerContext";
import { getDeskqConnectionState, DESKQ_CONNECTION_LABELS } from "@/lib/deskqConnection";
import { isOnboardingComplete, markOnboardingComplete } from "@/lib/onboarding";
import { useAppSettings } from "@/context/AppSettingsContext";
import type { AccessibilityStatus } from "@/types/electron";

type OnboardingWizardProps = {
  onComplete: () => void;
};

type StepId =
  | "welcome"
  | "deskq"
  | "electron"
  | "accessibility"
  | "test-nudge"
  | "test-countdown"
  | "done";

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { deskqStatus } = useTracker();
  const { settings } = useAppSettings();
  const { startPreview, previewing } = usePreviewCountdown();
  const [stepIndex, setStepIndex] = useState(0);
  const [accessibility, setAccessibility] = useState<AccessibilityStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [nudgeTesting, setNudgeTesting] = useState(false);
  const [nudgeResult, setNudgeResult] = useState<string | null>(null);
  const [countdownTested, setCountdownTested] = useState(false);

  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.usesMainTimer);
  const isMacElectron =
    isElectron && typeof window !== "undefined" && window.electronAPI?.platform === "darwin";

  const connection = getDeskqConnectionState(deskqStatus);
  const deskqLinked = connection !== "disconnected";

  const steps: StepId[] = isMacElectron
    ? ["welcome", "deskq", "electron", "accessibility", "test-nudge", "test-countdown", "done"]
    : isElectron
      ? ["welcome", "deskq", "electron", "test-countdown", "done"]
      : ["welcome", "deskq", "electron", "done"];

  const step = steps[stepIndex] ?? "done";
  const isLastStep = stepIndex >= steps.length - 1;

  const refreshAccessibility = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.getAccessibilityStatus) return;
    try {
      setAccessibility(await api.getAccessibilityStatus());
    } catch {
      setAccessibility(null);
    }
  }, []);

  useEffect(() => {
    if (step === "accessibility" || step === "test-nudge") void refreshAccessibility();
  }, [step, refreshAccessibility]);

  useEffect(() => {
    if (previewing) setCountdownTested(true);
  }, [previewing]);

  const handleSyncDeskq = async () => {
    const api = window.electronAPI;
    if (!api?.syncDeskq || syncing) return;
    setSyncing(true);
    try {
      await api.syncDeskq();
    } finally {
      setSyncing(false);
    }
  };

  const handleGrantAccessibility = async () => {
    const api = window.electronAPI;
    if (!api?.requestAccessibilityAccess) return;
    await api.requestAccessibilityAccess();
    await refreshAccessibility();
  };

  const handleOpenAccessibilitySettings = async () => {
    await window.electronAPI?.openAccessibilitySettings?.();
    await refreshAccessibility();
  };

  const handleTestNudge = async () => {
    const api = window.electronAPI;
    if (!api?.testKeepAliveNudge || nudgeTesting) return;
    setNudgeTesting(true);
    setNudgeResult(null);
    try {
      const result = await api.testKeepAliveNudge();
      setNudgeResult(`Nudge OK — idle time now ${result.idleAfter}s`);
    } catch (err) {
      setNudgeResult(err instanceof Error ? err.message : "Nudge failed");
    } finally {
      setNudgeTesting(false);
    }
  };

  const finish = () => {
    markOnboardingComplete();
    onComplete();
  };

  const goNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const canContinue =
    step !== "test-countdown" || countdownTested || !isElectron;

  return (
    <div className="onboarding-backdrop" role="presentation">
      <div className="onboarding-panel" role="dialog" aria-modal="true" aria-label="DeskFlow setup">
        <div className="onboarding-progress" aria-hidden>
          {steps.map((id, index) => (
            <span
              key={id}
              className={`onboarding-progress-dot${index <= stepIndex ? " onboarding-progress-dot-active" : ""}`}
            />
          ))}
        </div>

        {step === "welcome" && (
          <>
            <h2 className="onboarding-title">Welcome to DeskFlow</h2>
            <p className="onboarding-copy">
              Calm {settings.alertIntervalMinutes}-minute focus cycles synced with DeskQ Agent. Playful
              visuals are off by default — turn them on anytime in Settings → Appearance.
            </p>
            <p className="onboarding-copy onboarding-copy-muted">
              This setup takes about a minute.
            </p>
          </>
        )}

        {step === "deskq" && (
          <>
            <h2 className="onboarding-title">Connect DeskQ Agent</h2>
            <p className="onboarding-copy">
              DeskFlow follows your session when DeskQ Agent is running and you start tracking there.
            </p>
            <div className={`onboarding-status onboarding-status-${connection}`}>
              <span className="onboarding-status-dot" aria-hidden />
              <span>{DESKQ_CONNECTION_LABELS[connection]}</span>
            </div>
            {isElectron ? (
              <button
                type="button"
                className="onboarding-btn ui-btn ui-btn-ghost"
                onClick={() => void handleSyncDeskq()}
                disabled={syncing}
              >
                {syncing ? "Checking…" : "Check DeskQ connection"}
              </button>
            ) : (
              <p className="onboarding-copy onboarding-copy-muted">
                Install DeskQ Agent on this machine first.
              </p>
            )}
            {deskqLinked && (
              <p className="onboarding-hint onboarding-hint-ok">DeskQ Agent found — you&apos;re linked.</p>
            )}
          </>
        )}

        {step === "electron" && (
          <>
            <h2 className="onboarding-title">Use the Electron app</h2>
            <p className="onboarding-copy">
              DeskQ sync, keep-alive nudges, and system alerts require the DeskFlow desktop app — not
              the browser preview alone.
            </p>
            <ol className="onboarding-checklist">
              <li>Keep DeskQ Agent running in the background</li>
              <li>Launch DeskFlow from Applications or <code>npm run electron</code></li>
              <li>Start tracking in DeskQ to begin a cycle</li>
            </ol>
          </>
        )}

        {step === "accessibility" && (
          <>
            <h2 className="onboarding-title">Allow Accessibility</h2>
            <p className="onboarding-copy">
              Keep-alive moves the cursor to reset idle time. macOS requires Accessibility permission
              for {accessibility?.appName ?? "DeskFlow"}.
            </p>
            <div
              className={`onboarding-status onboarding-status-${accessibility?.granted ? "tracking" : "disconnected"}`}
            >
              <span className="onboarding-status-dot" aria-hidden />
              <span>{accessibility?.granted ? "Permission granted" : "Permission required"}</span>
            </div>
            {!accessibility?.granted && (
              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-btn ui-btn ui-btn-ghost"
                  onClick={() => void handleGrantAccessibility()}
                >
                  Show permission prompt
                </button>
                <button
                  type="button"
                  className="onboarding-btn onboarding-btn-secondary ui-btn ui-btn-ghost"
                  onClick={() => void handleOpenAccessibilitySettings()}
                >
                  Open System Settings
                </button>
              </div>
            )}
          </>
        )}

        {step === "test-nudge" && (
          <>
            <h2 className="onboarding-title">Test keep-alive nudge</h2>
            <p className="onboarding-copy">
              With rotation {settings.keepAliveRotateScreens ? "on" : "off"}, nudges{" "}
              {settings.keepAliveRotateScreens
                ? "press Cmd+Tab then move the mouse"
                : "move the cursor in place"}{" "}
              every {settings.keepAliveIntervalMinutes} minutes when idle.
            </p>
            <button
              type="button"
              className="onboarding-btn ui-btn ui-btn-ghost"
              onClick={() => void handleTestNudge()}
              disabled={nudgeTesting || !accessibility?.granted}
            >
              {nudgeTesting ? "Testing…" : "Test keep-alive nudge"}
            </button>
            {nudgeResult && <p className="onboarding-hint">{nudgeResult}</p>}
          </>
        )}

        {step === "test-countdown" && (
          <>
            <h2 className="onboarding-title">Test alert countdown</h2>
            <p className="onboarding-copy">
              Preview the {settings.countdownStart}-second countdown you&apos;ll see after each focus
              alert. This does not start a session.
            </p>
            <button
              type="button"
              className="onboarding-btn ui-btn ui-btn-ghost"
              onClick={startPreview}
              disabled={previewing}
            >
              {previewing ? "Counting down…" : "Preview countdown"}
            </button>
            {countdownTested && (
              <p className="onboarding-hint onboarding-hint-ok">Countdown preview complete.</p>
            )}
          </>
        )}

        {step === "done" && (
          <>
            <h2 className="onboarding-title">You&apos;re set</h2>
            <p className="onboarding-copy">
              Start tracking in DeskQ to begin. DeskFlow alerts every {settings.alertIntervalMinutes}{" "}
              minutes and shows a calm break screen after each alert.
            </p>
            <ul className="onboarding-checklist">
              <li>Status row shows Running · DeskQ linked · time to alert</li>
              <li>Tray icon reflects session state when minimized</li>
              <li>Toggle Playful mode in Settings if you want mascots back</li>
            </ul>
          </>
        )}

        <div className="onboarding-footer">
          {stepIndex > 0 && step !== "done" && (
            <button
              type="button"
              className="onboarding-btn onboarding-btn-secondary ui-btn ui-btn-ghost"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="onboarding-btn onboarding-btn-primary ui-btn ui-btn-ghost"
            onClick={goNext}
            disabled={!canContinue}
          >
            {isLastStep ? "Get started" : "Continue"}
          </button>
        </div>

        {!isLastStep && (
          <button type="button" className="onboarding-skip" onClick={finish}>
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  return !isOnboardingComplete();
}
