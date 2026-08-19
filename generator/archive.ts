/**
 * archive.org lookup — the setlist skeleton for gap detection.
 *
 * The Grateful Dead collection on archive.org is free to stream and download by
 * the band's own long-standing permission, and its per-item metadata lists
 * every track with a length. That makes it the reference for *what was played*,
 * which an official release can't be: a partial release holds only some of the
 * night, and nothing in its own track listing says what it left out.
 *
 * Diffing a release against the soundboard is what turns "this show is short"
 * into "these six songs are missing" — the gaps Jason fills by hand.
 *
 * Soundboards are preferred over audience and matrix recordings, and among
 * those, Charlie Miller's transfers — newest first, since he re-transfers and
 * the later pass is the better one. `transferer` carries his name verbatim, so
 * that's a real filter rather than a guess at the filename.
 */
import { formatDuration } from '../src/wwob/index.ts';
import { fetchRetry } from './http.ts';

export interface Recording {
  identifier: string;
  source: string;
  transferer: string;
  /** When archive.org took the item in — the tie-break between two Miller copies. */
  added: string;
}

interface SearchDoc {
  identifier: string;
  source?: string | string[];
  transferer?: string | string[];
  addeddate?: string | string[];
}

/**
 * Charlie Miller's transfers.
 *
 * `transferer` carries his name verbatim when it is filled in — but it is not
 * always filled in. `gd78-05-11.sbd.miller.16333.sbeok.shnf` has an **empty**
 * transferer field and names him only in the identifier, so a transferer-only
 * test silently classified one of his soundboards as somebody else's and the
 * Miller preference in `bestRecording` could not see it.
 *
 * The identifier fallback is deliberately narrow: `.miller.` as a dotted segment,
 * which is the etree naming convention. That matches `sbd.miller.16333` and the
 * collaborations (`eaton-miller`, `dalton.miller.clugston`) without matching a
 * band member or a venue that happens to contain the letters.
 */
export const isMiller = (item: Recording): boolean =>
  /charlie miller/i.test(item.transferer) ||
  /[.-]miller[.-]/i.test(item.identifier);

/** archive.org returns some fields as either a string or an array of them. */
const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? '';

/**
 * Every candidate recording for a date, best first. Empty when nothing is
 * catalogued, which for a show the band definitely played usually means the
 * tape isn't circulating.
 *
 * Preference is soundboards, Charlie Miller's transfers first (his own copies
 * newest first), then sorted by identifier rather than left in the order
 * archive.org happened to return.
 * **That order is not stable**: the search sets no sort, so two runs minutes
 * apart can hand back the same two tapes in opposite order, and the pick
 * silently changes with them. That surfaced when a staged skeleton came back
 * with 8 songs where the previous run had 11, and again at 7 where a previous
 * run had 23 — different tape, not different data.
 *
 * This deliberately returns the whole ranked list rather than a single best
 * pick, because **rank is not completeness**: on 1974-08-05 the only Miller
 * item is a one-track `jam-segment` excerpt, which outranks three complete
 * 25-track soundboards. Callers open several and choose on content — see
 * `bestRecording` in `generator/import.ts`. A single-pick helper used to live
 * here and was removed for exactly that reason.
 */
