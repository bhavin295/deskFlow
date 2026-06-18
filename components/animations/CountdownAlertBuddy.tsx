"use client";

import { AlarmBellCharacter } from "@/components/animations/CartoonCharacters";

export default function CountdownAlertBuddy({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`countdown-alert-buddy ${compact ? "countdown-alert-buddy-compact" : ""}`} aria-hidden>
      <AlarmBellCharacter size={compact ? 48 : 64} />
      <span className="countdown-alert-spark countdown-alert-spark-1" />
      <span className="countdown-alert-spark countdown-alert-spark-2" />
      <span className="countdown-alert-spark countdown-alert-spark-3" />
    </div>
  );
}
