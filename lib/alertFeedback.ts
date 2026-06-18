import type { AppSettings } from "@/lib/appSettings";
import { isQuietHours } from "@/lib/quietHours";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

type BeepOptions = {
  settings?: AppSettings;
  force?: boolean;
};

export function shouldPlayAlertSound(settings?: AppSettings): boolean {
  if (!settings?.alertSound) return false;
  if (settings.soundProfile === "silent") return false;
  if (isQuietHours(settings)) return false;
  return true;
}

export function shouldShowAlertFlash(settings?: AppSettings): boolean {
  if (!settings?.alertFlash) return false;
  if (isQuietHours(settings)) return false;
  return true;
}

export function playAlertBeep(countdown: number, options: BeepOptions = {}): void {
  const { settings, force = false } = options;
  if (settings && !force && !shouldPlayAlertSound(settings)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume();

  const profile = settings?.soundProfile ?? "normal";
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = countdown <= 1 ? 880 : 660;

  const volume =
    profile === "soft" ? 0.04 : profile === "normal" ? 0.08 : 0.14;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + (profile === "soft" ? 0.08 : 0.12));
}
