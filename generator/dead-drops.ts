/**
 * The DeadDrops index — shows released only in the PlayDead app.
 *
 * A deliberate sibling of `data/releases.json` rather than more entries inside
 * it, and the reason is mechanical as much as conceptual. `releases.ts --draft`
 * rebuilds that file wholesale from the Wikipedia discography, so an entry with
 * no article behind it is deleted on the next draft; the guard there only
 * *refuses* the draft, it does not preserve. Nothing fetches this file, so
 * nothing can overwrite it. (Same reasoning that makes `data/partial-shows/` a
 * directory rather than a `draft: true` flag.)
 *
 * The app is currently the only place this information exists — there is no
 * article, no track listing, no API — so a drop is transcribed from screenshots
 * by hand. What that costs, and how it is checked, is in the `import-dead-drop`
 * skill.
 *
 * **Keyed on the date**, because the app's show screen carries no drop name to
 * key on: it shows the venue, the date and the transfer, and nothing that
 * identifies the weekly drop it arrived in. A show points here with
 * `source: "dead-drop:<id>"`, mirroring `archive.org:<identifier>` — except that
 * this one resolves against a local file, so `tests/data-validity.test.ts` can
 * check the reference really exists rather than merely being non-empty.
 */
import { readFileSync } from 'node:fs';

/**
 * Resolved against the working directory rather than `import.meta.url`, which
 * is what the other generator modules use. They are only ever run by `tsx` from
 * the repo root; this one is also imported by Vitest, whose transform leaves
 * `import.meta.url` as a non-file URL, and `fileURLToPath` throws on it. Both
 * runners start at the repo root, and `tests/data-validity.test.ts` already
 * reads `data/releases.json` exactly this way.
 */
const INDEX_PATH = 'data/dead-drops.json';

export interface DeadDrop {
  /** ISO date of the show, and the entry's key. */
  date: string;
  /** Venue line **as the app prints it**; see `note` when it disagrees. */
  venue: string;
  /**
   * The provenance the app's A/B panel states — source format, bit depth and
   * sample rate, noise reduction. Recorded because it is the only thing
   * resembling a tape identifier a drop offers, and a later re-transfer would
   * be invisible without it.
   */
  transfer: string;
  /** When the screenshots were taken. The app is live; a drop can be revised. */
  capturedOn: string;
  /** Anything a future reader would otherwise have to re-derive. */
  note: string;
}

export const deadDrops: DeadDrop[] = (
  JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as { drops: DeadDrop[] }
).drops;

/** ISO dates carried by a drop, for resolving a `dead-drop:` source. */
export const deadDropDates: ReadonlySet<string> = new Set(
  deadDrops.map((drop) => drop.date),
);

/** The `source` prefix a show uses to point at this index. */
export const DEAD_DROP_PREFIX = 'dead-drop:';
