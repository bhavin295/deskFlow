"use client";

import StatsCheerBuddy from "@/components/animations/StatsCheerBuddy";
import { METRIC_BADGE_SHAPES, METRIC_BADGE_TONES, METRIC_ICONS } from "@/components/svg/MetricIcons";
import { useTracker } from "@/context/TrackerContext";
import { useAppSettings } from "@/context/AppSettingsContext";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatInterval(minutes: number): string {
  return `${minutes.toString().padStart(2, "0")}:00`;
}

type StatsBarProps = {
  embedded?: boolean;
};

export default function StatsBar({ embedded = false }: StatsBarProps) {
  const { state, elapsedSeconds, nextAlertSeconds, alertIntervalSeconds, countdownStart } =
    useTracker();
  const { settings } = useAppSettings();
  const isRunning = state === "running" || state === "alert";

  if (embedded && isRunning) return null;
  const cyclePct = Math.round(
    ((elapsedSeconds % alertIntervalSeconds) / alertIntervalSeconds) * 100,
  );

  const metricValues = {
    interval: formatInterval(settings.alertIntervalMinutes),
    alert: `${countdownStart}s`,
    next: formatTime(nextAlertSeconds),
    cycle: `${cyclePct}%`,
  } as const;

  const metrics = [
    { key: "interval" as const, label: "Interval", tone: "metrics-tone-blue", live: false },
    { key: "alert" as const, label: "Countdown", tone: "metrics-tone-violet", live: false },
    { key: "next" as const, label: "Next in", tone: "metrics-tone-emerald", live: true },
    { key: "cycle" as const, label: "Cycle", tone: "metrics-tone-amber", live: true },
  ];

  return (
    <div className={`stats-section${embedded ? " stats-section-embedded" : ""}`}>
      <span className="stats-cheer-playful">
        <StatsCheerBuddy visible={isRunning} />
      </span>
      <div
        className={`metrics-strip metrics-strip-funky${embedded ? " metrics-strip-embedded" : ""}`}
        role="group"
        aria-label="Session metrics"
      >
        {metrics.map(({ key, label, tone, live }) => {
          const value = metricValues[key];
          const isLive = live && isRunning;
          const Icon = METRIC_ICONS[key];

          return (
            <div key={key} className={`metrics-cell ${tone}`}>
              {Icon && (
                <span
                  className={`metrics-badge ${METRIC_BADGE_TONES[key]} ${METRIC_BADGE_SHAPES[key]}`}
                >
                  <Icon />
                </span>
              )}
              <span
                key={isLive ? value : key}
                className={`metrics-value ${isLive ? "metrics-value-live metrics-value-funky animate-stat-pop" : ""}`}
              >
                {value}
              </span>
              <span className="metrics-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
