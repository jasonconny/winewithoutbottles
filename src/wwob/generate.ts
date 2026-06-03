import { titleToRgb } from './color';
import { durationToWidth } from './duration';
import type { Song, Stripe } from './types';

/** Build positioned stripes (colour + width + cumulative x) from a song list. */
export function buildStripes(songs: Song[]): Stripe[] {
  let x = 0;
  return songs.map((song) => {
    const width = durationToWidth(song.durationSeconds);
    const stripe: Stripe = {
      title: song.title,
      rgb: titleToRgb(song.title),
      width,
      x,
    };
    x += width;
    return stripe;
  });
}

/** Total width of a set of stripes. */
export function totalWidth(stripes: Stripe[]): number {
  return stripes.reduce((sum, stripe) => sum + stripe.width, 0);
}

/**
 * Serialize stripes to a standalone, export-grade SVG string.
 * `height` is uniform across stripes — the piece's variable overall height.
 */
export function svgMarkup(stripes: Stripe[], height: number): string {
  const width = totalWidth(stripes);
  const rects = stripes
    .map(
      (s) =>
        `<rect x="${s.x}" y="0" width="${s.width}" height="${height}" fill="rgb(${s.rgb.r},${s.rgb.g},${s.rgb.b})"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
}
