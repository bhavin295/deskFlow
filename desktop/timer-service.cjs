const path = require("node:path");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");

const timerConfig = require(path.join(__dirname, "..", "config", "timer.json"));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

class TimerService extends EventEmitter {
  #persistPath = null;
  #state = "stopped";
  #elapsedSeconds = 0;
  #countdown = 0;
  #showOverlay = false;
  #tickInterval = null;
  #countdownInterval = null;
  #countdownTimeout = null;
  #alertTriggeredAt = null;
  #engaged = false;
  #awaitingScreenshot = false;
  #alertIntervalSeconds = timerConfig.ALERT_INTERVAL_MINUTES * 60;
  #countdownStart = timerConfig.COUNTDOWN_START;
  #alertSound = true;
  #alertFlash = true;

  constructor({ persistPath } = {}) {
    super();
    this.#persistPath = persistPath ?? null;
    this.#loadPersisted();
  }

  #loadPersisted() {
    if (!this.#persistPath) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.#persistPath, "utf8"));
      if (!raw?.engaged) return;
      this.#engaged = true;
      this.#elapsedSeconds = Number(raw.elapsedSeconds) || 0;
      this.#awaitingScreenshot = Boolean(raw.awaitingScreenshot);
      if (raw.awaitingScreenshot) {
        this.#state = "stopped";
      } else if (raw.state === "running") {
        this.#state = "running";
        this.#startTick();
      }
      console.log(
        `[DeskFlow] restored timer session (elapsed ${this.#elapsedSeconds}s, awaiting=${this.#awaitingScreenshot})`,
      );
    } catch {
      /* no saved session */
    }
  }

  #persist() {
    if (!this.#persistPath) return;
    try {
      if (!this.#engaged) {
        if (fs.existsSync(this.#persistPath)) fs.unlinkSync(this.#persistPath);
        return;
      }
      fs.writeFileSync(
        this.#persistPath,
        JSON.stringify(
          {
            engaged: this.#engaged,
            state: this.#state,
            elapsedSeconds: this.#elapsedSeconds,
            awaitingScreenshot: this.#awaitingScreenshot,
            savedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    } catch (err) {
      console.warn("[DeskFlow] timer persist failed:", err.message);
    }
  }

  getState() {
    return {
      state: this.#state,
      elapsedSeconds: this.#elapsedSeconds,
      countdown: this.#countdown,
      showOverlay: this.#showOverlay,
      nextAlertSeconds: this.#getNextAlertSeconds(),
      awaitingScreenshot: this.#awaitingScreenshot,
      engaged: this.#engaged,
      countdownStart: this.#countdownStart,
      alertIntervalSeconds: this.#alertIntervalSeconds,
      alertIntervalMinutes: Math.round(this.#alertIntervalSeconds / 60),
      alertSound: this.#alertSound,
      alertFlash: this.#alertFlash,
    };
  }

  getConfig() {
    return {
      alertIntervalMinutes: Math.round(this.#alertIntervalSeconds / 60),
      countdownStart: this.#countdownStart,
      alertSound: this.#alertSound,
      alertFlash: this.#alertFlash,
    };
  }

  setConfig({ alertIntervalMinutes, countdownStart, alertSound, alertFlash }) {
    if (alertIntervalMinutes !== undefined) {
      this.#alertIntervalSeconds = clamp(Number(alertIntervalMinutes), 5, 30) * 60;
    }
    if (countdownStart !== undefined) {
      this.#countdownStart = clamp(Number(countdownStart), 1, 10);
      if (this.#countdown > this.#countdownStart) {
        this.#countdown = this.#countdownStart;
      }
    }
    if (alertSound !== undefined) {
      this.#alertSound = Boolean(alertSound);
    }
    if (alertFlash !== undefined) {
      this.#alertFlash = Boolean(alertFlash);
    }
    this.#emitState();
    return this.getConfig();
  }

  #getNextAlertSeconds() {
    if (this.#awaitingScreenshot) return this.#alertIntervalSeconds;
    const remainder = this.#elapsedSeconds % this.#alertIntervalSeconds;
    if (remainder === 0 && this.#elapsedSeconds > 0) return this.#alertIntervalSeconds;
    return this.#alertIntervalSeconds - remainder;
  }

  #emitState() {
    this.#persist();
    this.emit("state", this.getState());
  }

  #clearTick() {
    if (this.#tickInterval) {
      clearInterval(this.#tickInterval);
      this.#tickInterval = null;
    }
  }

  #clearCountdown() {
    if (this.#countdownInterval) {
      clearInterval(this.#countdownInterval);
      this.#countdownInterval = null;
    }
    if (this.#countdownTimeout) {
      clearTimeout(this.#countdownTimeout);
      this.#countdownTimeout = null;
    }
  }

  #startTick() {
    this.#clearTick();
    this.#tickInterval = setInterval(() => {
      if (this.#state !== "running") return;

      this.#elapsedSeconds += 1;

      if (
        this.#elapsedSeconds > 0 &&
        this.#elapsedSeconds % this.#alertIntervalSeconds === 0 &&
        this.#alertTriggeredAt !== this.#elapsedSeconds
      ) {
        this.#alertTriggeredAt = this.#elapsedSeconds;
        this.#triggerAlert();
        return;
      }

      this.#emitState();
    }, 1000);
  }

  #triggerAlert() {
    this.#state = "alert";
    this.#countdown = this.#countdownStart;
    this.#showOverlay = true;
    this.#clearTick();
    this.#emitState();
    this.#startCountdown();
  }

  /** After countdown — reset and wait for DeskQ screenshot */
  #finishCountdown() {
    this.#showOverlay = false;
    this.#countdown = 0;
    this.#state = "stopped";
    this.#elapsedSeconds = 0;
    this.#alertTriggeredAt = null;
    this.#awaitingScreenshot = this.#engaged;
    this.#clearCountdown();
    this.#clearTick();
    this.#emitState();
  }

  #startCountdown() {
    this.#clearCountdown();
    const totalSeconds = this.#countdown;
    const startedAt = Date.now();

    const getDisplayed = (elapsed) => {
      const remainingMs = totalSeconds * 1000 - elapsed;
      if (remainingMs <= 0) return 0;
      return Math.ceil(remainingMs / 1000);
    };

    const schedule = () => {
      const elapsed = Date.now() - startedAt;
      const displayed = getDisplayed(elapsed);

      if (displayed <= 0) {
        this.#finishCountdown();
        return;
      }

      if (displayed !== this.#countdown) {
        this.#countdown = displayed;
        this.#emitState();
      }

      const elapsedMod = elapsed % 1000;
      const delay = elapsedMod === 0 ? 1000 : 1000 - elapsedMod;
      this.#countdownTimeout = setTimeout(schedule, delay);
    };

    this.#emitState();
    this.#countdownTimeout = setTimeout(schedule, 1000);
  }

  start() {
    if (this.#state === "running" || this.#state === "alert") return;
    this.#engaged = true;
    this.#awaitingScreenshot = false;
    this.#state = "running";
    this.#emitState();
    this.#startTick();
  }

  stop() {
    this.#engaged = false;
    this.#awaitingScreenshot = false;
    this.#state = "stopped";
    this.#showOverlay = false;
    this.#countdown = 0;
    this.#clearTick();
    this.#clearCountdown();
    this.#emitState();
  }

  reset() {
    this.#engaged = false;
    this.#awaitingScreenshot = false;
    this.#state = "stopped";
    this.#elapsedSeconds = 0;
    this.#countdown = 0;
    this.#showOverlay = false;
    this.#alertTriggeredAt = null;
    this.#clearTick();
    this.#clearCountdown();
    this.#emitState();
  }

  /** Dev/test — trigger the countdown immediately */
  testAlert() {
    if (!this.#engaged) this.#engaged = true;
    if (this.#state === "stopped") {
      this.#state = "running";
      this.#elapsedSeconds = this.#alertIntervalSeconds;
    }
    this.#awaitingScreenshot = false;
    this.#alertTriggeredAt = this.#elapsedSeconds;
    this.#triggerAlert();
  }

  /** DeskQ screenshot — start a fresh cycle */
  restartAfterScreenshot() {
    if (!this.#engaged) return;
    this.#clearTick();
    this.#clearCountdown();
    this.#awaitingScreenshot = false;
    this.#showOverlay = false;
    this.#countdown = 0;
    this.#alertTriggeredAt = null;
    this.#elapsedSeconds = 0;
    this.#state = "running";
    this.#emitState();
    this.#startTick();
  }

  /** DeskQ timer started — align session with DeskQ (fresh cycle from 0) */
  onDesqTimerStart() {
    if (this.#state === "alert") return;
    if (this.#state === "running") return;
    this.#engaged = true;
    this.#awaitingScreenshot = false;
    this.#elapsedSeconds = 0;
    this.#countdown = 0;
    this.#showOverlay = false;
    this.#alertTriggeredAt = null;
    this.#clearCountdown();
    this.#state = "running";
    this.#emitState();
    this.#startTick();
  }

  /** DeskQ timer stopped — end and reset session completely */
  onDesqTimerStop() {
    this.reset();
  }

  destroy() {
    this.#clearTick();
    this.#clearCountdown();
  }
}

module.exports = {
  TimerService,
  ALERT_INTERVAL: timerConfig.ALERT_INTERVAL_MINUTES * 60,
  COUNTDOWN_START: timerConfig.COUNTDOWN_START,
};
