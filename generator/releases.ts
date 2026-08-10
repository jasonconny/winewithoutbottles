/**
 * Official-release index (dev tool, run via tsx). Builds the map from an
 * official Grateful Dead release to the show dates it contains, which is what
 * lets the importer source a show's timings from the release rather than a
 * soundboard transfer.
 *
 *   tsx generator/releases.ts            # verify the authored index vs Wikipedia
 *   tsx generator/releases.ts --draft    # (re)write data/releases.json from scratch
 *   tsx generator/releases.ts --draft --only "June 1976"   # …just matching releases
 *
 * Two modes, keyed the same way `verify.ts` is:
 *
 *   - `--draft`  → EXTRACT: fetch everything and write a draft index. Anything
 *     the parser can't settle is emitted as `"completeness": "unknown"` with a
 *     `note`, for a human to resolve.
 *   - default    → VERIFY: re-fetch and report where the authored index and
 *     Wikipedia disagree. Exits non-zero on drift.
 *
 * `data/releases.json` is **authored data**, like `data/shows/`: the draft is a
 * bootstrap, and hand-corrections to it are the source of truth. That's why the
 * default mode reports drift instead of overwriting — re-drafting would throw
 * away every judgement call recorded in the file.
 *
 * Sources: the MediaWiki API only. Wikipedia's own sectioning decides
 * eligibility (see SECTIONS), and each release's article supplies the dates.
 * jerrybase is deliberately not consulted — its robots.txt disallows automated
 * agents, so it stays a manual reference.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseTag } from './release-tag.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'data', 'releases.json');

const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'wine-without-bottles/1.0 (https://winewithoutbottles.com)';

/**
 * Discography sections, and what each contributes.
 *
 * `eligible` is whether a release in that section can *source* a show's
 * timings. Contemporary live albums and compilations are excluded because they
 * are highlights, not concerts — excluding one from sourcing says nothing about
 * its tag (`Live/Dead` remains a tag on the shows it was drawn from).
 */
const SECTIONS = [
  { index: 1, kind: 'contemporary', eligible: false, series: null },
  { index: 3, kind: 'traditional', eligible: true, series: null },
  { index: 4, kind: 'series', eligible: true, series: "Dick's Picks" },
  { index: 5, kind: 'series', eligible: true, series: 'Download Series' },
  { index: 6, kind: 'series', eligible: true, series: 'Road Trips' },
  { index: 7, kind: 'series', eligible: true, series: "Dave's Picks" },
  { index: 8, kind: 'unauthorized', eligible: false, series: null },
  { index: 10, kind: 'box', eligible: true, series: null },
  { index: 11, kind: 'album-box', eligible: false, series: null },
  { index: 12, kind: 'compilation', eligible: false, series: null },
] as const;

/** The list of live albums in recording-date order — the release↔date join. */
const BY_DATE_SECTION = 13;

/**
 * Compilations that sit in an otherwise-eligible section. Section membership
 * gets eligibility right for most releases, but "Traditional releases" and
 * "Concert box sets" both carry cross-era highlights collections that no amount
 * of parsing distinguishes from a concert release.
 */
const NOT_CONCERTS = new Set([
  'Infrared Roses',
  'Grayfolded',
  'Fallout from the Phil Zone',
  'Postcards of the Hanging',
  'Rare Cuts and Oddities 1966',
  'The Grateful Dead Movie Soundtrack',
  'Birth of the Dead',
  "Europe '72 Volume 2",
  'Spring 1990: So Glad You Made It',
  'The Music Never Stopped',
  'Ready or Not',
  // "highlights from their fall 1979 tour of the East Coast" — no whole show.
  'Road Trips Volume 1 Number 1',
  // "collects performances from seven of their eight shows in England" across
  // four CDs; the Europe '72 box holds those nights complete.
  "Steppin' Out with the Grateful Dead: England '72",
  'So Many Roads (1965–1995)',
  'So Many Roads (1965–1995) Sampler',
  // The 4-CD highlights sampler, NOT the 80-CD box of complete shows it is
  // named after. Conflating the two would silently drop 30 full concerts.
  '30 Trips Around the Sun: The Definitive Live Story 1965–1995',
  // Studio outtake series, not concerts.
  "Workingman's Dead: The Angel's Share",
  "American Beauty: The Angel's Share",
  "Wake of the Flood: The Angel's Share",
  "From the Mars Hotel: The Angel's Share",
  "Blues for Allah: The Angel's Share",
]);

