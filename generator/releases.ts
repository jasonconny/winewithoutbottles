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
import {
  articles,
  datesFromDateText,
  infoboxRecorded,
  longDate,
  monthDayIn,
  sectionWikitext,
  slashDate,
  spanFromDateText,
} from './wiki.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'data', 'releases.json');

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
  // The Download Series, read volume by volume. The discography states a
  // principal date for each and nothing else, so every one of these came back
  // `unknown` — and `unknown` is not a reading, it's the absence of one. Each
  // note quotes the article's own words about what the volume holds.
  'Grateful Dead Download Series Volume 1': {
    dates: ['1977-04-30'],
    bonusDates: ['1977-04-29'],
    completeness: 'complete',
    note: 'article: "the complete show from April 30, 1977"; the third disc is filled out with bonus material from 4/29 at the same venue',
  },
  'Grateful Dead Download Series Volume 2': {
    dates: [],
    completeness: 'partial',
    note: 'article: "a previously uncirculated concert", never called complete; JerryBase lists songs the nine released tracks do not carry, so 1/18/70 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 3': {
    dates: ['1971-10-26'],
    completeness: 'complete',
    note: "article: \"an almost complete concert, with the exception of 'Beat It On Down the Line' which was played after 'Loser'\"; that one song is timed from the soundboard",
  },
  'Grateful Dead Download Series Volume 4': {
    dates: ['1976-06-18'],
    completeness: 'complete',
    note: 'article: "virtually all of the June 18, 1976 show"; only "Tennessee Jed" was omitted, for tape damage, and it is timed from Miller\'s outtakes transfer. Disc three\'s Philadelphia and Chicago highlights are not this show',
  },
  'Grateful Dead Download Series Volume 6': {
    dates: [],
    completeness: 'partial',
    note: 'article: "the first set closer, \'Turn On Your Lovelight\', and the entire second set" — the rest of the first set is absent, JerryBase lists the date as a partial setlist itself and no tape is catalogued, so 3/17/68 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 7': {
    dates: ['1980-09-03'],
    bonusDates: ['1980-09-04'],
    completeness: 'complete',
    note: 'article: "The first two discs feature the September 3 show, while the third disc presents the second set from the September 4 performance"; 9/4 is one set, itself missing "Samson and Delilah" and "Ramble On Rose", so it stays out of dates — 19800904 is completed from Miller\'s soundboard instead',
  },
  'Grateful Dead Download Series Volume 8': {
    dates: [],
    completeness: 'partial',
    note: 'article: "most of the concert"; five songs are omitted — Jack Straw, Tennessee Jed, El Paso and Brown-Eyed Women from the first set, Me and My Uncle from the second — and the only tape catalogued for the date is a two-track fragment, so nothing can time them and 12/10/73 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 10': {
    dates: [],
    bonusDates: ['1972-07-22'],
    completeness: 'partial',
    note: 'article: "nearly the entire concert"; the opener "Promised Land" is missing and no circulating tape carries it either — the soundboard opens with Sugaree — so 7/21/72 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 11': {
    dates: ['1991-06-20'],
    bonusDates: ['1991-06-19'],
    completeness: 'complete',
    note: 'article: "the complete show performed by the band on June 20, 1991"; discs one and three are supplemented by 6/19 tracks at the same venue',
  },
  'Grateful Dead Download Series Volume 12': {
    dates: ['1969-04-17'],
    bonusDates: ['1969-01-23'],
    completeness: 'complete',
    note: 'article: "a complete two-disc show performed by the Grateful Dead on April 17, 1969 at Washington University in St. Louis"',
  },
  'Grateful Dead Download Series: Family Dog at the Great Highway': {
    dates: [],
    bonusDates: ['1970-10-05', '1970-12-31'],
    completeness: 'partial',
    note: 'the release, the Kaplan soundboard and JerryBase disagree about 2/4/70 in every direction, so the date is held in data/unknown-setlists/; the three bonus tracks are 10/5/70 and 12/31/70 at Winterland',
  },
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
  // Mixed box, and the mix is why this is here: the parser read "17 complete
  // concerts" as a blanket "complete concerts" claim and marked all 24 dates
  // complete. The article's own breakdown is "17 complete concerts – four of
  // them with bonus tracks… / 3 recordings each compiled from two or three
  // concerts from the same run / 1 bonus cassette of a partial concert".
  //
  // Only the 17 are listed here. The seven dates behind those three composite
  // discs are dropped: their track listings read "– selections:" where all 17
  // others read "– first set:" / "– second set:" / "– encore:", and taking them
  // as whole shows yields 4- and 3-track "concerts". They remain gap-fill
  // material, not sources. The dropped dates are 1969-06-05/07/08 (Fillmore
  // West), 1971-04-25/27 (Fillmore East) and 1972-09-15/16 (Boston Music Hall);
  // the partial cassette is 1969-04-05 (Avalon Ballroom).
  'Enjoying the Ride': {
    dates: [
      '1971-02-24',
      '1973-03-16',
      '1977-03-20',
      '1978-05-13',
      '1979-08-12',
      '1980-08-23',
      '1981-03-14',
      '1981-05-01',
      '1983-08-20',
      '1984-07-13',
      '1985-11-21',
      '1987-09-16',
      '1989-07-15',
      '1989-12-27',
      '1991-05-12',
      '1993-03-17',
      '1994-10-03',
    ],
    bonusDates: ['1971-02-20', '1981-07-11', '1982-09-15', '1985-11-22'],
    completeness: 'complete',
    note: 'article: "17 complete concerts – four of them with bonus tracks from different concerts at the same venues"; the 3 composite discs (selections from 6/5–6/8/69, 4/25+4/27/71, 9/15+9/16/72) and the 4/5/69 partial cassette are excluded — selections cannot source a show whole',
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
  // A partial release of the 5/22/77 show, per Jason.
  "Dick's Picks Volume 3": 'partial',

  // ---------------------------------------------------------------------
  // Dick's Picks, all 33 volumes with unimported dates, verified 2026-08-11
  // by diffing each release against the fullest circulating soundboard
  // (`tsx generator/import.ts <id> --gaps`).
  //
  // The whole series is pinned here, including volumes the parser had already
  // called complete, because its `/complete concerts?/i` probe is demonstrably
  // unreliable on these articles: Volume 2 was marked complete and holds 6 of
  // the 21 songs played. "A regex found the phrase" and "we checked" needed to
  // stop being the same value.
  //
  // Jason's rule: only a release holding *every* song played counts as
  // complete. Anything short is partial and gets his review — which matters
  // for a highlights series that predates any house model for what a
  // Dick's Picks volume should be.
  // ---------------------------------------------------------------------

  // Verified complete: release track list matches the soundboard exactly.
  "Dick's Picks Volume 11": 'complete', // 23/23
  "Dick's Picks Volume 15": 'complete', // 19/19
  "Dick's Picks Volume 19": 'complete', // 22/22
  "Dick's Picks Volume 21": 'complete', // 22/22
  "Dick's Picks Volume 23": 'complete', // 23/23
  "Dick's Picks Volume 27": 'complete', // 18/18
  "Dick's Picks Volume 30": 'complete', // 27/27, plus 3/25 + 3/27 bonus
  "Dick's Picks Volume 32": 'complete', // 24/24
  "Dick's Picks Volume 36": 'complete', // 27/27
  // Its show is already in the corpus, so it never entered the sweep; verified
  // separately so the series has no unaudited volumes left. 20/20.
  "Dick's Picks Volume 9": 'complete',

  // Partial: a single night, but the release is short of it. Percentages are
  // songs-on-release ÷ songs-played.
  "Dick's Picks Volume 1": 'partial', // 48%
  "Dick's Picks Volume 2": 'partial', // 29% — was 'complete' from the phrase probe
  "Dick's Picks Volume 5": 'partial', // 96%, missing Space — was 'complete'
  "Dick's Picks Volume 6": 'partial', // 90%
  "Dick's Picks Volume 8": 'partial', // whole concert bar Cold Rain and Snow, per Jason
  "Dick's Picks Volume 10": 'partial', // 86%
  "Dick's Picks Volume 13": 'partial', // 95%
  "Dick's Picks Volume 16": 'partial', // 86%
  "Dick's Picks Volume 17": 'partial', // 86%
  "Dick's Picks Volume 24": 'partial', // 57%
  "Dick's Picks Volume 34": 'partial', // 95%

  // Partial: two nights, each well represented but neither whole.
  "Dick's Picks Volume 20": 'partial', // 91% / 86%
  "Dick's Picks Volume 25": 'partial', // 85% / 82%
  "Dick's Picks Volume 28": 'partial', // 73% / 94%
  "Dick's Picks Volume 33": 'partial', // 94% / 92%
  // Both shows are already in the corpus (Jason's 2013 Spring '77 work), so it
  // never entered the sweep. 5/19 is whole at 19/19, but 5/21 is missing
  // U.S. Blues — so the release is partial even though one of its nights is not.
  "Dick's Picks Volume 29": 'partial',

  // Partial, and *too diffuse to attribute*: several nights at one venue with
  // the tracks jumbled between them, so no night can be reconstructed from the
  // release at all. Either the article gives no per-night attribution, or it
  // does and every night still comes back far short — the signature of a
  // compilation rather than a release missing a few songs. These need manual
  // work; do not try to source a show from them.
  "Dick's Picks Volume 4": 'partial', // Fillmore East, 2 nights, no attribution
  "Dick's Picks Volume 7": 'partial', // 3 nights: 28% / 36% / 15%
  "Dick's Picks Volume 12": 'partial', // 2 nights: 30% / 52%
  "Dick's Picks Volume 14": 'partial', // 2 nights: 59% / 48%
  "Dick's Picks Volume 18": 'partial', // 2 nights, no attribution
  "Dick's Picks Volume 22": 'partial', // 2 nights, and no tape catalogued either
  "Dick's Picks Volume 26": 'partial', // 2 nights, no attribution
  "Dick's Picks Volume 31": 'partial', // 3 nights: 42% / 50% / 17%
  "Dick's Picks Volume 35": 'partial', // 3 nights, no attribution
};

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

  // Year-less headings ("June 12 – First set:") need a window to resolve
  // against. When the discography has named the principal date, that window is
  // a single day, which is too narrow to see the release's bonus material —
  // Road Trips 4:5 is a 6/9/76 concert whose third disc also carries 6/12.
  // Widen to the whole year so those dates resolve and land in bonusDates.
  const resolveSpan = principal.length
    ? {
        first: `${principal[0].slice(0, 4)}-01-01`,
        last: `${principal[principal.length - 1].slice(0, 4)}-12-31`,
      }
    : span;

  const add = (line: string, date: string | null) => {
    if (!date) return;
    // The span fences out dates belonging to neighbouring releases — but only
    // when the article's own headings are what's establishing the show list.
    // Once the discography has named the principal date, the span collapses to
    // that single day, and fencing on it would throw away exactly the bonus
    // headings worth recording: Dave's Picks 28 is one 6/17/76 concert whose
    // last two tracks come from 6/23 and 6/28.
    if (!principal.length && span && (date < span.first || date > span.last)) {
      return;
    }
    candidates.add(date);
    // "Bonus tracks – March 24, 1990" is material from a show the release does
    // not otherwise contain: usable for gap-filling, never as a whole show.
    if (/bonus|previously released/i.test(line)) flaggedBonus.add(date);
  };

  for (const line of wikitext.split('\n')) {
    const before = candidates.size;
    const heading = line.match(/^=+(.*?)=+\s*$/);
    if (heading) {
      add(
        line,
        slashDate(heading[1]) ??
          longDate(heading[1]) ??
          monthDayIn(heading[1], resolveSpan),
      );
      if (candidates.size > before) methods.push('heading');
      continue;
    }
    // Italic sub-heading inside a track listing.
    const sub = line.match(/^:+''(.+?)''/);
    if (sub) {
      add(
        line,
        longDate(sub[1]) ??
          slashDate(sub[1]) ??
          monthDayIn(sub[1], resolveSpan),
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
          monthDayIn(strong[1], resolveSpan),
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
    //
    // Never for a hand-resolved release, though: there, empty `dates` is a
    // reading rather than a parser failure — the release's one date is held in
    // unknown-setlists or partial-shows and is deliberately not sourceable.
    // Letting the fallback fill it back in silently undid five of the Download
    // Series corrections.
    if (!byHand && resolved.dates.length === 0) {
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
