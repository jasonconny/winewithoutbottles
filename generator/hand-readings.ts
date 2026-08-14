/**
 * The hand-settled half of the release index, kept pure and separate so both
 * the index builder (`releases.ts`) and `tests/releases-index.test.ts` can use
 * it. Importing `releases.ts` would run its top-level fetch, so these cannot
 * live there — the same reason `release-tag.ts` exists.
 *
 * Everything here answers one question: **what did a human decide that the
 * parser cannot work out for itself?** The test's job is to check that every
 * such decision recorded in `data/releases.json` is backed by an entry here, so
 * that a `--draft` reproduces the file instead of quietly reverting it.
 */
import type { Completeness } from './release-tag.ts';

/** The subset of a release entry the sort and the guard need. */
export interface Sortable {
  name: string;
  dates: string[];
}

/**
 * Releases whose series is not the section Wikipedia files them under.
 *
 * The two "Road Trips Full Show" downloads sit in the discography's *Download
 * Series* section, accurately enough — they were digital releases continuing
 * that stream. But they exist **because of** Road Trips, not beside it: Road
 * Trips Volume 1 Number 1 was a highlights compilation, deadheads are vocal
 * about wanting whole shows, and these two full-show downloads were the answer
 * to that complaint. The 11/6/79 article says as much — "a spin-off of the Road
 * Trips series", and "a full show from the same tour as that release". Nobody
 * looking for a Road Trips show goes hunting under Download Series.
 *
 * The **series** is what moves, not just the tag. A release's tag is its series
 * — `tests/data-validity.test.ts` pins exactly that — so overriding the tag
 * alone would leave one tag spanning two series and break the rule that says a
 * tag page has a single owner. Jason's call, 2026-08-14.
 */
export const HAND_SERIES: Record<string, string> = {
  'Road Trips Full Show: Spectrum 11/5/79': 'Road Trips',
  'Road Trips Full Show: Spectrum 11/6/79': 'Road Trips',
};

/**
 * The marker that says a human settled this entry, and the fields their
 * judgement can live in. `--draft` refuses to overwrite any of these without
 * reproducing them; see the guard at the bottom of the file.
 */
export const CONFIRMED =
  /;\s*confirmed (?:complete|partial|unknown) by hand\s*$/;
export const CONFIRMABLE = [
  'dates',
  'bonusDates',
  'completeness',
  'note',
] as const;

/** Drop the parser's "completeness not stated — confirm by hand" clause. */
export const stripPending = (note: string) =>
  note.replace(/;? *completeness not stated.*$/, '').replace(CONFIRMED, '');

/**
 * Recording order, name-tiebroken so it is a **total** order.
 *
 * The tiebreak isn't cosmetic. Dozens of entries share a first date or have none
 * at all, and a stable sort leaves those ties in whatever order the array
 * arrived in — which differs between a full draft and an `--only` merge, since
 * the merge appends its rebuilt entries before sorting. Without this, a
 * one-release `--only` reordered the file and buried the actual change in
 * hundreds of lines of churn, which is precisely what `--only` exists to avoid.
 */
export const byFirstDate = (a: Sortable, b: Sortable) =>
  (a.dates[0] ?? '9999').localeCompare(b.dates[0] ?? '9999') ||
  a.name.localeCompare(b.name);

