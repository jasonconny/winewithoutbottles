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
 * those, Charlie Miller's transfers: `transferer` carries his name verbatim, so
 * that's a real filter rather than a guess at the filename.
 */
import { formatDuration } from '../src/wwob/index.ts';

const UA = 'wine-without-bottles/1.0 (https://winewithoutbottles.com)';

export interface Recording {
  identifier: string;
  source: string;
  transferer: string;
}

interface SearchDoc {
  identifier: string;
  source?: string | string[];
  transferer?: string | string[];
}

/** archive.org returns some fields as either a string or an array of them. */
const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? '';

/**
 * Best recording of a date: a soundboard, Charlie Miller's if he did one.
 *
 * Returns null when nothing is catalogued for the date, which for a show the
 * band definitely played usually means the tape isn't circulating.
 */
export async function findRecording(date: string): Promise<Recording | null> {
  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.set(
    'q',
    `collection:GratefulDead AND date:[${date} TO ${date}]`,
  );
  for (const field of ['identifier', 'source', 'transferer']) {
    url.searchParams.append('fl[]', field);
  }
  url.searchParams.set('rows', '50');
  url.searchParams.set('output', 'json');

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`archive.org search: HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { docs?: SearchDoc[] } };

  const candidates = (body.response?.docs ?? []).map((doc) => ({
    identifier: doc.identifier,
    source: first(doc.source),
    transferer: first(doc.transferer),
  }));
  return rank(candidates)[0] ?? null;
}

/**
 * Every candidate for a date, best first.
 *
 * Same preference as `findRecording` — soundboards, Charlie Miller's if he did
 * one — but the remainder is sorted by identifier rather than left in the order
 * archive.org happened to return. **That order is not stable**: the search sets
 * no sort, so two runs minutes apart can hand back the same two tapes in
 * opposite order, and the pick silently changes with them. That surfaced when a
 * staged skeleton came back with 8 songs where the previous run had 11, and
 * again at 7 songs where a previous run had 23 — different tape, not different
 * data. A staged file has to be reproducible, so the tie-break is explicit.
 */
export async function findRecordings(date: string): Promise<Recording[]> {
  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.set(
    'q',
    `collection:GratefulDead AND date:[${date} TO ${date}]`,
  );
  for (const field of ['identifier', 'source', 'transferer']) {
    url.searchParams.append('fl[]', field);
  }
  url.searchParams.set('rows', '50');
  url.searchParams.set('output', 'json');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`archive.org search: HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { docs?: SearchDoc[] } };
  return rank(
    (body.response?.docs ?? []).map((doc) => ({
      identifier: doc.identifier,
      source: first(doc.source),
      transferer: first(doc.transferer),
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
  const miller = pool.filter((item) => /charlie miller/i.test(item.transferer));
  return [...miller, ...pool.filter((item) => !miller.includes(item))];
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
  const res = await fetch(`https://archive.org/metadata/${identifier}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`archive.org metadata: HTTP ${res.status}`);
  const body = (await res.json()) as {
    files?: {
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

  return files
    .filter((file) => file.format === format && file.title && file.length)
    .sort((a, b) => Number(a.track ?? 0) - Number(b.track ?? 0))
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
    });
}
