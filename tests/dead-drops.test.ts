import { describe, expect, it } from 'vitest';
import { parseShowId } from '@/wwob';
import { shows } from '@/data/shows.generated';
import { DEAD_DROP_PREFIX, deadDrops } from '../generator/dead-drops';

/**
 * `data/dead-drops.json` is the one index in this project with **nothing behind
 * it**. `data/releases.json` is verified against Wikipedia and `data/shows/` is
 * checked against the release that timed it, but a drop exists only inside an
 * app: no article, no track listing, no API, no second copy to disagree with.
 *
 * So these guards can only check the file's shape and its agreement with the
 * corpus. They cannot check that a drop is real, that its transfer is described
 * correctly, or that the show data transcribed from it is right — the
 * verification for that is the seam overlap and Jason's spot-check, and it
 * happens before the data lands, not here. Worth stating plainly, because a
 * green suite here is a much weaker claim than a green suite on a release.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('the DeadDrops index is well-formed', () => {
  it('has entries', () => {
    expect(deadDrops.length).toBeGreaterThan(0);
  });

  it.each(deadDrops.map((drop) => [drop.date, drop] as const))(
    '%s is complete',
    (date, drop) => {
      expect(date, 'date must be ISO').toMatch(ISO_DATE);
      expect(drop.capturedOn, 'capturedOn must be ISO').toMatch(ISO_DATE);
      // Not cosmetic: the venue line is the app's own spelling, kept so a later
      // reader can see why the corpus spells the room differently (the app says
      // "Berkeley Community Theater", the corpus "Theatre"). An empty one would
      // silently lose that.
      expect(
        drop.venue.trim().length,
        'venue must be non-empty',
      ).toBeGreaterThan(0);
      // The nearest thing a drop has to a tape identifier. Without it, a
      // re-transfer would be invisible.
      expect(
        drop.transfer.trim().length,
        'transfer must be non-empty',
      ).toBeGreaterThan(0);
      expect(drop.note.trim().length, 'note must be non-empty').toBeGreaterThan(
        0,
      );
    },
  );

  it('claims each date once', () => {
    const dates = deadDrops.map((drop) => drop.date);
    expect(new Set(dates).size, 'a date is claimed twice').toBe(dates.length);
  });

  it('is sorted by date', () => {
    // Same convention as data/releases.json, and it keeps a growing weekly file
    // readable — appending a drop should be a one-line diff in one place.
    const dates = deadDrops.map((drop) => drop.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('every drop has a show built from it', () => {
    // The reverse direction of the `source` guard in data-validity. That one
    // stops a show pointing at a drop that isn't here; this stops a drop being
    // recorded and then never turned into art, which is the failure that leaves
    // no trace anywhere else — the screenshots are gitignored, so an untranscribed
    // drop is invisible the moment the working copy is gone.
    const sourced = new Map(
      shows.map((show) => [parseShowId(show.id)?.date, show.id]),
    );
    for (const drop of deadDrops) {
      expect(
        sourced.has(drop.date),
        `${drop.date} is in data/dead-drops.json but no show carries that date`,
      ).toBe(true);
    }
  });

  it('exports the prefix the source field uses', () => {
    // Pinned because it is duplicated in prose in two skills and CLAUDE.md, and
    // a rename here would silently orphan every existing `source`.
    expect(DEAD_DROP_PREFIX).toBe('dead-drop:');
  });
});
