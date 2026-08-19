/**
 * Shared MediaWiki access and wikitext date parsing.
 *
 * Split out of `releases.ts` so `import.ts` (and tests) can use it: importing
 * `releases.ts` would run that file's top-level fetch as a side effect.
 */
import { fetchRetry } from './http.ts';

const API = 'https://en.wikipedia.org/w/api.php';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export async function api(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API);
  for (const [k, v] of Object.entries({
    format: 'json',
    formatversion: '2',
    ...params,
  })) {
    url.searchParams.set(k, v);
  }
  const res = await fetchRetry(url.toString(), {
    label: `wikipedia ${url.pathname}`,
  });
  if (!res.ok) throw new Error(`${url.pathname}: HTTP ${res.status}`);
  return res.json();
}

export async function sectionWikitext(section: number): Promise<string> {
  const data = (await api({
    action: 'parse',
    page: 'Grateful_Dead_discography',
    section: String(section),
    prop: 'wikitext',
  })) as { parse?: { wikitext?: string } };
  const text = data.parse?.wikitext;
  if (!text) throw new Error(`discography section ${section} returned nothing`);
  return text;
}

/** Fetch article wikitext in batches (the API takes up to 50 titles at once). */
export async function articles(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const data = (await api({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: batch.join('|'),
      // Follow redirects, or a title that merely differs in case from the real
      // article silently yields its 64-byte "#REDIRECT" stub instead of the
      // release. `One From the Vault` is linked that way from one of the
      // discography's two tables, and read as an article with no track listing,
      // no prose and no completeness claim — a release that looks unreadable
      // rather than misdirected.
      redirects: '1',
    })) as {
      query: {
        pages: {
          title: string;
          missing?: boolean;
          revisions?: { slots: { main: { content: string } } }[];
        }[];
        normalized?: { from: string; to: string }[];
        redirects?: { from: string; to: string }[];
      };
    };
    // The API normalises titles (underscores, first-letter case) and then
    // resolves redirects, so undo both, in that order, to map the response back
    // onto the titles we asked for.
    const alias = new Map<string, string>();
    for (const n of data.query.normalized ?? []) alias.set(n.to, n.from);
    for (const r of data.query.redirects ?? [])
      alias.set(r.to, alias.get(r.from) ?? r.from);
    for (const page of data.query.pages) {
      if (page.missing || !page.revisions) continue;
      const asked = alias.get(page.title) ?? page.title;
      out.set(asked, page.revisions[0].slots.main.content);
    }
  }
  return out;
}

export const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** "March 16, 1990" → 1990-03-16. Returns null for anything else. */
export function longDate(text: string): string | null {
  const m = text.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]) + 1;
  return month ? iso(+m[3], month, +m[2]) : null;
}

/** "(4/7/1972)" or a bare "10/7/77" → ISO. Two-digit years are 19xx. */
export function slashDate(text: string): string | null {
  const m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
  if (!m) return null;
  const year = m[3].length === 2 ? 1900 + +m[3] : +m[3];
  return iso(year, +m[1], +m[2]);
}

/**
 * "Disc one – February 23", "October 1 – first set" → ISO, using the release's
 * span for the year the heading leaves off.
 *
 * Only safe because the span bounds it: Road Trips 4:2 prints a "Wednesday,
 * March 30" setlist heading for a show that isn't on the release, and it falls
 * outside the release's March 31 – April 1 span, so it drops out on its own.
 */
export function monthDayIn(
  text: string,
  span: { first: string; last: string } | null,
): string | null {
  if (!span) return null;
  // Scan every `Word Number` pair rather than testing only the first. A heading
  // routinely opens with one that isn't a date — `Disc 2 (all tracks recorded on
  // February 3)` — and stopping there returned null for a string that plainly
  // names a day, which is how Dick's Picks 18's second and third discs came back
  // undated. Non-month words are skipped, so this can only turn a null into a
  // date, never change one the old form already found.
  for (const m of text.matchAll(
    /\b([A-Z][a-z]+)\s+(\d{1,2})\b(?!\s*,?\s*\d{4})/g,
  )) {
    const month = MONTHS.indexOf(m[1]) + 1;
    if (!month) continue;
    // A span can straddle New Year, so try each year it touches.
    for (
      let year = +span.first.slice(0, 4);
      year <= +span.last.slice(0, 4);
      year++
    ) {
      const date = iso(year, month, +m[2]);
      if (date >= span.first && date <= span.last) return date;
    }
  }
  return null;
}

