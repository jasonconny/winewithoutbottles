/**
 * Show ids.
 *
 * A show's id is its date, compacted — `19720827` — and that id is also the
 * show's URL. Almost every date carries one show, so almost every id is exactly
 * that.
 *
 * The exception is a date the band played twice, clearing the house between
 * performances (a 1970–71 habit; once the three-set night became the shape of a
 * Dead show it was over). Those are two shows with two setlists, so two pieces
 * of art — but they share a date, and the date is the id. The tiebreak is a
 * two-digit ordinal appended to it: `1970021301`, `1970021302`.
 *
 * The ordinal is *only* a collision-breaker. It says which of the date's shows
 * this is and nothing more; which sitting it was — early or late — is the
 * `sitting` field on the show itself (see `ShowMeta`), because that is a fact
 * about the performance rather than about the URL. A date whose early tape is
 * lost still has a knowable late show, and it keeps a plain 8-digit id.
 *
 * Ids sort lexicographically into performance order without special handling:
 * `1970021301` < `1970021302` < `19700214`, since the ordinal digits are
 * compared before the following date's day digits ever come up.
 */

/** The id shape: a compact date, plus a two-digit ordinal on a shared date. */
export const SHOW_ID_RE = /^\d{8}(?:\d{2})?$/;

/** Whether a URL segment could be a show id at all (says nothing about existence). */
export function isShowId(value: string): boolean {
  return SHOW_ID_RE.test(value);
}

/**
 * Split an id into the ISO date it was built from and, when the date carries
 * more than one show, which of them this is. Returns undefined for anything not
 * id-shaped, so callers can use it as the shape check as well as the parse.
 */
export function parseShowId(
  id: string,
): { date: string; ordinal?: number } | undefined {
  if (!SHOW_ID_RE.test(id)) return undefined;
  const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  return id.length > 8 ? { date, ordinal: Number(id.slice(8)) } : { date };
}