/**
 * Every reading a human settled that the parser can't reach on its own — the
 * one place a durable correction belongs.
 *
 * Most entries are here because the release's shows are stated only in article
 * prose, which the parser deliberately doesn't mine (scanning free text for
 * dates picks up neighbouring releases and chart trivia). Each is read off the
 * article's own lead, quoted in the note, so a re-draft reproduces the reading
 * instead of reverting to "resolve by hand".
 *
 * **Every field but `note` is optional, and that is the point.** An entry pins
 * only what a human actually settled and leaves the rest to the parser:
 *
 *   - `dates` present  → the parser's date resolution is bypassed entirely, and
 *     so is the single-date fallback below. An empty array is a *reading* — the
 *     release's one date is held in unknown-setlists or partial-shows and is
 *     deliberately not sourceable.
 *   - `dates` absent   → the parser resolves dates as usual and stays subject to
 *     drift detection against Wikipedia, while `bonusDates` / `completeness` /
 *     `note` are overlaid on top. Pinning dates that the parser already gets
 *     right would freeze them, turning "verify against Wikipedia" into "verify
 *     against ourselves".
 *
 * `partial` is load-bearing: a release covering several nights with *selections*
 * from each can gap-fill a show but can never source one whole, and it earns no
 * tag.
 *
 * The note is stored *without* the trailing "; confirmed <completeness> by
 * hand" — being in this table is what makes a reading hand-confirmed, so the
 * suffix is appended when the index is built. That suffix is also the marker
 * `--draft` looks for when it checks that it is not about to discard somebody's
 * judgement; see the guard at the bottom of this file.
 */
export const HAND_RESOLVED: Record<
  string,
  {
    dates?: string[];
    bonusDates?: string[];
    completeness?: Completeness;
    note: string;
  }
