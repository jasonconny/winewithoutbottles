import { buildStripes, svgMarkup, totalWidth } from '@/wwob';
import type { Song } from '@/wwob';

const songs: Song[] = [
  { title: 'A', durationSeconds: 60 }, // width 100
  { title: 'B', durationSeconds: 120 }, // width 200
];

describe('buildStripes', () => {
  it('assigns width, colour, and cumulative x', () => {
    const stripes = buildStripes(songs);
    expect(stripes).toEqual([
      { title: 'A', rgb: { r: 0, g: 10, b: 0 }, width: 100, x: 0 },
      { title: 'B', rgb: { r: 0, g: 20, b: 0 }, width: 200, x: 100 },
    ]);
  });

  it('sums to the total width', () => {
    expect(totalWidth(buildStripes(songs))).toBe(300);
  });
});

describe('svgMarkup', () => {
  it('emits a standalone SVG sized to the stripes', () => {
    const svg = svgMarkup(buildStripes(songs), 100);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('viewBox="0 0 300 100"');
    // Extreme aspect ratios must fill, not letterbox, their container; see
    // svgMarkup.
    expect(svg).toContain('preserveAspectRatio="none"');
    expect(svg).toContain(
      '<rect x="0" y="0" width="100" height="100" fill="rgb(0,10,0)"/>',
    );
    expect(svg).toContain(
      '<rect x="100" y="0" width="200" height="100" fill="rgb(0,20,0)"/>',
    );
  });
});
