"use client";

type CountdownStageProps = {
  countdown: number;
  compact?: boolean;
};

export default function CountdownStage({ countdown, compact = false }: CountdownStageProps) {
  return (
    <p
      key={countdown}
      className={`countdown-number ${compact ? "countdown-number-compact" : ""}`}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={`${countdown}`}
    >
      {countdown}
    </p>
  );
}