/**
 * Releases whose shows are stated only in article prose, which the parser
 * deliberately doesn't mine (scanning free text for dates picks up neighbouring
 * releases and chart trivia). Each is read off the article's own lead, quoted
 * in the note, so a re-draft reproduces the reading instead of reverting to
 * "resolve by hand".
 *
 * `partial` here is load-bearing: a release covering several nights with
 * *selections* from each can gap-fill a show but can never source one whole,
 * and it earns no tag.
 */
const HAND_RESOLVED: Record<
  string,
  {
    dates: string[];
    bonusDates?: string[];
    completeness: Release['completeness'];
    note: string;
  }
> = {
  'Winterland 1973: The Complete Recordings': {
    dates: ['1973-11-09', '1973-11-10', '1973-11-11'],
    bonusDates: ['1973-12-04'],
    completeness: 'complete',
    note: 'article: "three complete concerts, missing only the encore of the first"; bonus disc is 12/4/73 Cincinnati',
  },
  'Winterland June 1977: The Complete Recordings': {
    dates: ['1977-06-07', '1977-06-08', '1977-06-09'],
    bonusDates: ['1977-05-12'],
    completeness: 'complete',
    note: 'article: "three complete concerts"; bonus disc is 5/12/77, released whole on the May 1977 box',
  },
  "Dick's Picks Volume 30": {
    dates: ['1972-03-28'],
    bonusDates: ['1972-03-25', '1972-03-27'],
    completeness: 'complete',
    note: 'article: "the entire March 28, 1972 performance plus selections from March 25, 1972, and March 27, 1972"',
  },
  "Dick's Picks Volume 4": {
    dates: ['1970-02-13', '1970-02-14'],
    completeness: 'partial',
    note: 'article: recorded February 13 and 14, 1970, Fillmore East; three sets per night, three CDs — selections',
  },
  "Dick's Picks Volume 18": {
    dates: ['1978-02-03', '1978-02-05'],
    bonusDates: ['1978-02-04'],
    completeness: 'partial',
    note: 'article: 2/3 Madison and 2/5 Cedar Falls, plus two songs from 2/4 Milwaukee; disc 1 recombines all three',
  },
  'Ladies and Gentlemen... the Grateful Dead': {
    dates: [
      '1971-04-25',
      '1971-04-26',
      '1971-04-27',
      '1971-04-28',
      '1971-04-29',
    ],
    completeness: 'partial',
    note: 'article: recorded at the April 25–29, 1971 Fillmore East shows — four CDs across five nights',
  },
  'Go to Nassau': {
    dates: ['1980-05-15', '1980-05-16'],
    completeness: 'partial',
    note: 'article: "presents half of the songs played on the final two nights", resequenced as one concert',
  },
  'Fillmore West 1969': {
    dates: ['1969-02-27', '1969-02-28', '1969-03-01', '1969-03-02'],
    completeness: 'partial',
    note: 'article: "selected songs" from the four nights; the complete run is the 10-CD box',
  },
  "Dozin' at the Knick": {
    dates: ['1990-03-24', '1990-03-25', '1990-03-26'],
    completeness: 'partial',
    note: 'article: selections from three nights, each later released whole elsewhere (3/24 only across four releases)',
  },
};

/**
 * Completeness the article doesn't state, settled by Jason from knowledge of
 * the catalogue.
 *
 * Completeness-only: dates still come from the parser, because these resolve
 * cleanly — it's the claim about *how much of each night* is present that the
 * prose leaves out. The default stays `unknown` precisely so an unverified
 * guess never passes for a verified one.
 */
const COMPLETENESS_BY_HAND: Record<string, Release['completeness']> = {
  // One complete show from each year the band performed, 1966–1995.
  '30 Trips Around the Sun': 'complete',
  // Three MSG nights across three CDs — take the timings for the tracks it
  // does carry and leave the rest of each show as authored.
  'Road Trips Volume 2 Number 1': 'partial',
};

