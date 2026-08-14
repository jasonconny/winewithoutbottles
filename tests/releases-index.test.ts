import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  byFirstDate,
  COMPLETENESS_BY_HAND,
  CONFIRMED,
  HAND_RESOLVED,
  stripPending,
} from '../generator/hand-readings';

/**
 * The draft no-op invariant, checked without touching the network.
 *
 * `tsx generator/releases.ts --draft` fetches 198 Wikipedia articles, so the
 * literal round trip — draft over an up-to-date index and diff — can't run in a
 * unit suite. What it would prove, though, is narrower than it looks: the parser
 * half is a pure function of the articles, so a draft only fails to reproduce
 * the file where a **human** overrode it. Those overrides all live in
 * `generator/hand-readings.ts`, and checking them against `data/releases.json`
 * catches the same regression offline.
 *
 * The regression being pinned: 27 entries were hand-edited straight into the
 * JSON with nothing in the tool to rederive them, so a `--draft` silently
 * reverted twelve reviewed completeness verdicts, five date splits, and ten
 * notes. Nothing caught it, because the verify pass compared `dates` alone and
 * only in one direction. Each `it` below would have failed on that state.
 */
interface Entry {
  name: string;
  dates: string[];
  bonusDates: string[];
  completeness: 'complete' | 'partial' | 'unknown';
  note: string;
}

const releases: Entry[] = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'releases.json'), 'utf8'),
).releases;
const byName = new Map(releases.map((r) => [r.name, r]));

/** What the builder appends to any reading a human settled. */
const confirmedNote = (body: string, completeness: string) =>
  `${stripPending(body)}; confirmed ${completeness} by hand`;

describe('every hand-confirmed reading is one the builder can rederive', () => {
  const confirmed = releases.filter((r) => CONFIRMED.test(r.note));

  it('finds the hand-confirmed entries at all', () => {
    // Guards the guard: if the marker ever changes shape, every test below
    // would pass vacuously over an empty list.
    expect(confirmed.length).toBeGreaterThan(40);
  });

  it.each(confirmed.map((r) => [r.name, r] as const))(
    '%s is backed by HAND_RESOLVED or COMPLETENESS_BY_HAND',
    (name, entry) => {
      const backed = name in HAND_RESOLVED || name in COMPLETENESS_BY_HAND;
      expect(
        backed,
        `${name} carries a "confirmed … by hand" note but nothing in ` +
          'generator/hand-readings.ts reproduces it, so --draft would revert it. ' +
          'Move the reading into HAND_RESOLVED.',
      ).toBe(true);
      // COMPLETENESS_BY_HAND can only speak for a release that resolved to
      // dates — the builder skips it otherwise — so an entry with none has to
      // be in HAND_RESOLVED.
      if (!entry.dates.length)
        expect(
          name in HAND_RESOLVED,
          `${name} has no dates, which COMPLETENESS_BY_HAND cannot express`,
        ).toBe(true);
    },
  );
});

describe('HAND_RESOLVED agrees with the authored index', () => {
  const entries = Object.entries(HAND_RESOLVED);

  it.each(entries)('%s names a release that exists', (name) => {
    expect(
      byName.has(name),
      `${name} is not in data/releases.json — a renamed or misspelled key is ` +
        'inert, and silently so',
    ).toBe(true);
  });

  it.each(entries)(
    '%s pins values the index actually carries',
    (name, hand) => {
      const entry = byName.get(name);
      if (!entry) return; // reported by the test above
      if (hand.dates) expect(entry.dates, name).toEqual(hand.dates);
      if (hand.bonusDates)
        expect(entry.bonusDates, name).toEqual(hand.bonusDates);
      if (hand.completeness)
        expect(entry.completeness, name).toBe(hand.completeness);
    },
  );

  it.each(entries)('%s reproduces the index note verbatim', (name, hand) => {
    const entry = byName.get(name);
    if (!entry) return;
    expect(
      entry.note,
      `the note in data/releases.json must be what the builder emits for ` +
        `${name}, or a --draft rewrites it`,
    ).toBe(confirmedNote(hand.note, entry.completeness));
  });
});

describe('COMPLETENESS_BY_HAND does not contradict the index', () => {
  // Where the two disagreed, the map held the stale verdict: twelve Dick's
  // Picks volumes had been reviewed song-by-song against the tapes and upgraded
  // to complete while the map still said partial. HAND_RESOLVED now overrides
  // it, so a disagreement is only legal when that override exists.
  it.each(Object.entries(COMPLETENESS_BY_HAND))('%s', (name, settled) => {
    const entry = byName.get(name);
    if (!entry?.dates.length) return;
    if (entry.completeness === settled) return;
    expect(
      HAND_RESOLVED[name]?.completeness,
      `COMPLETENESS_BY_HAND says ${name} is ${settled} but the index says ` +
        `${entry.completeness}, and no HAND_RESOLVED entry explains the ` +
        'override',
    ).toBe(entry.completeness);
  });
});

describe('the index is written in the order the builder writes it', () => {
  it('is sorted by first date, ties broken by name', () => {
    // Not cosmetic: the sort has to be a *total* order, or a `--draft --only`
    // reshuffles every tie and buries its one-release change in hundreds of
    // lines of churn.
    const sorted = [...releases].sort(byFirstDate);
    expect(releases.map((r) => r.name)).toEqual(sorted.map((r) => r.name));
  });
});
