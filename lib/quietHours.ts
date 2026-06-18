import type { AppSettings } from "@/lib/appSettings";

export function isQuietHours(settings: AppSettings, date = new Date()): boolean {
  if (!settings.quietHoursEnabled) return false;
  const hour = date.getHours();
  const { quietHoursStart: start, quietHoursEnd: end } = settings;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}
