import { readFileSync } from 'node:fs';
import { buildStripes, parseDuration } from '@/wwob';
import type { ShowFile, Song } from '@/wwob';

/** Parse an SVG's <rect> sequence into (rgb, width) pairs, attribute-order agnostic. */
function rectsOf(svg: string) {
  return [...svg.matchAll(/<rect[^>]*>/g)].map((m) => {
    const rgb = m[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const width = m[0].match(/width="(\d+)"/);
    if (!rgb || !width) throw new Error(`unparseable rect: ${m[0]}`);
    return {
      rgb: { r: +rgb[1], g: +rgb[2], b: +rgb[3] },
      width: +width[1],
    };
  });
}

// The legacy SVG is the oracle: regenerating 8/27/72 from its data must match it
// stripe-for-stripe (color from title, width from duration). This also validates
// that the reconstructed song titles are in their correct canonical form.
it('regenerates the legacy 8/27/72 piece exactly (color + width)', () => {
  const legacy = rectsOf(readFileSync('public/images/19720827.svg', 'utf8'));
  const file = JSON.parse(
    readFileSync('data/shows/1972-08-27.json', 'utf8'),
  ) as ShowFile;
  const songs: Song[] = file.songs.map((s) => ({
    title: s.title,
    durationSeconds: parseDuration(s.duration),
  }));

  const got = buildStripes(songs).map((s) => ({ rgb: s.rgb, width: s.width }));

  expect(got).toHaveLength(legacy.length);
  expect(got).toEqual(legacy);
});
