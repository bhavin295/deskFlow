"use client";

import { useCallback, useState, type ReactNode } from "react";
import DeskQHealthPanel from "@/components/DeskQHealthPanel";
import DailyStatsPanel from "@/components/DailyStatsPanel";
import { useAppSettings } from "@/context/AppSettingsContext";
import { formatHour } from "@/lib/quietHours";
import { downloadSessionReport } from "@/lib/sessionHistory";
import type { SoundProfile } from "@/lib/appSettings";
import {
  ActivityIcon,
  BellIcon,
  CloseIcon,
  SettingsIcon,
  ShieldIcon,
  WellnessIcon,
} from "@/components/svg/Icons";
import { resetOnboarding } from "@/lib/onboarding";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  onReplaySetup?: () => void;
};

type SectionTone = "violet" | "emerald" | "amber" | "blue";

function SettingsSection({
  title,
  subtitle,
  tone,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  tone: SectionTone;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`settings-card settings-card-${tone}`}>
      <div className="settings-card-head">
        <span className={`settings-card-icon settings-card-icon-${tone}`} aria-hidden>
          {icon}
        </span>
        <div className="settings-card-head-copy">
          <h3 className="settings-card-title">{title}</h3>
          <p className="settings-card-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}

function SettingsSlider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <label className="settings-slider">
      <div className="settings-slider-top">
        <span className="settings-slider-label">{label}</span>
        <span className="settings-slider-value">
          {value}
          {unit}
        </span>
      </div>
      {hint && <span className="settings-slider-hint">{hint}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function SettingsSwitch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-switch">
      <span className="settings-switch-copy">
        <span className="settings-switch-label">{label}</span>
        {hint && <span className="settings-switch-hint">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="settings-switch-track" aria-hidden />
    </label>
  );
}

function SettingsSelect<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="settings-select">
      <span className="settings-select-copy">
        <span className="settings-select-label">{label}</span>
        {hint && <span className="settings-select-hint">{hint}</span>}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SettingsPanel({ open, onClose, onReplaySetup }: SettingsPanelProps) {
  const { settings, updateSettings } = useAppSettings();
  const [nudgeTesting, setNudgeTesting] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI?.usesMainTimer);

  const handleTestNudge = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.testKeepAliveNudge || nudgeTesting) return;
    setNudgeTesting(true);
    setNudgeMessage(null);
    try {
      const result = await api.testKeepAliveNudge();
      setNudgeMessage(`Keep-alive test OK · idle ${result.idleAfter}s`);
    } catch (err) {
      setNudgeMessage(err instanceof Error ? err.message : "Keep-alive test failed");
    } finally {
      setNudgeTesting(false);
    }
  }, [nudgeTesting]);

  const handleReplaySetup = () => {
    resetOnboarding();
    onClose();
    onReplaySetup?.();
  };

  if (!open) return null;

  return (
    <div className="settings-backdrop iphone-no-drag" role="presentation">
      <div className="settings-panel" role="dialog" aria-modal="true" aria-label="App settings">
        <div className="settings-panel-accent" aria-hidden />

        <div className="settings-panel-header">
          <div className="settings-header-main iphone-drag-region">
            <span className="settings-header-badge" aria-hidden>
              <SettingsIcon className="h-4 w-4" />
            </span>
            <div>
              <h2>Settings</h2>
              <p className="settings-header-tagline">Timer · DeskQ · Alerts · Appearance</p>
            </div>
          </div>
          <button
            type="button"
            className="settings-close iphone-no-drag"
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="settings-panel-body iphone-no-drag">
          <div className="settings-panel-main">
            <SettingsSection
              title="Timer"
              subtitle="Focus cycle length and break timer"
              tone="emerald"
              icon={<WellnessIcon className="h-4 w-4" />}
            >
              <SettingsSlider
                label="Focus interval"
                hint="Minutes between break reminders"
                value={settings.alertIntervalMinutes}
                min={5}
                max={30}
                step={1}
                unit="m"
                onChange={(alertIntervalMinutes) => updateSettings({ alertIntervalMinutes })}
              />
              <SettingsSlider
                label="Break timer"
                hint="Suggested rest length after alerts"
                value={settings.breakTimerMinutes}
                min={1}
                max={15}
                step={1}
                unit="m"
                onChange={(breakTimerMinutes) => updateSettings({ breakTimerMinutes })}
              />
            </SettingsSection>

            <SettingsSection
              title="DeskQ"
              subtitle="Companion sync and agent health"
              tone="blue"
              icon={<ShieldIcon className="h-4 w-4" />}
            >
              <DeskQHealthPanel />
            </SettingsSection>

            {isElectron && (
              <SettingsSection
                title="Keep-alive"
                subtitle="Stay active for DeskQ tracking"
                tone="amber"
                icon={<ActivityIcon className="h-4 w-4" />}
              >
                <SettingsSlider
                  label="Nudge interval"
                  hint="Mouse nudge when idle during session"
                  value={settings.keepAliveIntervalMinutes}
                  min={5}
                  max={15}
                  step={1}
                  unit="m"
                  onChange={(keepAliveIntervalMinutes) =>
                    updateSettings({ keepAliveIntervalMinutes })
                  }
                />
                <SettingsSwitch
                  label="Rotate screen on nudge"
                  hint="Cmd+Tab to switch app on each nudge (needs Accessibility)"
                  checked={settings.keepAliveRotateScreens}
                  onChange={(keepAliveRotateScreens) =>
                    updateSettings({ keepAliveRotateScreens })
                  }
                />
              </SettingsSection>
            )}

            <SettingsSection
              title="Alerts"
              subtitle="Countdown and break behavior"
              tone="violet"
              icon={<BellIcon className="h-4 w-4" />}
            >
              <SettingsSlider
                label="Countdown length"
                hint="Seconds shown before resuming"
                value={settings.countdownStart}
                min={1}
                max={10}
                step={1}
                unit="s"
                onChange={(countdownStart) => updateSettings({ countdownStart })}
              />
              <SettingsSwitch
                label="Alert sound"
                hint="Beep on each countdown step"
                checked={settings.alertSound}
                onChange={(alertSound) => updateSettings({ alertSound })}
              />
              <SettingsSwitch
                label="Screen flash"
                hint="Subtle pulse behind the alert"
                checked={settings.alertFlash}
                onChange={(alertFlash) => updateSettings({ alertFlash })}
              />
              <SettingsSwitch
                label="Open Wellness automatically"
                hint="Show break screen after each alert"
                checked={settings.autoOpenWellness}
                onChange={(autoOpenWellness) => updateSettings({ autoOpenWellness })}
              />
              <SettingsSwitch
                label="Auto-start break timer"
                hint="Begin break countdown right after 3-2-1"
                checked={settings.autoStartBreakTimer}
                onChange={(autoStartBreakTimer) => updateSettings({ autoStartBreakTimer })}
              />
              <SettingsSelect<SoundProfile>
                label="Sound profile"
                hint="Alert beep volume style"
                value={settings.soundProfile}
                options={[
                  { value: "soft", label: "Soft" },
                  { value: "normal", label: "Normal" },
                  { value: "silent", label: "Silent" },
                ]}
                onChange={(soundProfile) => updateSettings({ soundProfile })}
              />
              <SettingsSwitch
                label="Quiet hours"
                hint={`No sound/flash ${formatHour(settings.quietHoursStart)}–${formatHour(settings.quietHoursEnd)}`}
                checked={settings.quietHoursEnabled}
                onChange={(quietHoursEnabled) => updateSettings({ quietHoursEnabled })}
              />
              {settings.quietHoursEnabled && (
                <>
                  <SettingsSlider
                    label="Quiet starts"
                    value={settings.quietHoursStart}
                    min={0}
                    max={23}
                    step={1}
                    unit="h"
                    onChange={(quietHoursStart) => updateSettings({ quietHoursStart })}
                  />
                  <SettingsSlider
                    label="Quiet ends"
                    value={settings.quietHoursEnd}
                    min={0}
                    max={23}
                    step={1}
                    unit="h"
                    onChange={(quietHoursEnd) => updateSettings({ quietHoursEnd })}
                  />
                </>
              )}
              <SettingsSlider
                label="Screenshot timeout"
                hint="Warn if awaiting DeskQ longer than this"
                value={settings.awaitingTimeoutMinutes}
                min={12}
                max={45}
                step={1}
                unit="m"
                onChange={(awaitingTimeoutMinutes) => updateSettings({ awaitingTimeoutMinutes })}
              />
            </SettingsSection>

            {isElectron && (
              <SettingsSection
                title="Desktop"
                subtitle="Window and startup behavior"
                tone="blue"
                icon={<ShieldIcon className="h-4 w-4" />}
              >
                <SettingsSwitch
                  label="Always on top"
                  hint="Pin DeskFlow above other windows"
                  checked={settings.alwaysOnTop}
                  onChange={(alwaysOnTop) => updateSettings({ alwaysOnTop })}
                />
                <SettingsSwitch
                  label="Launch at login"
                  hint="Open DeskFlow when you sign in to macOS"
                  checked={settings.launchAtLogin}
                  onChange={(launchAtLogin) => updateSettings({ launchAtLogin })}
                />
                <p className="settings-shortcut-hint">
                  Shortcuts: ⌘⇧H hide · ⌘⇧T test alert · ⌘⇧D sync · ⌘⇧, settings
                </p>
              </SettingsSection>
            )}

            <SettingsSection
              title="Appearance"
              subtitle="Calm focus mode vs playful visuals"
              tone="violet"
              icon={<SettingsIcon className="h-4 w-4" />}
            >
              <SettingsSwitch
                label="Playful mode"
                hint="Cartoon mascots, gradients, and motion accents"
                checked={settings.playfulMode}
                onChange={(playfulMode) => updateSettings({ playfulMode })}
              />
            </SettingsSection>

            <SettingsSection
              title="Advanced"
              subtitle="Diagnostics and setup"
              tone="amber"
              icon={<ActivityIcon className="h-4 w-4" />}
            >
              <DailyStatsPanel />
              {isElectron && (
                <button
                  type="button"
                  className="ui-btn ui-btn-ghost settings-inline-btn"
                  onClick={() => void handleTestNudge()}
                  disabled={nudgeTesting}
                >
                  {nudgeTesting ? "Testing keep-alive…" : "Test keep-alive nudge"}
                </button>
              )}
              <button
                type="button"
                className="ui-btn ui-btn-ghost settings-inline-btn"
                onClick={() => downloadSessionReport("csv")}
              >
                Export session CSV
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-ghost settings-inline-btn"
                onClick={() => downloadSessionReport("json")}
              >
                Export session JSON
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-ghost settings-inline-btn"
                onClick={handleReplaySetup}
              >
                Replay setup wizard
              </button>
              {nudgeMessage && (
                <p className="settings-action-message" role="status">
                  {nudgeMessage}
                </p>
              )}
            </SettingsSection>
          </div>
        </div>
      </div>
    </div>
  );
}
