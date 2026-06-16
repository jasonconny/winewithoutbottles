import { readFileSync } from 'node:fs';
import { shows } from '@/data/shows.generated';
import type { ShowDetail } from '@/wwob';

it('the bundled index carries the 8/27/72 summary (no songs)', () => {
  const show = shows.find((s) => s.id === '1972-08-27');
  expect(show).toBeDefined();
  expect(show?.songCount).toBe(20);
  expect(show?.svg).toBe('/shows/1972-08-27.svg');
  expect(show?.collection).toBe('Sunshine Daydream');
  // The index is intentionally songs-free to keep the bundle small.
  expect('songs' in (show ?? {})).toBe(false);
});

it('the per-show detail JSON carries the full 8/27/72 setlist', () => {
  const detail = JSON.parse(
    readFileSync('public/shows/1972-08-27.json', 'utf8'),
  ) as ShowDetail;
  expect(detail.songCount).toBe(20);
  expect(detail.songs).toHaveLength(20);
  expect(detail.svg).toBe('/shows/1972-08-27.svg');
  // Stripe 15 (index 14) is the 31-minute Dark Star.
  expect(detail.songs[14].title).toBe('Dark Star');
});
