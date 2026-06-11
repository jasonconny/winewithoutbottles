import { readFileSync } from 'node:fs';
import { buildStripes } from '@/wwob';
import type { Rgb } from '@/wwob';
import { shows } from '@/data/shows.generated';

/** Parse a legacy SVG's <rect> sequence into (rgb, width) pairs. */
function legacyStripes(id: string) {
  const svg = readFileSync(`tests/fixtures/legacy/${id}.svg`, 'utf8');
  return [...svg.matchAll(/<rect[^>]*>/g)].map((m) => {
    const rgb = m[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const width = m[0].match(/width="(\d+)"/);
    if (!rgb || !width) throw new Error(`unparseable rect in ${id}: ${m[0]}`);
    return {
      rgb: { r: +rgb[1], g: +rgb[2], b: +rgb[3] } as Rgb,
      width: +width[1],
    };
  });
}

// Each show's legacy SVG is the oracle: regenerating it from the committed data
// must match stripe-for-stripe (color from title, width from duration). This is
// a permanent guard that the reconstructed setlists reproduce the original art —
// and that titles stay in the exact canonical form that yields those colors.
describe('fidelity: regenerated pieces match their legacy originals', () => {
  it.each(shows.map((s) => s.id))('%s reproduces its legacy SVG', (id) => {
    const show = shows.find((s) => s.id === id)!;
    const got = buildStripes(show.songs).map((s) => ({
      rgb: s.rgb,
      width: s.width,
    }));
    expect(got).toEqual(legacyStripes(id));
  });
});
