"use client";

import { useAppSettings } from "@/context/AppSettingsContext";
import { getTeamPolicy, intervalMatchesPolicy } from "@/lib/teamConfig";

export default function IntervalMismatchBanner() {
  const { settings } = useAppSettings();
  const policy = getTeamPolicy();

  if (policy.source === "default") return null;
  if (intervalMatchesPolicy(settings.alertIntervalMinutes)) return null;

  return (
    <div className="interval-mismatch-banner" role="status">
      Interval is {settings.alertIntervalMinutes} min — office policy is {policy.alertIntervalMinutes} min (
      {policy.label})
    </div>
  );
}
