const DURATION_RE = /^\d+:[0-5]\d$/;

/** True when `value` is a valid `m:ss` / `mm:ss` duration (seconds 00–59). */
export function isValidDuration(value: string): boolean {
  return DURATION_RE.test(value.trim());
}

/** Parse a `m:ss` duration into total seconds. Assumes a valid string. */
export function parseDuration(value: string): number {
  const [minutes, seconds] = value.trim().split(':');
  return Number(minutes) * 60 + Number(seconds);
}

/**
 * Convert a duration (in seconds) to stripe width in pixels: 100px per minute.
 * Mathematically identical to the original `minutes*100 + round(seconds/60*100)`.
 */
export function durationToWidth(durationSeconds: number): number {
  return Math.round((durationSeconds / 60) * 100);
}
