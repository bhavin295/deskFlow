const fs = require("node:fs");
const path = require("node:path");
const { EventEmitter } = require("node:events");

class DesqWatcher extends EventEmitter {
  #logPath;
  #patterns;
  #watcher = null;
  #offset = 0;
  #polling = null;
  #running = false;

  constructor(options = {}) {
    super();
    this.#logPath = options.logPath ?? process.env.DESQ_LOG_PATH ?? "";
    this.#patterns = options.patterns ?? parsePatterns(process.env.DESQ_MATCH_PATTERNS);
  }

  get status() {
    return {
      running: this.#running,
      mode: "log",
      logPath: this.#logPath || null,
      agentDbPath: null,
      agentUserDir: null,
      deskqTrackingActive: false,
      patterns: this.#patterns.map((p) => p.source),
    };
  }

  start() {
    if (this.#running) return;
    if (!this.#logPath) {
      this.emit("warn", "DESQ_LOG_PATH not set — watcher idle");
      return;
    }

    const resolved = path.resolve(this.#logPath);
    if (fs.existsSync(resolved)) {
      this.#offset = fs.statSync(resolved).size;
      try {
        this.#watcher = fs.watch(resolved, () => this.#readNewLines(resolved));
      } catch {
        // fall back to polling
      }
    } else {
      this.emit("warn", `DESQ log not found: ${resolved} — polling until created`);
    }

    this.#running = true;
    this.emit("started", { logPath: resolved });

    this.#polling = setInterval(() => this.#readNewLines(resolved), 2000);
    this.#readNewLines(resolved);
  }

  stop() {
    this.#running = false;
    if (this.#watcher) {
      this.#watcher.close();
      this.#watcher = null;
    }
    if (this.#polling) {
      clearInterval(this.#polling);
      this.#polling = null;
    }
    this.emit("stopped");
  }

  #readNewLines(filePath) {
    if (!fs.existsSync(filePath)) return;

    const stat = fs.statSync(filePath);
    if (stat.size < this.#offset) this.#offset = 0;
    if (stat.size === this.#offset) return;

    const bytesToRead = stat.size - this.#offset;
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(bytesToRead);
    fs.readSync(fd, buffer, 0, bytesToRead, this.#offset);
    fs.closeSync(fd);
    this.#offset = stat.size;

    for (const line of buffer.toString("utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (this.#patterns.some((p) => p.test(trimmed))) {
        this.emit("notification", { line: trimmed, at: new Date().toISOString() });
      }
    }
  }
}

function parsePatterns(raw) {
  if (raw) return raw.split(",").map((s) => new RegExp(s.trim(), "i"));
  return [
    /screenshot has been taken/i,
    /screenshot/i,
    /desq/i,
  ];
}

module.exports = { DesqWatcher };
