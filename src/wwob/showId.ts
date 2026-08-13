/**
 * Show ids, and the early/late split.
 *
 * A show's id is its date, compacted — `19720827` — and that id is also the
 * show's URL. On the nights the band played two separate performances (a 1970–71
 * habit; by the time the three-set night became the shape of a Dead show it was
 * over), one date carries two shows. Each has its own setlist, so each is its
 * own piece of art, and each gets its own id with a performance suffix:
 * `19700213-early`, `19700213-late`.
 *
 * `date` stays ISO `YYYY-MM-DD` on both halves — it is what sorts, what the
 * year/tour/venue/run galleries group on, and what a release's date list
 * matches. Only the id, and therefore the URL, tells the two apart.
 *
 * The suffixes sort the way the night ran: `-early` < `-late`, and a bare id
 * sorts before either, so ordering by id is a safe tiebreak wherever two shows
 * share a date.
 */

/** Which performance of a two-show night. Absent on a single-show date. */
export type ShowSet = 'early' | 'late';

/** The id shape: a compact date, optionally suffixed with a performance. */
export const SHOW_ID_RE = /^\d{8}(?:-early|-late)?$/;

/** Whether a URL segment could be a show id at all (says nothing about existence). */
export function isShowId(value: string): boolean {
  return SHOW_ID_RE.test(value);
}

/**
 * Split an id back into the ISO date it was built from and, for a two-show
 * night, which performance it is. Returns undefined for anything not id-shaped,
 * so callers can use it as the shape check as well as the parse.
 */
export function parseShowId(
  id: string,
): { date: string; set?: ShowSet } | undefined {
  if (!SHOW_ID_RE.test(id)) return undefined;
  const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  const suffix = id.slice(9);
  return suffix ? { date, set: suffix as ShowSet } : { date };
}
