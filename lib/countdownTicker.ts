/**
 * Wall-clock countdown — each displayed second lasts ~1 full second.
 * Uses elapsed time from start rather than endAt % 1000 (which skips numbers).
 */

export type CountdownSession = {
  cancel: () => void;
};

export function startCountdownSession(
  totalSeconds: number,
  onTick: (remaining: number) => void,
  onComplete: () => void,
): CountdownSession {
  if (totalSeconds <= 0) {
    onTick(0);
    onComplete();
    return { cancel: () => {} };
  }

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const startedAt = Date.now();

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const getDisplayed = (elapsed: number) => {
    const remainingMs = totalSeconds * 1000 - elapsed;
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / 1000);
  };

  const schedule = () => {
    if (cancelled) return;

    const elapsed = Date.now() - startedAt;
    const displayed = getDisplayed(elapsed);

    if (displayed <= 0) {
      onTick(0);
      onComplete();
      return;
    }

    onTick(displayed);

    const elapsedMod = elapsed % 1000;
    const delay = elapsedMod === 0 ? 1000 : 1000 - elapsedMod;
    timer = setTimeout(schedule, delay);
  };

  onTick(totalSeconds);
  timer = setTimeout(schedule, 1000);

  return {
    cancel: () => {
      cancelled = true;
      clear();
    },
  };
}
