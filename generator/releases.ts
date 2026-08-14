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
 * That was advice, and advice lost. Twenty-seven entries were hand-edited
 * straight into the JSON and a `--draft` reverted every one: twelve Dick's Picks
 * volumes reviewed against the tapes and upgraded to complete, five date splits
 * no parser derives, ten notes recording *why*. Nothing warned, because VERIFY
 * only compared `dates`, and only in the direction of "Wikipedia found something
 * new". So the advice is now a mechanism:
 *
 *   - a note ending "; confirmed <completeness> by hand" marks a settled reading,
 *     and the suffix is appended automatically to anything in HAND_RESOLVED;
 *   - `--draft` refuses to write if it cannot reproduce one of those readings,
 *     naming each field it would change. `--force` overrides, deliberately;
 *   - VERIFY reports the same set as maintenance debt, without failing on it;
 *   - `--draft --only` merges into the index rather than replacing it with the
 *     subset it just built.
 *
 * The invariant to preserve: **a draft over an up-to-date index is a no-op.**
 * If it isn't, something in the file is a judgement the tool can't rederive, and
 * it belongs in HAND_RESOLVED.
 *
 * Sources: the MediaWiki API only. Wikipedia's own sectioning decides
 * eligibility (see SECTIONS), and each release's article supplies the dates.
 * jerrybase is deliberately not consulted — its robots.txt disallows automated
 * agents, so it stays a manual reference.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  byFirstDate,
  COMPLETENESS_BY_HAND,
  CONFIRMABLE,
  CONFIRMED,
  HAND_RESOLVED,
  stripPending,
} from './hand-readings.ts';
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
    // A hand reading that pins `dates` replaces the parser outright; one that
    // doesn't lets the parser run and is overlaid further down, so the dates it
    // derives stay under drift detection.
    let resolved: {
      dates: string[];
      bonusDates: string[];
      completeness: Release['completeness'];
      note: string;
    } = byHand?.dates
      ? {
          bonusDates: [],
          completeness: 'unknown',
          ...byHand,
          dates: byHand.dates,
        }
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
    if (!byHand?.dates && resolved.dates.length === 0) {
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
        note: `${stripPending(resolved.note)}; confirmed ${settled} by hand`,
      };
    }

    // A hand reading overrides everything above it, field by field, so an entry
    // that pins only `completeness` keeps the parser's dates and its note. This
    // has to run after COMPLETENESS_BY_HAND: where the two disagree the hand
    // reading is the later and better-evidenced one — twelve Dick's Picks
    // volumes were reviewed song-by-song against the tapes and upgraded to
    // complete while that map still held the earlier blanket verdict.
    if (byHand) {
      const completeness = byHand.completeness ?? resolved.completeness;
      resolved = {
        ...resolved,
        ...(byHand.bonusDates ? { bonusDates: byHand.bonusDates } : {}),
        completeness,
        note: `${stripPending(byHand.note)}; confirmed ${completeness} by hand`,
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
  releases.sort(byFirstDate);
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
  // Nor is a hand-resolved empty: those releases were read and found to source
  // no show whole, so asking a human to resolve them again is asking twice.
  const unresolved = releases.filter(
    (r) => r.eligible && r.dates.length === 0 && !CONFIRMED.test(r.note),
  );
  if (unresolved.length) {
    console.log(`\n  need a human (${unresolved.length}):`);
    for (const r of unresolved) console.log(`    ${r.name} — ${r.note}`);
  }
}

/**
 * Every hand-confirmed reading in the authored index that a draft would not
 * reproduce — i.e. everything about to be silently thrown away.
 *
 * This exists because the file said "keep durable corrections in HAND_RESOLVED"
 * and twenty-seven entries didn't: they were hand-edited straight into the JSON,
 * and a `--draft` reverted the lot. Nothing announced it, because the verify
 * pass only ever compared `dates` in one direction, so twenty-four of the
 * twenty-seven were invisible to it as well.
 */
function unreproduced(fresh: Release[], authored: Release[]) {
  const byName = new Map(fresh.map((r) => [r.name, r]));
  const lost: { name: string; field: string; was: unknown; now: unknown }[] =
    [];
  for (const mine of authored) {
    if (!CONFIRMED.test(mine.note)) continue;
    const now = byName.get(mine.name);
    // Under `--only` the build is a deliberate subset; absence isn't loss.
    if (!now) {
      if (!only)
        lost.push({
          name: mine.name,
          field: 'entry',
          was: 'present',
          now: 'gone',
        });
      continue;
    }
    for (const field of CONFIRMABLE) {
      const was = JSON.stringify(mine[field]);
      const next = JSON.stringify(now[field]);
      if (was !== next)
        lost.push({
          name: mine.name,
          field,
          was: mine[field],
          now: now[field],
        });
    }
  }
  return lost;
}

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const force = args.includes('--force');
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? args[onlyAt + 1] : null;

const releases = await build(only);

if (draft || !existsSync(indexPath)) {
  const authored = existsSync(indexPath)
    ? (JSON.parse(readFileSync(indexPath, 'utf8')) as { releases: Release[] })
        .releases
    : [];
  const lost = unreproduced(releases, authored);
  if (lost.length && !force) {
    console.log(
      `\n✗ refusing to draft: ${lost.length} hand-confirmed value(s) would be lost\n`,
    );
    for (const { name, field, was, now } of lost)
      console.log(
        `  ${name}\n      ${field}: ${JSON.stringify(was)}\n${' '.repeat(6 + field.length + 2)}→ ${JSON.stringify(now)}`,
      );
    console.log(
      '\nEach of these is a judgement the draft cannot rederive. Move it into\n' +
        'HAND_RESOLVED in this file so the draft reproduces it, then re-run.\n' +
        'Pass --force only to discard them deliberately.',
    );
    process.exit(1);
  }
  // Under `--only` the build covers just the matching releases, so write those
  // over the authored index rather than replacing it with the subset.
  const rebuilt = new Set(releases.map((r) => r.name));
  const merged = only
    ? [...authored.filter((a) => !rebuilt.has(a.name)), ...releases].sort(
        byFirstDate,
      )
    : releases;
  writeFileSync(
    indexPath,
    `${JSON.stringify({ releases: merged }, null, 2)}\n`,
  );
  console.log(`\n✓ wrote ${releases.length} releases → data/releases.json`);
  report(releases);
  // Same test `report` uses: a hand-resolved empty is an answer, not a gap.
  const open = releases.filter(
    (r) => r.eligible && !r.dates.length && !CONFIRMED.test(r.note),
  ).length;
  console.log(
    open
      ? `\nDRAFT: resolve the ${open} entries above. Put each reading in HAND_RESOLVED in\nthis file, not in the JSON — a draft refuses to overwrite what it can't rederive.`
      : '\nEvery eligible release resolved, and this draft reproduced every\nhand-confirmed reading — a draft over an up-to-date index is a no-op.',
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

  // A second, different question: not "has Wikipedia changed?" but "would a
  // draft still produce this file?". Comparing dates alone answered the first
  // and missed twenty-four entries whose completeness, bonus dates or note the
  // build no longer derives — every one of them a silent revert waiting for the
  // next `--draft`. Reported rather than fatal: an unreproduced value is a
  // maintenance debt in this file, not a fact about the world being wrong.
  const stale = unreproduced(releases, authored);
  if (stale.length) {
    console.log(
      `\n! ${stale.length} hand-confirmed value(s) a --draft would not reproduce:`,
    );
    for (const { name, field } of stale) console.log(`    ${name} — ${field}`);
    console.log(
      '  Move each into HAND_RESOLVED so the draft rederives it. Until then\n' +
        '  --draft refuses to run without --force.',
    );
  }

  console.log(
    drift ? `\n✗ ${drift} differences` : '\n✓ index matches Wikipedia',
  );
  process.exit(drift ? 1 : 0);
}