/**
 * Dates stated in the discography's own entry ("– October 16, 1989").
 *
 * Authoritative only when it names specific days. A range like "June 10 – 19,
 * 1976" is a span, not a show list — it silently includes dark days the band
 * didn't play — so ranges resolve to nothing here and fall through to the
 * article, which lists the concerts individually.
 */
export function datesFromDateText(text: string): string[] {
  // "October 4 & 6, 1980" / "July 12 & 13, 1989" — specific, non-contiguous.
  const amp = text.match(
    /^([A-Z][a-z]+)\s+(\d{1,2})\s*&\s*(\d{1,2}),\s*(\d{4})\s*$/,
  );
  if (amp) {
    const month = MONTHS.indexOf(amp[1]) + 1;
    if (month)
      return [iso(+amp[4], month, +amp[2]), iso(+amp[4], month, +amp[3])];
  }
  // A single day, and nothing else on the line.
  const one = text.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})\s*$/);
  if (one) {
    const month = MONTHS.indexOf(one[1]) + 1;
    if (month) return [iso(+one[3], month, +one[2])];
  }
  return [];
}

/**
 * Outer bounds of every date mentioned in a discography entry, so article
 * parsing can be confined to them. Release articles discuss neighbouring
 * releases in prose, and those stray dates otherwise land in the show list —
 * the Fillmore West 1969 box picked up a 1968 and a 1970 date that way.
 */
export function spanFromDateText(
  text: string,
): { first: string; last: string } | null {
  const found: string[] = [];
  let month = 0;
  // A date's year is the next one written after it: "March 9, 1981 – October
  // 12, 1983" gives each endpoint its own, while "June 10 – 19, 1976" and
  // "February 27 – March 2, 1969" name theirs once, at the end, for both.
  const years = [...text.matchAll(/\b(19\d\d)\b/g)].map((m) => ({
    year: +m[1],
    at: m.index,
  }));
  if (!years.length) return null;
  for (const token of text.matchAll(/([A-Z][a-z]+)?\s*\b(\d{1,2})\b/g)) {
    if (token[1]) {
      const named = MONTHS.indexOf(token[1]) + 1;
      if (!named) continue;
      month = named;
    }
    if (!month) continue;
    const day = +token[2];
    if (day < 1 || day > 31) continue;
    const year = (
      years.find((y) => y.at > token.index) ?? years[years.length - 1]
    ).year;
    found.push(iso(year, month, day));
  }
  if (!found.length) return null;
  const sorted = [...found].sort();
  return { first: sorted[0], last: sorted[sorted.length - 1] };
}

/**
 * Dates from the infobox "recorded" field.
 *
 * Handles the single-concert case ("March 29, 1990") and the two ways a release
 * enumerates scattered nights rather than a span: line breaks ("August 7, 1971
 * <br /> August 24, 1971 <br /> August 6, 1971") and day lists sharing a month
 * ("June 22, 24, 1973"). Both are lists of specific shows, unlike a dashed
 * range, which stays unresolved because it may cover nights the band was dark.
 */
export function infoboxRecorded(wikitext: string): string[] {
  const m = wikitext.match(/^\s*\|\s*recorded\s*=\s*(.+)$/m);
  if (!m) return [];
  const field = m[1]
    .replace(/<!--.*?-->/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  // A dash means a span; leave those to the article's own per-show structure.
  const chunks = field.split(/<br\s*\/?>|\{\{break\}\}|;/i);
  const dates = new Set<string>();
  for (const chunk of chunks) {
    if (/[–—]|\s-\s/.test(chunk)) continue;
    const listed = chunk.match(
      /^\s*([A-Z][a-z]+)\s+((?:\d{1,2}\s*,\s*)*\d{1,2})\s*,\s*(\d{4})\s*$/,
    );
    if (listed) {
      const month = MONTHS.indexOf(listed[1]) + 1;
      if (!month) continue;
      for (const day of listed[2].split(/\s*,\s*/)) {
        dates.add(iso(+listed[3], month, +day));
      }
      continue;
    }
    for (const date of datesFromDateText(chunk.trim())) dates.add(date);
  }
  return [...dates].sort();
}
