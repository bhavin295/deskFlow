const HISTORY_KEY = "deskflow-session-history";
const MAX_EVENTS = 500;

export type SessionEventType =
  | "cycle_complete"
  | "sync_ok"
  | "sync_fail"
  | "alert"
  | "screenshot_missed"
  | "keep_alive_nudge";

export type SessionEvent = {
  id: string;
  type: SessionEventType;
  at: string;
  detail?: string;
  meta?: Record<string, string | number | boolean>;
};

export type DailyStats = {
  focusMinutes: number;
  cyclesCompleted: number;
  syncAttempts: number;
  syncSuccesses: number;
  missedScreenshots: number;
  nudges: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadAll(): SessionEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(events: SessionEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function recordSessionEvent(
  type: SessionEventType,
  detail?: string,
  meta?: SessionEvent["meta"],
): void {
  const events = loadAll();
  events.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: new Date().toISOString(),
    detail,
    meta,
  });
  saveAll(events);
}

export function getRecentEvents(limit = 40): SessionEvent[] {
  return loadAll()
    .slice(-limit)
    .reverse();
}

export function getDailyStats(date = todayKey()): DailyStats {
  const events = loadAll().filter((e) => e.at.startsWith(date));
  const stats: DailyStats = {
    focusMinutes: 0,
    cyclesCompleted: 0,
    syncAttempts: 0,
    syncSuccesses: 0,
    missedScreenshots: 0,
    nudges: 0,
  };

  for (const event of events) {
    switch (event.type) {
      case "cycle_complete":
        stats.cyclesCompleted += 1;
        if (typeof event.meta?.minutes === "number") {
          stats.focusMinutes += event.meta.minutes;
        }
        break;
      case "sync_ok":
        stats.syncAttempts += 1;
        stats.syncSuccesses += 1;
        break;
      case "sync_fail":
        stats.syncAttempts += 1;
        break;
      case "screenshot_missed":
        stats.missedScreenshots += 1;
        break;
      case "keep_alive_nudge":
        stats.nudges += 1;
        break;
      default:
        break;
    }
  }

  return stats;
}

export function getSyncSuccessRate(date = todayKey()): number | null {
  const { syncAttempts, syncSuccesses } = getDailyStats(date);
  if (syncAttempts === 0) return null;
  return Math.round((syncSuccesses / syncAttempts) * 100);
}

export function exportSessionReport(format: "json" | "csv"): string {
  const events = loadAll();
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), events }, null, 2);
  }

  const header = "at,type,detail";
  const rows = events.map((e) =>
    [e.at, e.type, (e.detail ?? "").replace(/"/g, '""')]
      .map((v) => `"${v}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadSessionReport(format: "json" | "csv"): void {
  const body = exportSessionReport(format);
  const blob = new Blob([body], {
    type: format === "json" ? "application/json" : "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deskflow-sessions-${todayKey()}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