export async function findRecordings(date: string): Promise<Recording[]> {
  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.set(
    'q',
    `collection:GratefulDead AND date:[${date} TO ${date}]`,
  );
  for (const field of ['identifier', 'source', 'transferer', 'addeddate']) {
    url.searchParams.append('fl[]', field);
  }
  url.searchParams.set('rows', '50');
  url.searchParams.set('output', 'json');
  const res = await fetchRetry(url.toString(), { label: 'archive.org search' });
  if (!res.ok) throw new Error(`archive.org search: HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { docs?: SearchDoc[] } };
  return rank(
    (body.response?.docs ?? []).map((doc) => ({
      identifier: doc.identifier,
      source: first(doc.source),
      transferer: first(doc.transferer),
      added: first(doc.addeddate),
    })),
  );
}

function rank(candidates: Recording[]): Recording[] {
  const soundboards = candidates.filter(
    (item) =>
      /sbd|soundboard/i.test(item.source) || /\.sbd\./.test(item.identifier),
  );
  const pool = [...(soundboards.length ? soundboards : candidates)].sort(
    (a, b) => a.identifier.localeCompare(b.identifier),
  );
  // Miller's own copies are ordered newest first (Jason, 2026-08-13): he
  // re-transfers, and the later pass is the better one. 1973-12-19 has two —
  // `sbd.miller.113503` from 2011 and `sbd.miller.97361` from 2009 — and the
  // 2011 copy is the one that agrees with Dick's Picks 1. `added` falls back to
  // the identifier so a missing date can't scramble the order.
  const miller = pool
    .filter(isMiller)
    .sort(
      (a, b) =>
        (b.added || '').localeCompare(a.added || '') ||
        a.identifier.localeCompare(b.identifier),
    );
  return [...miller, ...pool.filter((item) => !isMiller(item))];
}

/**
 * A file's duration in seconds.
 *
 * archive.org is inconsistent about this: lossless files carry fractional
 * seconds ("451.88") while the MP3 derivatives carry "MM:SS" ("07:31"). Reading
 * one form and not the other yields NaN durations that look like missing data.
 */
function parseLength(value: string): number | null {
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value));
  const parts = value.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/**
 * Ordered track list for a recording.
 *
 * Every track is published in several formats — Flac, MP3, Ogg — so this takes
 * one and ignores the rest, preferring lossless because those carry exact
 * lengths. Titles carry a leading track number ("01 Funiculi Funicula") that
 * has to come off before any registry lookup.
 */
export async function recordingTracks(
  identifier: string,
): Promise<{ title: string; duration: string }[]> {
  const res = await fetchRetry(`https://archive.org/metadata/${identifier}`, {
    label: `archive.org metadata ${identifier}`,
  });
  if (!res.ok) throw new Error(`archive.org metadata: HTTP ${res.status}`);
  const body = (await res.json()) as {
    files?: {
      name?: string;
      format?: string;
      title?: string;
      track?: string;
      length?: string;
    }[];
  };

  const files = body.files ?? [];
  // '24bit Flac' is a distinct format name, and items mastered at 24/96 carry
  // only that — falling through to the MP3 derivative is what surfaced the
  // "MM:SS" length form in the first place.
  const format =
    ['Flac', '24bit Flac', 'VBR MP3', 'Ogg Vorbis'].find((candidate) =>
      files.some((file) => file.format === candidate && file.title),
    ) ?? null;
  if (!format) return [];

  // One item can carry the same track twice under one format name: 9/11/74 has
  // both `gd74-09-11d1t01.mp3` and `…d1t01_vbr.mp3`, each reported as
  // "VBR MP3", and the skeleton came back with all 19 songs doubled. Dedupe on
  // the filename with its extension and encoding suffix stripped, which is the
  // only key that separates a re-encode from a genuine repeat: the two copies
  // can differ by a second in `length` (3:27 vs 3:26), and a two-disc item
  // numbering both discs from 1 makes `track` ambiguous on its own.
  const seen = new Set<string>();
  const unique = files.filter((file) => {
    if (file.format !== format || !file.title || !file.length) return false;
    const key = (file.name ?? '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/_(vbr|sample|\d+kb)$/i, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  /** `…d2t07.mp3` → [2, 7]; null when the name doesn't carry disc/track. */
  const discTrack = (name: string): [number, number] | null => {
    const match = name.match(/d(\d+)t(\d+)/i);
    return match ? [Number(match[1]), Number(match[2])] : null;
  };

  return (
    unique
      // Disc first, then track, read from the *filename*. Sorting on the `track`
      // field alone interleaves the discs of any item numbering each from 1, and
      // sorting on the raw name fails when an item spells its discs differently:
      // 6/26/74 names disc two `gd74-06-26d2t01` and disc one `gd740626d1t01`,
      // so plain name order puts the second set first. Items without the
      // convention fall back to numeric name order.
      .sort((a, b) => {
        const left = discTrack(a.name ?? '');
        const right = discTrack(b.name ?? '');
        if (left && right) return left[0] - right[0] || left[1] - right[1];
        return (a.name ?? '').localeCompare(b.name ?? '', undefined, {
          numeric: true,
        });
      })
      .flatMap((file) => {
        const seconds = parseLength(file.length ?? '');
        if (seconds === null) return [];
        const title = (file.title ?? '')
          .replace(/^\d+\s*[-.]?\s*/, '')
          .replace(/[‘’]/g, "'")
          // Taper titles mark segues with an ASCII arrow, "Help On The Way ->",
          // which is part of the sequencing rather than the song's name. They
          // also carry footnote markers — "Turn On Your Lovelight *", "The Things
          // I Used To Do **" — keyed to notes in the item description, usually
          // naming a guest. Both are annotation, not title: left on, the marker
          // hides a song the registry already knows (that Lovelight is an
          // existing alias). Repeat the group so "Title * >" comes off in either
          // order.
          .replace(/(?:\s*(?:->|[>→]|\*+))+\s*$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        return title ? [{ title, duration: formatDuration(seconds) }] : [];
      })
  );
}
