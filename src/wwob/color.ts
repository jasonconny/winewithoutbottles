import type { Rgb } from './types';

/**
 * Per-character value used to build a colour channel.
 * `_` (a space, after cleaning) → 0; A→10, B→20, … Y→250; Z is capped at 255.
 * Ported verbatim from the original WWOB builder.
 */
function charValue(ch: string): number {
  if (ch === '_') return 0;
  if (ch === 'Z') return 255;
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 89) return (code - 64) * 10; // A–Y
  return 0;
}

/** Average a slice's character values into a single 0–255 channel. Empty slice → 0. */
function channelValue(slice: string): number {
  if (slice.length === 0) return 0;
  let sum = 0;
  for (const ch of slice) sum += charValue(ch);
  return Math.round(sum / slice.length);
}

/** Normalise a song title to the cleaned form the colour algorithm operates on. */
export function cleanTitle(title: string): string {
  return title
    .toUpperCase()
    .replace(/ /g, '_')
    .replace(/[^A-Z_]/g, '');
}

/**
 * Derive an RGB colour from a song title.
 *
 * The cleaned title is cut into three contiguous slices (red, green, blue);
 * the remainder char goes to the middle slice (len % 3 === 1) or the two outer
 * slices (len % 3 === 2). Each channel is the rounded mean of its slice's
 * character values. Ported verbatim from the original WWOB builder.
 */
export function titleToRgb(title: string): Rgb {
  const s = cleanTitle(title);
  const k = Math.floor(s.length / 3);
  const remainder = s.length % 3;

  let red: string;
  let green: string;
  let blue: string;

  if (remainder === 1) {
    red = s.slice(0, k);
    green = s.slice(k, k * 2 + 1);
    blue = s.slice(k * 2 + 1, k * 3 + 1);
  } else if (remainder === 2) {
    red = s.slice(0, k + 1);
    green = s.slice(k + 1, k * 2 + 1);
    blue = s.slice(k * 2 + 1, k * 3 + 2);
  } else {
    red = s.slice(0, k);
    green = s.slice(k, k * 2);
    blue = s.slice(k * 2, k * 3);
  }

  return {
    r: channelValue(red),
    g: channelValue(green),
    b: channelValue(blue),
  };
}
