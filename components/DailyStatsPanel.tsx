"use client";

import { getDailyStats, getSyncSuccessRate } from "@/lib/sessionHistory";

export default function DailyStatsPanel() {
  const stats = getDailyStats();
  const syncRate = getSyncSuccessRate();

  return (
    <div className="daily-stats-panel">
      <p className="daily-stats-title">Today</p>
      <div className="daily-stats-grid">
        <div className="daily-stats-cell">
          <span className="daily-stats-value">{stats.cyclesCompleted}</span>
          <span className="daily-stats-label">Cycles</span>
        </div>
        <div className="daily-stats-cell">
          <span className="daily-stats-value">{stats.focusMinutes}m</span>
          <span className="daily-stats-label">Focus</span>
        </div>
        <div className="daily-stats-cell">
          <span className="daily-stats-value">
            {syncRate == null ? "—" : `${syncRate}%`}
          </span>
          <span className="daily-stats-label">Sync OK</span>
        </div>
        <div className="daily-stats-cell">
          <span className="daily-stats-value">{stats.missedScreenshots}</span>
          <span className="daily-stats-label">Missed</span>
        </div>
      </div>
    </div>
  );
}
