import { shows } from '@/data/shows.generated';

it('manifest carries the 8/27/72 show with its full setlist', () => {
  const show = shows.find((s) => s.id === '1972-08-27');
  expect(show).toBeDefined();
  expect(show?.songCount).toBe(20);
  expect(show?.songs).toHaveLength(20);
  expect(show?.svg).toBe('/shows/1972-08-27.svg');
  expect(show?.collection).toBe('Sunshine Daydream');
  // Stripe 15 (index 14) is the 31-minute Dark Star.
  expect(show?.songs[14].title).toBe('Dark Star');
});
