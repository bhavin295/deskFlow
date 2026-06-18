type IconProps = { className?: string };

const ICON_SIZE = "h-[10px] w-[10px]";

export function IntervalMetricIcon({ className = ICON_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`metric-icon-svg ${className}`} aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M8 4.5 V8 L10.2 9.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="metric-icon-hand"
      />
    </svg>
  );
}

export function CountdownMetricIcon({ className = ICON_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`metric-icon-svg ${className}`} aria-hidden>
      <path
        d="M8 2.2 L9.1 5.8 L12.8 5.8 L9.85 7.9 L10.9 11.5 L8 9.5 L5.1 11.5 L6.15 7.9 L3.2 5.8 L6.9 5.8 Z"
        fill="currentColor"
        className="metric-icon-star"
      />
    </svg>
  );
}

export function NextMetricIcon({ className = ICON_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`metric-icon-svg ${className}`} aria-hidden>
      <path
        d="M3.5 8 H11.5 M9 5.5 L12 8 L9 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="metric-icon-arrow"
      />
    </svg>
  );
}

export function CycleMetricIcon({ className = ICON_SIZE }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`metric-icon-svg ${className}`} aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeDasharray="11 6"
        className="metric-icon-cycle"
      />
      <circle cx="8" cy="8" r="1.35" fill="currentColor" />
    </svg>
  );
}

export const METRIC_ICONS = {
  interval: IntervalMetricIcon,
  alert: CountdownMetricIcon,
  next: NextMetricIcon,
  cycle: CycleMetricIcon,
} as const;

export const METRIC_BADGE_SHAPES: Record<keyof typeof METRIC_ICONS, string> = {
  interval: "metrics-badge-shape-square",
  alert: "metrics-badge-shape-circle",
  next: "metrics-badge-shape-pill",
  cycle: "metrics-badge-shape-diamond",
};

export const METRIC_BADGE_TONES: Record<keyof typeof METRIC_ICONS, string> = {
  interval: "metrics-badge-blue",
  alert: "metrics-badge-violet",
  next: "metrics-badge-emerald",
  cycle: "metrics-badge-amber",
};
