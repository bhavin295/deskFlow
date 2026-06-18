const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { EventEmitter } = require("node:events");

const DESKQ_USERS_DIR = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "deskq-agent",
  "users",
);

const ACTIVE_TICK_MS = 45_000;
const POLL_MS = 2_000;

function sqliteBinary() {
  if (process.platform === "darwin" && fs.existsSync("/usr/bin/sqlite3")) {
    return "/usr/bin/sqlite3";
  }
  return "sqlite3";
}

function sqlJson(dbPath, sql) {
  if (!dbPath || !fs.existsSync(dbPath)) return [];
  try {
    const out = execFileSync(sqliteBinary(), ["-json", dbPath, sql], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    if (!out) return [];
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function discoverAgentPaths() {
  const explicitDb = process.env.DESQ_AGENT_DB_PATH;
  if (explicitDb && fs.existsSync(explicitDb)) {
    return {
      dbPath: path.resolve(explicitDb),
      userDir: path.dirname(explicitDb),
      screenshotsDir: path.join(path.dirname(explicitDb), "screenshots"),
    };
  }

  if (!fs.existsSync(DESKQ_USERS_DIR)) return null;

  for (const entry of fs.readdirSync(DESKQ_USERS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const userDir = path.join(DESKQ_USERS_DIR, entry.name);
    const dbPath = path.join(userDir, "queue.db");
    if (fs.existsSync(dbPath)) {
      return {
        dbPath,
        userDir,
        screenshotsDir: path.join(userDir, "screenshots"),
      };
    }
  }

  return null;
}

function isTrackingActive(dbPath) {
  const rows = sqlJson(
    dbPath,
    "SELECT last_tick_ms FROM heartbeat_draft ORDER BY last_tick_ms DESC LIMIT 1",
  );
  if (!rows.length) return false;
  const lastTick = Number(rows[0].last_tick_ms);
  if (!Number.isFinite(lastTick)) return false;
  return Date.now() - lastTick < ACTIVE_TICK_MS;
}

class DeskqAgentWatcher extends EventEmitter {
  #paths = null;
  #running = false;
  #pollTimer = null;
  #screenshotWatcher = null;
  #wasTrackingActive = false;
  #lastScreenshotAt = 0;
  #lastStopAt = 0;
  #bootstrapped = false;

  get status() {
    return {
      running: this.#running,
      mode: "agent",
      logPath: null,
      agentDbPath: this.#paths?.dbPath ?? null,
      agentUserDir: this.#paths?.userDir ?? null,
      deskqTrackingActive: this.#wasTrackingActive,
      lastScreenshotAt:
        this.#lastScreenshotAt > 0 ? new Date(this.#lastScreenshotAt).toISOString() : null,
      patterns: ["deskq-agent:heartbeat", "deskq-agent:screenshot", "deskq-agent:stop"],
    };
  }

  start() {
    if (this.#running) return;

    this.#paths = discoverAgentPaths();
    if (!this.#paths) {
      this.emit("warn", "DeskQ Agent data not found — install DeskQ Agent or set DESQ_AGENT_DB_PATH");
      return;
    }

    this.#bootstrapCursors();
    this.#wasTrackingActive = isTrackingActive(this.#paths.dbPath);
    this.#bootstrapped = true;

    this.#running = true;
    this.#watchScreenshots();
    this.#pollTimer = setInterval(() => this.#poll(), POLL_MS);
    this.#poll();

    this.emit("started", {
      logPath: this.#paths.dbPath,
      deskqTrackingActive: this.#wasTrackingActive,
    });

    if (this.#wasTrackingActive) {
      this.#emitNotification("DeskQ timer started", "timer-started");
    }
  }

  stop() {
    this.#running = false;
    if (this.#pollTimer) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
    if (this.#screenshotWatcher) {
      this.#screenshotWatcher.close();
      this.#screenshotWatcher = null;
    }
    this.emit("stopped");
  }

  #bootstrapCursors() {
    const { dbPath } = this.#paths;

    const shots = sqlJson(
      dbPath,
      "SELECT captured_at FROM screenshots_queue ORDER BY captured_at DESC LIMIT 1",
    );
    if (shots.length) {
      this.#lastScreenshotAt = Number(shots[0].captured_at) || 0;
    }

    const stops = sqlJson(
      dbPath,
      "SELECT stopped_at FROM tracking_stop_events ORDER BY stopped_at DESC LIMIT 1",
    );
    if (stops.length) {
      this.#lastStopAt = Number(stops[0].stopped_at) || 0;
    }
  }

  #watchScreenshots() {
    const { screenshotsDir } = this.#paths;
    if (!fs.existsSync(screenshotsDir)) {
      try {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      } catch {
        return;
      }
    }

    try {
      this.#screenshotWatcher = fs.watch(screenshotsDir, (_event, filename) => {
        if (!filename || !String(filename).endsWith(".jpg")) return;
        this.#emitNotification("DeskQ screenshot captured", "screenshot");
      });
    } catch {
      // polling covers screenshots_queue anyway
    }
  }

  #poll() {
    if (!this.#paths) return;
    const { dbPath } = this.#paths;

    const trackingActive = isTrackingActive(dbPath);

    if (this.#bootstrapped) {
      if (trackingActive && !this.#wasTrackingActive) {
        this.#emitNotification("DeskQ timer started", "timer-started");
      } else if (!trackingActive && this.#wasTrackingActive) {
        this.#emitNotification("DeskQ timer stopped", "timer-stopped");
      }
    }

    this.#wasTrackingActive = trackingActive;
    this.#bootstrapped = true;

    const shots = sqlJson(
      dbPath,
      "SELECT captured_at FROM screenshots_queue ORDER BY captured_at DESC LIMIT 1",
    );
    if (shots.length) {
      const capturedAt = Number(shots[0].captured_at) || 0;
      if (capturedAt > this.#lastScreenshotAt) {
        this.#lastScreenshotAt = capturedAt;
        this.#emitNotification("DeskQ screenshot has been taken", "screenshot");
      }
    }

    const stops = sqlJson(
      dbPath,
      "SELECT stopped_at, reason FROM tracking_stop_events ORDER BY stopped_at DESC LIMIT 1",
    );
    if (stops.length) {
      const stoppedAt = Number(stops[0].stopped_at) || 0;
      if (stoppedAt > this.#lastStopAt) {
        this.#lastStopAt = stoppedAt;
        const reason = stops[0].reason ? ` (${stops[0].reason})` : "";
        this.#emitNotification(`DeskQ timer stopped${reason}`, "timer-stopped");
        this.#wasTrackingActive = false;
      }
    }

    this.emit("status", this.status);
  }

  #emitNotification(line, type) {
    this.emit("notification", {
      line,
      type,
      at: new Date().toISOString(),
      source: "deskq-agent",
    });
  }
}

module.exports = { DeskqAgentWatcher, discoverAgentPaths };
