/**
 * MusicBrainz lookup — the fallback for releases Wikipedia lists untimed.
 *
 * Wikipedia is the preferred source (see `import.ts`), but its track listings
 * are uneven: seven corpus shows across two releases have titles, order and
 * per-show sectioning with no durations at all. MusicBrainz carries a length
 * for every track on the physical release, and — usefully — titles each medium
 * with the night it holds ("Madison Square Garden, 3/9/1981, Set One",
 * "May 5, 1977: Veterans Memorial Coliseum • New Haven, CT"), so it can do the
 * per-show attribution itself rather than needing to be aligned against
 * Wikipedia's sequence.
 *
 * Data is CC0 and the API is documented. Rate limit is one request a second,
 * which this respects; results are cached per process so a batch import of one
 * box set costs two requests, not two per show.
 */
import { formatDuration } from '../src/wwob/index.ts';
import { fetchRetry } from './http.ts';
import { longDate, monthDayIn, slashDate } from './wiki.ts';

const API = 'https://musicbrainz.org/ws/2';

/** MusicBrainz asks for one request per second from unauthenticated clients. */
const RATE_LIMIT_MS = 1100;
let lastCall = 0;

/**
 * One request, rate-limited and retried.
 *
 * MusicBrainz answers 503 when it decides you're going too fast — not an error
 * so much as "wait" — and 429 outright. Both are expected during a batch
 * import, so back off and retry rather than failing the run. `fetchRetry` also
 * covers the case this function used to miss entirely: `fetch` rejecting on a
 * dropped socket, which is not a status code and once killed a whole audit.
 *
 * The rate limiting stays here rather than in `fetchRetry` because it is
 * MusicBrainz's rule, not a general one.
 */
async function mb(path: string): Promise<unknown> {
  const wait = RATE_LIMIT_MS - (Date.now() - lastCall);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCall = Date.now();
  const res = await fetchRetry(`${API}/${path}`, {
    label: `musicbrainz ${path}`,
    baseDelayMs: RATE_LIMIT_MS * 2,
    retryStatus: (status) => status === 503 || status === 429,
  });
  if (!res.ok) throw new Error(`musicbrainz ${path}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Normalise a MusicBrainz track title toward the corpus's conventions.
 *
 * MusicBrainz uses typographic punctuation throughout — curly apostrophes and
 * a U+2010 hyphen ("Mississippi Half‐Step") — and appends segue markers to the
 * title itself ("Help on the Way >"). The registry is keyed on literal strings,
 * so all of that has to come off before a lookup can match.
 */
export function normaliseMbTitle(title: string): string {
  return title
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s*[>→]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ReleaseSearchResult {
  releases?: { id: string; score: number; 'track-count': number }[];
}

interface ReleaseDetail {
  media?: {
    position: number;
    title?: string;
    tracks?: { position: number; title: string; length?: number | null }[];
  }[];
}

const cache = new Map<
  string,
  Map<string, { title: string; duration: string }[]>
>();

/**
 * Tracks for a release, bucketed by the show date each medium belongs to.
 *
 * Returns an empty map when the release can't be found, its mediums aren't
 * dated, or any track lacks a length — in every one of those cases the caller
 * should keep whatever it already had rather than accept a partial answer.
 */
export async function tracksByDateFromMusicBrainz(
  releaseName: string,
  knownDates: string[],
): Promise<Map<string, { title: string; duration: string }[]>> {
  const cached = cache.get(releaseName);
  if (cached) return cached;

  const empty = new Map<string, { title: string; duration: string }[]>();
  const query = encodeURIComponent(
    `release:"${releaseName}" AND artist:"Grateful Dead"`,
  );
  const found = (await mb(
    `release/?query=${query}&fmt=json&limit=5`,
  )) as ReleaseSearchResult;
  // Prefer the best-scoring match, then the one with most tracks — different
  // pressings of a box set differ in bonus discs, and more is safer here since
  // extra mediums simply bucket to dates nobody asks for.
  const best = (found.releases ?? [])
    .filter((release) => release.score >= 90)
    .sort((a, b) => b['track-count'] - a['track-count'])[0];
  if (!best) {
    cache.set(releaseName, empty);
    return empty;
  }

  const detail = (await mb(
    `release/${best.id}?inc=recordings&fmt=json`,
  )) as ReleaseDetail;

  const span = knownDates.length
    ? { first: knownDates[0], last: knownDates[knownDates.length - 1] }
    : null;
  const known = new Set(knownDates);
  const byDate = new Map<string, { title: string; duration: string }[]>();

  for (const medium of detail.media ?? []) {
    if (!medium.title || !medium.tracks?.length) continue;
    const date =
      slashDate(medium.title) ??
      longDate(medium.title) ??
      monthDayIn(medium.title, span);
    if (!date || !known.has(date)) continue;
    const tracks = byDate.get(date) ?? [];
    for (const track of medium.tracks) {
      // A track with no length can't size a stripe; drop the whole release
      // rather than emit a show with a hole in it.
      if (!track.length) {
        cache.set(releaseName, empty);
        return empty;
      }
      tracks.push({
        title: normaliseMbTitle(track.title),
        duration: formatDuration(Math.round(track.length / 1000)),
      });
    }
    byDate.set(date, tracks);
  }

  cache.set(releaseName, byDate);
  return byDate;
}
