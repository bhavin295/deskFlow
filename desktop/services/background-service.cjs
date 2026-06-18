const { DesqWatcher } = require("./desq-watcher.cjs");
const { DeskqAgentWatcher } = require("./deskq-agent-watcher.cjs");

const SCREENSHOT_PATTERN = /screenshot/i;

const DEFAULT_START_PATTERNS = [
  /timer\s*started/i,
  /session\s*started/i,
  /deskq?\s*(timer\s*)?(started|resumed)/i,
  /start(ed)?\s*(timer|session|recording)/i,
  /recording\s*started/i,
  /break\s*ended/i,
  /resumed\s*(timer|session|work)/i,
];

const DEFAULT_STOP_PATTERNS = [
  /timer\s*stopped/i,
  /session\s*(ended|stopped)/i,
  /deskq?\s*(timer\s*)?(stopped|ended)/i,
  /stop(ped)?\s*(timer|session|recording)/i,
  /recording\s*stopped/i,
  /break\s*started/i,
  /paused\s*(timer|session)/i,
];

const DEFAULT_MATCH_PATTERNS = [
  /screenshot has been taken/i,
  /screenshot/i,
  /desq/i,
  /deskq/i,
];

function parsePatternList(raw, defaults) {
  if (!raw) return [...defaults];
  return raw.split(",").map((s) => new RegExp(s.trim(), "i"));
}

function buildWatcherPatterns(startPatterns, stopPatterns, envMatchRaw) {
  const envPatterns = parsePatternList(envMatchRaw, DEFAULT_MATCH_PATTERNS);
  const seen = new Set();
  const patterns = [];

  for (const pattern of [
    ...envPatterns,
    SCREENSHOT_PATTERN,
    ...stopPatterns,
    ...startPatterns,
  ]) {
    const key = pattern.source;
    if (seen.has(key)) continue;
    seen.add(key);
    patterns.push(pattern);
  }

  return patterns;
}

class BackgroundService {
  #watcher;
  #broadcast;
  #timerService;
  #startPatterns;
  #stopPatterns;

  constructor(broadcast, timerService) {
    this.#broadcast = broadcast;
    this.#timerService = timerService;
    this.#startPatterns = parsePatternList(process.env.DESQ_START_PATTERNS, DEFAULT_START_PATTERNS);
    this.#stopPatterns = parsePatternList(process.env.DESQ_STOP_PATTERNS, DEFAULT_STOP_PATTERNS);

    const watcherPatterns = buildWatcherPatterns(
      this.#startPatterns,
      this.#stopPatterns,
      process.env.DESQ_MATCH_PATTERNS,
    );

    const useLogWatcher = Boolean(process.env.DESQ_LOG_PATH);
    this.#watcher = useLogWatcher
      ? new DesqWatcher({ logPath: process.env.DESQ_LOG_PATH, patterns: watcherPatterns })
      : new DeskqAgentWatcher();

    this.#wireWatcher();
  }

  #handleDeskqNotification(payload) {
    this.#broadcast("tracker:desq-detected", payload);
    const line = payload.line ?? "";

    if (payload.type === "timer-stopped" || this.#stopPatterns.some((p) => p.test(line))) {
      console.log("[DeskFlow] DeskQ stop detected:", line || payload.type);
      this.#timerService.onDesqTimerStop();
      this.#broadcast("tracker:desq-timer-stopped", payload);
      return;
    }

    if (payload.type === "screenshot" || SCREENSHOT_PATTERN.test(line)) {
      console.log("[DeskFlow] DeskQ screenshot detected:", line || payload.type);
      this.#timerService.restartAfterScreenshot();
      this.#broadcast("tracker:screenshot-restart", { source: "deskq-screenshot", ...payload });
      return;
    }

    if (payload.type === "timer-started" || this.#startPatterns.some((p) => p.test(line))) {
      console.log("[DeskFlow] DeskQ start detected:", line || payload.type);
      this.#timerService.onDesqTimerStart();
      this.#broadcast("tracker:desq-timer-started", payload);
    }
  }

  #syncTimerWithDeskq(status) {
    if (status?.mode !== "agent" || !status.running) return;

    const timer = this.#timerService.getState();

    if (status.deskqTrackingActive && timer.state === "stopped" && !timer.awaitingScreenshot) {
      console.log("[DeskFlow] DeskQ tracking active — syncing DeskFlow session");
      this.#timerService.onDesqTimerStart();
      this.#broadcast("tracker:desq-timer-started", {
        line: "DeskQ timer started (sync)",
        source: "deskq-agent",
        type: "timer-started",
        at: new Date().toISOString(),
      });
      return;
    }

    if (
      !status.deskqTrackingActive &&
      timer.engaged &&
      timer.state === "running" &&
      !timer.awaitingScreenshot
    ) {
      console.log("[DeskFlow] DeskQ tracking inactive — stopping DeskFlow session");
      this.#timerService.onDesqTimerStop();
      this.#broadcast("tracker:desq-timer-stopped", {
        line: "DeskQ timer stopped (sync)",
        source: "deskq-agent",
        type: "timer-stopped",
        at: new Date().toISOString(),
      });
    }
  }

  #wireWatcher() {
    this.#watcher.on("notification", (payload) => {
      this.#handleDeskqNotification(payload);
    });

    this.#watcher.on("warn", (message) => {
      this.#broadcast("desq:warn", { message });
    });

    this.#watcher.on("started", (payload) => {
      this.#broadcast("desq:status", { ...this.#watcher.status, ...payload });
    });

    this.#watcher.on("stopped", () => {
      this.#broadcast("desq:status", this.#watcher.status);
    });

    this.#watcher.on("status", (status) => {
      this.#broadcast("desq:status", status);
      this.#syncTimerWithDeskq(status);
    });
  }

  start() {
    this.#watcher.start();
    const status = this.#watcher.status;
    this.#broadcast("desq:status", status);
    this.#syncTimerWithDeskq(status);
  }

  syncDeskq() {
    const status = this.#watcher.status;
    this.#syncTimerWithDeskq(status);
    return { status, timer: this.#timerService.getState() };
  }

  stop() {
    this.#watcher.stop();
  }

  getStatus() {
    return this.#watcher.status;
  }
}

module.exports = { BackgroundService };