> = {
  // Dick's Picks, migrated out of data/releases.json (2026-08-14). These
  // readings were hand-edited straight into the JSON, where a --draft would
  // silently revert them: twelve had been reviewed and upgraded to complete
  // after their missing songs were restored from tapes, while
  // COMPLETENESS_BY_HAND still held the earlier "anything short is partial"
  // verdict, and five carried date splits no parser derives. Each pins only
  // the fields that differ from what the article yields.
  "Dick's Picks Volume 10": {
    completeness: 'complete',
    note: "principal date from the discography; the release holds 21 of the night's 24 songs and 19771229 restores It Must Have Been the Roses, Sunrise and Space from the soundboard; the bonus tracks are from 1977-12-30",
  },
  "Dick's Picks Volume 13": {
    completeness: 'complete',
    note: 'principal date from the discography; article: "contains the complete show recorded on May 6, 1981"; the 1979-11-01 hidden tracks are the bonus date',
  },
  "Dick's Picks Volume 16": {
    completeness: 'complete',
    note: "principal date from the discography; the article claims nothing either way, but the release's 22 tracks contain every song on the fullest circulating tape and ten it lacks, so it carries the whole night; one bonus song is from 1969-11-07",
  },
  "Dick's Picks Volume 17": {
    completeness: 'complete',
    note: 'principal date from the discography; the article makes no completeness claim, but lists a full first set, second set and encore, plus two 1991-03-31 bonus tracks',
  },
  "Dick's Picks Volume 20": {
    completeness: 'complete',
    note: 'dates from heading. The article says "the majority of the concerts", and against the soundboards that comes to one missing song on 9/25 and two on 9/28, each restored from the tape. Several tracks carry patches from 1976-10-01 and 1976-10-09, and Dancing in the Streets has a verse excised',
  },
  "Dick's Picks Volume 21": {
    bonusDates: ['1980-09-02'],
    note: 'principal date from the discography; article says "complete concert", plus bonus tracks from 1980-09-02, Community War Memorial, Rochester',
  },
  "Dick's Picks Volume 22": {
    dates: [],
    bonusDates: ['1968-02-23', '1968-02-24'],
    note: 'dates from bold; article: "documents portions of the concerts" at the Kings Beach Bowl, and nothing circulates for either night, so neither date can be sourced whole or ever completed — both are staged in data/unknown-setlists/',
    completeness: 'partial',
  },
  "Dick's Picks Volume 23": {
    note: 'principal date from the discography; article says "complete concert, except for the encore" \u2014 the One More Saturday Night encore is on no disc, so 19720917 takes it from an AUD tape',
  },
  "Dick's Picks Volume 27": {
    bonusDates: ['1992-12-17'],
    note: "principal date from the discography; the article's four closing tracks are bonus material from 1992-12-17",
  },
  "Dick's Picks Volume 28": {
    dates: ['1973-02-28'],
    bonusDates: ['1973-02-26'],
    completeness: 'complete',
    note: 'dates from heading. 1973-02-28 is the whole show bar Promised Land, which 19730228 takes from the soundboard; 1973-02-26 is selections (19 of 26 songs) so it stays out of dates. Some tracks carry patches from 1973-02-22 and 1973-06-29',
  },
  "Dick's Picks Volume 33": {
    completeness: 'complete',
    note: 'dates from subheading; article: "two consecutive complete shows, recorded on October 9 and October 10, 1976"',
  },
  "Dick's Picks Volume 34": {
    completeness: 'complete',
    note: 'principal date from the discography; article: "the complete show recorded on November 5, 1977, at the Community War Memorial", plus 1977-11-02 Seneca College bonus tracks',
  },
  "Dick's Picks Volume 35": {
    dates: ['1971-08-07'],
    bonusDates: ['1971-08-06'],
    completeness: 'complete',
    note: 'article: "the complete shows recorded on August 7, 1971, at Golden Hall ... and on August 24, 1971, at the Auditorium Theatre"; 1971-08-06 (Hollywood Palladium) is bonus tracks only. 1971-08-24 is also out of dates despite the article\'s claim: per JerryBase the tape came from Keith Godchaux\'s houseboat and only the salvageable part was released, nothing else circulates, and DeadBase 50 orders the songs differently \u2014 so it is a fragment, not a sourceable show (see data/unknown-setlists/19710824.json)',
  },
  "Dick's Picks Volume 5": {
    completeness: 'complete',
    note: 'principal date from the discography; article: "the first of the Dick\'s Picks to contain a complete concert"',
  },
  "Dick's Picks Volume 6": {
    completeness: 'complete',
    note: 'principal date from the discography; article: "contains the complete show from that night"',
  },
  "Dick's Picks Volume 8": {
    completeness: 'complete',
    note: "principal date from the discography; article: \"the entire concert, except for one song \u2014 Cold Rain and Snow, which was played between Good Lovin' and It's a Man's Man's Man's World\" (the show takes that one timing from the DP 8 outtake on archive.org); the article also notes the first two verses of St. Stephen are missing from the tape",
  },

  // Road Trips, the partial half. Every volume below holds pieces of its nights
  // rather than whole ones, so each date leaves `dates` and is staged in
  // data/partial-shows/ instead — that absence is what records it as
  // unsourceable. `bonusDates` keeps the dates a volume touches only as bonus
  // material, which is a different claim and worth keeping.
  'Road Trips Volume 1 Number 2': {
    dates: [],
    bonusDates: ['1977-10-07', '1977-10-11', '1977-10-14', '1977-10-16'],
    completeness: 'partial',
    note: 'article: "material from four different concerts" across two discs, attributed per track — 10/7, 10/11, 10/14 and 10/16/77, none of them whole (4, 5, 6 and 11 songs of 10, 17, 21 and 19 played). All four are staged in data/partial-shows/',
  },
  'Road Trips Volume 1 Number 3': {
    dates: [],
    bonusDates: ['1971-07-31', '1971-08-04', '1971-08-06', '1971-08-23'],
    completeness: 'partial',
    note: 'article: disc one is 7/31/71 Yale Bowl and disc two 8/23/71 Auditorium Theatre — one disc each of shows that ran 27 and 31 songs, so neither is whole; both are staged in data/partial-shows/. The bonus disc holds 8/6/71 Hollywood Palladium and 8/4/71 Terminal Island, which is why those two are bonus dates and not staged at all',
  },
  'Road Trips Volume 1 Number 4': {
    dates: [],
    bonusDates: ['1978-10-17', '1978-10-21', '1978-10-22'],
    completeness: 'partial',
    note: 'article: disc one is 10/21/78 and disc two 10/22/78, a disc each of two Winterland nights, so neither is whole; both are staged in data/partial-shows/. The bonus disc adds more 10/21 plus 10/17/78',
  },
  'Road Trips Volume 2 Number 3': {
    dates: [],
    bonusDates: ['1974-06-16', '1974-06-18'],
    completeness: 'partial',
    note: 'article: recorded 6/16/74 Des Moines and 6/18/74 Louisville across two discs, with a bonus disc drawn from the same two nights — 13 and 11 songs against 28 and more played, so neither night is whole. Both staged in data/partial-shows/',
  },
  'Road Trips Volume 2 Number 4': {
    dates: [],
    bonusDates: ['1993-05-26', '1993-05-27'],
    completeness: 'partial',
    note: 'article: recorded 5/26/93 and 5/27/93 at Cal Expo across two discs plus a bonus disc from the same two nights. 5/26 is close — 16 of the 18 played — and 5/27 is not, at 11 of 20; both staged in data/partial-shows/',
  },
  'Road Trips Volume 3 Number 3': {
    dates: [],
    bonusDates: ['1970-05-14', '1970-05-15'],
    completeness: 'partial',
    note: 'article: billed as a Workingman\'s Dead anniversary set, "several versions, some acoustic and some electric, of seven of the eight songs that appear on that album" — a compilation shape, not a concert. Its 5/15/70 Fillmore East material is an early and a late show, staged separately as 1970051501 and 1970051502; the bonus disc is 5/14/70 Meramec Community College',
  },
  'Road Trips Volume 3 Number 4': {
    dates: [],
    bonusDates: ['1980-05-06', '1980-05-07'],
    completeness: 'partial',
    note: 'article: recorded 5/6/80 Penn State and 5/7/80 Barton Hall, three discs, and never called complete — 19 and 13 songs against 24 and 20 played. Both staged in data/partial-shows/',
  },
  'Road Trips Volume 4 Number 2': {
    dates: ['1988-04-01'],
    bonusDates: ['1988-03-31'],
    completeness: 'complete',
    note: 'article: "includes the complete April 1 concert, along with the second set, encore, and two songs from the first set of the March 31 concert" — so 4/1/88 is sourceable whole and 3/31/88 is not, and the latter is staged in data/partial-shows/',
  },

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
    note: 'article: "a previously uncirculated concert", never called complete; JerryBase lists songs the nine released tracks do not carry, and the band played a two-set show at the same venue on 1/16/70, so 1/18/70 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 3': {
    dates: ['1971-10-26'],
    completeness: 'complete',
    note: "article: \"an almost complete concert, with the exception of 'Beat It On Down the Line' which was played after 'Loser'\"; 19711026 restores that one song from the soundboard",
  },
  'Grateful Dead Download Series Volume 4': {
    dates: ['1976-06-18'],
    completeness: 'complete',
    note: 'article: "virtually all of the June 18, 1976 show"; only Tennessee Jed was omitted, for tape damage, and 19760618 restores it from Miller\'s outtakes transfer. Disc three\'s Philadelphia and Chicago highlights are not this show',
  },
  'Grateful Dead Download Series Volume 6': {
    dates: [],
    completeness: 'partial',
    note: 'article: the release holds "the first set closer, \'Turn On Your Lovelight\', and the entire second set" — the rest of the first set is absent, JerryBase lists the date as a partial setlist itself and no tape is catalogued, so 3/17/68 is held in data/unknown-setlists/',
  },
  'Grateful Dead Download Series Volume 7': {
    dates: ['1980-09-03'],
    bonusDates: ['1980-09-04'],
    completeness: 'complete',
    note: 'article: "The first two discs feature the September 3 show, while the third disc presents the second set from the September 4 performance"; 9/4 is one set, itself missing Samson and Delilah and Ramble On Rose, so it stays out of dates — 19800904 is completed from Miller\'s soundboard instead',
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
    note: 'article: "nearly the entire concert"; the opener Promised Land is missing and no circulating tape carries it either — the soundboard opens with Sugaree — so 7/21/72 is held in data/unknown-setlists/; the bonus tracks are from 1972-07-22',
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
    note: 'the release, the Kaplan soundboard and JerryBase disagree about 2/4/70 in every direction — JerryBase opens with Cold Rain and Snow, which is on no tape — so the date is held in data/unknown-setlists/; the three bonus tracks are 10/5/70 and 12/31/70 at Winterland',
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
export const COMPLETENESS_BY_HAND: Record<string, Completeness> = {
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