const MONTHS = [
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

export interface Release {
  /** Wikipedia article title — the fetch key, which is NOT always the name. */
  page: string | null;
  /** Display name as the discography lists it. */
  name: string;
  /** 'series' | 'box' | 'traditional' */
  kind: string;
  /** Parent series, for volume releases. */
  series: string | null;
  /** Whether this release can source a show's timings; see `note` if not. */
  eligible: boolean;
  /** Tag applied to member shows; null for single-show one-offs. */
  tag: string | null;
  /** Show dates the release contains, ISO, sorted. */
  dates: string[];
  /** Dates present only as bonus tracks — not sourceable as whole shows. */
  bonusDates: string[];
  completeness: 'complete' | 'partial' | 'unknown';
  /** How `dates` was derived, or why it couldn't be. */
  note: string;
  musicbrainzReleaseId: string | null;
}

async function api(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API);
  for (const [k, v] of Object.entries({
    format: 'json',
    formatversion: '2',
    ...params,
  })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url.pathname}: HTTP ${res.status}`);
  return res.json();
}

async function sectionWikitext(section: number): Promise<string> {
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
async function articles(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const data = (await api({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: batch.join('|'),
    })) as {
      query: {
        pages: {
          title: string;
          missing?: boolean;
          revisions?: { slots: { main: { content: string } } }[];
        }[];
        normalized?: { from: string; to: string }[];
      };
    };
    // The API normalises titles (underscores, first-letter case), so map the
    // response back onto the titles we asked for.
    const alias = new Map<string, string>();
    for (const n of data.query.normalized ?? []) alias.set(n.to, n.from);
    for (const page of data.query.pages) {
      if (page.missing || !page.revisions) continue;
      const asked = alias.get(page.title) ?? page.title;
      out.set(asked, page.revisions[0].slots.main.content);
    }
  }
  return out;
}

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** "March 16, 1990" → 1990-03-16. Returns null for anything else. */
function longDate(text: string): string | null {
  const m = text.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]) + 1;
  return month ? iso(+m[3], month, +m[2]) : null;
}

/** "(4/7/1972)" or a bare "10/7/77" → ISO. Two-digit years are 19xx. */
function slashDate(text: string): string | null {
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
function monthDayIn(
  text: string,
  span: { first: string; last: string } | null,
): string | null {
  if (!span) return null;
  const m = text.match(/\b([A-Z][a-z]+)\s+(\d{1,2})\b(?!\s*,?\s*\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]) + 1;
  if (!month) return null;
  // A span can straddle New Year, so try each year it touches.
  for (
    let year = +span.first.slice(0, 4);
    year <= +span.last.slice(0, 4);
    year++
  ) {
    const date = iso(year, month, +m[2]);
    if (date >= span.first && date <= span.last) return date;
  }
  return null;
}

/**
 * Pull the show dates out of a release's article.
 *
 * There is no single convention — across the catalogue, per-show boundaries are
 * marked as section headings ("=== March 9, 1981 ==="), italic sub-headings
 * (":''June 23, 1976 – Tower Theatre:''"), bulleted "complete concerts" lists,
 * or a slash date inside an italic volume heading (Europe '72). So this reads
 * all four shapes and unions them; a release that matches none is reported for
 * a human rather than guessed at.
 */
function resolveDates(
  wikitext: string,
  /**
   * Dates the discography states outright. Wikipedia's own note on that list:
   * "The dates listed are the principal recording dates and do not include
   * bonus tracks or bonus discs" — so when it names specific days, they are the
   * whole shows, and anything else the article mentions is bonus material.
   */
  principal: string[],
  span: { first: string; last: string } | null,
): {
  dates: string[];
  bonusDates: string[];
  completeness: Release['completeness'];
  note: string;
} {
  const candidates = new Set<string>();
  const flaggedBonus = new Set<string>();
  const methods: string[] = [];

  const add = (line: string, date: string | null) => {
    if (!date) return;
    // Prose about neighbouring releases mentions their dates; the span keeps
    // those out.
    if (span && (date < span.first || date > span.last)) return;
    candidates.add(date);
    // "Bonus tracks – March 24, 1990" is material from a show the release does
    // not otherwise contain: usable for gap-filling, never as a whole show.
    if (/bonus|previously released/i.test(line)) flaggedBonus.add(date);
  };

  for (const line of wikitext.split('\n')) {
    const before = candidates.size;
    const heading = line.match(/^=+(.*?)=+\s*$/);
    if (heading) {
      add(line, slashDate(heading[1]) ?? longDate(heading[1]));
      if (candidates.size > before) methods.push('heading');
      continue;
    }
    // Italic sub-heading inside a track listing.
    const sub = line.match(/^:+''(.+?)''/);
    if (sub) {
      add(
        line,
        longDate(sub[1]) ?? slashDate(sub[1]) ?? monthDayIn(sub[1], span),
      );
      if (candidates.size > before) methods.push('subheading');
      continue;
    }
    // Bold disc/night headings: "'''Disc one – February 23'''", "'''June 16,
    // 1974, Iowa State Fairgrounds'''", "'''…– 10/7/77'''". Several releases
    // delimit their shows this way instead of with headings.
    const strong = line.match(/^'''(.+?)'''/);
    if (strong) {
      add(
        line,
        longDate(strong[1]) ??
          slashDate(strong[1]) ??
          monthDayIn(strong[1], span),
      );
      if (candidates.size > before) methods.push('bold');
      continue;
    }
    // Bulleted concert list in the prose ("contains the following complete
    // concerts:"). Only dashed entries — a bare bulleted date is usually a
    // release-history note, not a concert.
    const bullet = line.match(/^\*\s*([A-Z][a-z]+\s+\d{1,2},\s*\d{4})\s*[–-]/);
    if (bullet) {
      add(line, longDate(bullet[1]));
      if (candidates.size > before) methods.push('bullet');
    }
  }

  const declaresComplete = /complete concerts?/i.test(wikitext);
  const unique = [...new Set(methods)].join('+') || 'none';

  if (principal.length) {
    // The discography named the shows. Everything else the article turned up is
    // bonus material from a night this release does not otherwise carry.
    const extra = [...candidates].filter((d) => !principal.includes(d));
    return {
      dates: [...principal].sort(),
      bonusDates: extra.sort(),
      completeness: declaresComplete ? 'complete' : 'unknown',
      note: declaresComplete
        ? 'principal date from the discography; article says "complete concert"'
        : 'principal date from the discography; completeness not stated — confirm by hand',
    };
  }

  // No stated dates, so the article's per-show sections are the show list, less
  // anything explicitly labelled bonus.
  const dates = [...candidates].filter((d) => !flaggedBonus.has(d)).sort();
  if (!dates.length) {
    return {
      dates: [],
      bonusDates: [...flaggedBonus].sort(),
      completeness: 'unknown',
      note: 'no per-show dates found in the article — resolve by hand',
    };
  }
  return {
    dates,
    bonusDates: [...flaggedBonus].sort(),
    completeness: declaresComplete ? 'complete' : 'unknown',
    note: declaresComplete
      ? `dates from ${unique}; article says "complete concerts"`
      : `dates from ${unique}; completeness not stated — confirm by hand`,
  };
}

/**
 * Dates stated in the discography's own entry ("– October 16, 1989").
 *
 * Authoritative only when it names specific days. A range like "June 10 – 19,
 * 1976" is a span, not a show list — it silently includes dark days the band
 * didn't play — so ranges resolve to nothing here and fall through to the
 * article, which lists the concerts individually.
 */
function datesFromDateText(text: string): string[] {
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
function spanFromDateText(
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
function infoboxRecorded(wikitext: string): string[] {
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

function parseByDateSection(wikitext: string) {
  const entries: { page: string | null; name: string; dateText: string }[] = [];
  const unparsed: string[] = [];
  for (const line of wikitext.split('\n')) {
    if (!line.startsWith('*')) continue;
    // Split the entry from its date text at the first dash *after* the
    // italicised title, not the last dash on the line — several titles contain
    // their own dash-date ("Red Rocks: 7/8/78").
    const parts = line.match(/^\*\s*''(.+?)''\s*(?:\([^)]*\)\s*)?[–-]\s*(.*)$/);
    if (!parts) {
      unparsed.push(line);
      continue;
    }
    const [, titleMarkup, dateText] = parts;
    // Take the LINK TARGET, not the display text: 13 releases are piped, and
    // "May 1977" displayed is "May 1977 (album)" as an article — fetching the
    // display text lands on Wikipedia's page about the month.
    const linked = titleMarkup.match(/^\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]$/);
    entries.push(
      linked
        ? {
            page: linked[1].split('#')[0],
            name: (linked[2] ?? linked[1]).trim(),
            dateText,
          }
        : { page: null, name: titleMarkup.trim(), dateText },
    );
  }
  return { entries, unparsed };
}

async function build(only: string | null): Promise<Release[]> {
  console.log('fetching discography sections…');
  const byDate = await sectionWikitext(BY_DATE_SECTION);
  const { entries, unparsed } = parseByDateSection(byDate);
  for (const line of unparsed) {
    console.warn(`  ! unparsed discography line: ${line.slice(0, 90)}`);
  }

  // Which section each release sits in decides eligibility and series.
  const placement = new Map<string, (typeof SECTIONS)[number]>();
  for (const section of SECTIONS) {
    const text = await sectionWikitext(section.index);
    for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
      // Keyed lower-case: the discography's own sections disagree about case
      // ("One From the Vault" in the date list, "One from the Vault" in the
      // traditional-releases table), and a case-sensitive miss would file a
      // real release as uncatalogued.
      const name = (m[2] ?? m[1]).trim().toLowerCase();
      if (!placement.has(name)) placement.set(name, section);
    }
  }

  /**
   * Why a release can or cannot source a show. Recorded per entry rather than
   * filtered away, so the index shows its own working — otherwise the only
   * record that `Steal Your Face` was considered and rejected lives in this
   * file's constants, and the data can't be audited on its own.
   */
  const verdict = (name: string) => {
    if (NOT_CONCERTS.has(name)) {
      return { eligible: false, why: 'compilation / highlights collection' };
    }
    const section = placement.get(name.toLowerCase());
    if (!section) {
      // Listed in the date section but linked nowhere else, so there is no
      // table to classify it from. Not a rejection on merit — several are real
      // single-show digital releases with no Wikipedia article at all.
      return {
        eligible: false,
        why: 'unlinked in the discography — classify by hand',
      };
    }
    if (!section.eligible) {
      return { eligible: false, why: `${section.kind} release` };
    }
    return { eligible: true, why: '' };
  };

  // The discography lists a few titles twice (a studio album and its deluxe
  // reissue both credit live discs). Keep the first — the index is keyed by
  // name, and a duplicate would make two entries disagree about one release.
  const seen = new Set<string>();
  const unique = entries.filter((entry) => {
    if (seen.has(entry.name)) return false;
    seen.add(entry.name);
    return only ? entry.name.toLowerCase().includes(only.toLowerCase()) : true;
  });
  const eligible = unique.filter((entry) => verdict(entry.name).eligible);
  console.log(
    `${entries.length} listed (${unique.length} distinct), ${eligible.length} eligible to source shows`,
  );

  const pages = [
    ...new Set(eligible.map((e) => e.page).filter(Boolean)),
  ] as string[];
  console.log(`fetching ${pages.length} release articles…`);
  const text = await articles(pages);

  // Shortening checks for collisions, so it needs every name up front.
  const allNames = new Set(entries.map((e) => e.name));
  const releases: Release[] = [];
  for (const entry of unique) {
    const { eligible: canSource, why } = verdict(entry.name);
    const section = placement.get(entry.name.toLowerCase());
    if (!canSource) {
      // No article fetched and no dates resolved: an ineligible release can
      // never source a show, so the only fact worth keeping is why.
      releases.push({
        page: entry.page,
        name: entry.name,
        kind: section?.kind ?? 'uncatalogued',
        series: null,
        eligible: false,
        tag: null,
        dates: [],
        bonusDates: [],
        completeness: 'unknown',
        note: `not a source: ${why}`,
        musicbrainzReleaseId: null,
      });
      continue;
    }
    const kind = section?.kind ?? 'uncatalogued';
    const series = section?.series ?? null;
    const wikitext = entry.page ? text.get(entry.page) : undefined;
    const byHand = HAND_RESOLVED[entry.name];
    const principal = datesFromDateText(entry.dateText);
    const span = spanFromDateText(entry.dateText);
    let resolved = byHand
      ? { bonusDates: [], ...byHand }
      : wikitext
        ? resolveDates(wikitext, principal, span)
        : {
            dates: [],
            bonusDates: [],
            completeness: 'unknown' as const,
            note: entry.page
              ? 'article not found — resolve by hand'
              : 'no Wikipedia article — resolve by hand',
          };

    // Most releases are a single concert, and their articles carry no per-show
    // heading precisely because there is only one show to delimit. For those,
    // the discography's own date text settles it, with the infobox as backup.
    if (resolved.dates.length === 0) {
      const recorded = wikitext ? infoboxRecorded(wikitext) : [];
      const fallback = principal.length ? principal : recorded;
      if (fallback.length) {
        // Knowing *which* show is not knowing the release holds *all* of it —
        // Road Trips 4:5 is one date and a partial concert. Completeness still
        // has to come from the article saying so.
        const declared = wikitext
          ? /complete concerts?/i.test(wikitext)
          : false;
        const where = principal.length
          ? 'discography entry'
          : 'article infobox';
        resolved = {
          ...resolved,
          dates: fallback,
          completeness: declared ? 'complete' : 'unknown',
          note: declared
            ? `date from the ${where}; article says "complete concert"`
            : `date from the ${where}; completeness not stated — confirm by hand`,
        };
      }
    }

    // Applied last, so the dates keep whatever the parser derived and only the
    // completeness claim changes.
    const settled = COMPLETENESS_BY_HAND[entry.name];
    if (settled && resolved.dates.length) {
      resolved = {
        ...resolved,
        completeness: settled,
        // Drop the parser's "confirm by hand" clause — it just was.
        note: `${resolved.note.replace(/;? *completeness not stated.*$/, '')}; confirmed ${settled} by hand`,
      };
    }

    releases.push({
      page: entry.page,
      name: entry.name,
      kind,
      series,
      eligible: true,
      tag: releaseTag(
        entry.name,
        series,
        resolved.completeness,
        resolved.dates.length,
        allNames,
      ),
      ...resolved,
      musicbrainzReleaseId: null,
    });
  }
  releases.sort((a, b) =>
    (a.dates[0] ?? '9999').localeCompare(b.dates[0] ?? '9999'),
  );
  return releases;
}

function report(releases: Release[]) {
  const resolved = releases.filter((r) => r.dates.length > 0);
  const complete = releases.filter((r) => r.completeness === 'complete');
  const showDates = new Set(resolved.flatMap((r) => r.dates));
  console.log(
    `\n  resolved dates for ${resolved.length}/${releases.length} releases`,
  );
  console.log(`  ${complete.length} declare complete concerts`);
  console.log(`  ${showDates.size} distinct show dates covered`);
  // Ineligible entries have no dates by design; only eligible ones are gaps.
  const unresolved = releases.filter((r) => r.eligible && r.dates.length === 0);
  if (unresolved.length) {
    console.log(`\n  need a human (${unresolved.length}):`);
    for (const r of unresolved) console.log(`    ${r.name} — ${r.note}`);
  }
}

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? args[onlyAt + 1] : null;

const releases = await build(only);

if (draft || !existsSync(indexPath)) {
  writeFileSync(indexPath, `${JSON.stringify({ releases }, null, 2)}\n`);
  console.log(`\n✓ wrote ${releases.length} releases → data/releases.json`);
  report(releases);
  const open = releases.filter((r) => r.eligible && !r.dates.length).length;
  console.log(
    open
      ? `\nDRAFT: resolve the ${open} entries above. Prefer a HAND_RESOLVED entry in\nthis file over editing the JSON, so a re-draft reproduces the reading.`
      : '\nEvery eligible release resolved. Re-drafting overwrites the JSON, so keep\ndurable corrections in HAND_RESOLVED rather than in the file.',
  );
} else {
  const authored = (
    JSON.parse(readFileSync(indexPath, 'utf8')) as { releases: Release[] }
  ).releases;
  const byName = new Map(authored.map((r) => [r.name, r]));
  let drift = 0;
  for (const fresh of releases) {
    const mine = byName.get(fresh.name);
    if (!mine) {
      console.log(`+ new release not in the index: ${fresh.name}`);
      drift++;
      continue;
    }
    // Only flag dates Wikipedia found that the index lacks. The reverse is
    // expected: hand-resolved dates the parser can't see are the whole point.
    const missing = fresh.dates.filter((d) => !mine.dates.includes(d));
    if (missing.length) {
      console.log(`~ ${fresh.name}: Wikipedia now lists ${missing.join(', ')}`);
      drift++;
    }
  }
  console.log(
    drift ? `\n✗ ${drift} differences` : '\n✓ index matches Wikipedia',
  );
  process.exit(drift ? 1 : 0);
}
