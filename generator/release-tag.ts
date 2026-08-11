/**
 * The release-tag rule, kept pure and separate so both the index builder
 * (`releases.ts`) and `tests/data-validity.test.ts` can use it. Importing
 * `releases.ts` would run its top-level fetch, so the rule cannot live there.
 */

export type Completeness = 'complete' | 'partial' | 'unknown';

/**
 * Names no shortening rule can help with, because the distinctive part isn't
 * separated by a colon. Declared here rather than hand-edited into
 * `data/releases.json` so re-drafting reproduces them instead of reverting to
 * the full title.
 */
const HAND_SHORTENED: Record<string, string> = {
  'Robert F. Kennedy Stadium, Washington, D.C., July 12 & 13, 1989': 'RFK 1989',
};

/**
 * Tag for a release's member shows, or null when it earns none.
 *
 * A tag exists to gather whole shows into an index, so a release only earns one
 * when it *has* member shows to gather:
 *
 *   - series volume        → the series ("Dave's Picks", not "…Volume 28")
 *   - 2+ complete concerts → a shortened release name
 *   - anything else        → nothing
 *
 * That last case covers single-show one-offs and multi-show compilations that
 * contain no full concert — a set drawing selections across three nights
 * without holding any of them whole has no member shows, so its tag would index
 * an empty page.
 */
export function releaseTag(
  name: string,
  series: string | null,
  completeness: Completeness,
  showCount: number,
  /** Every release name, so a shortened form can be checked for collisions. */
  allNames: ReadonlySet<string> = new Set(),
): string | null {
  if (series) return series;
  if (completeness !== 'complete' || showCount < 2) return null;
  return shortenReleaseName(name, allNames);
}

/**
 * Shorten a release name to its distinctive part.
 *
 * Subtitles are almost always the disposable half — "In and Out of the Garden:
 * Madison Square Garden '81, '82, '83", "Listen to the River: St. Louis '71 '72
 * '73" — so the default is to keep what precedes the colon. The exception is
 * when that prefix is itself another release: "May 1977: Get Shown the Light"
 * has to keep its subtitle, or it collides with the separate "May 1977" box.
 *
 * Parentheticals always survive; they are what keeps "Spring 1990" and
 * "Spring 1990 (The Other One)" apart.
 */
export function shortenReleaseName(
  name: string,
  allNames: ReadonlySet<string> = new Set(),
): string {
  const byHand = HAND_SHORTENED[name];
  if (byHand) return byHand;
  const stripped = name.replace(/:\s*The Complete Recordings$/, '');
  if (stripped !== name) return stripped;
  const colon = name.match(/^(.+?):\s+(.+)$/);
  if (!colon) return name;
  const [, head, tail] = colon;
  return allNames.has(head) ? tail : head;
}
