import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { cleanTitle, isValidDuration, parseShowId } from '@/wwob';
import type { ShowFile } from '@/wwob';
import { shows } from '@/data/shows.generated';
import { buildRuns } from '@/galleries';
import { releaseTag } from '../generator/release-tag';
import type { Completeness } from '../generator/release-tag';

// Show data is hand-authored, so the guard here is *validity*, not fidelity to
// the original art. The authored data is the source of truth and is freely
// editable for corrections; these tests just keep it well-formed and the
// generated manifest in sync with it.

const DATA_DIR = 'data/shows';
/** The `date` field stays ISO for display and sorting: 1972-08-27. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The id ↔ date contract, in one place because three directories check it.
 * An id is the date compacted (19720827), plus a two-digit ordinal on the dates
 * that carry two shows (1970021301) — see src/wwob/showId.ts. `parseShowId`
 * returns undefined for anything not id-shaped, so this covers both the shape
 * and the derivation in one assertion.
 */
function expectIdMatchesDate(show: ShowFile, file: string): void {
  expect(show.date).toMatch(DATE_RE);
  expect(
    parseShowId(show.id)?.date,
    `${file}: id "${show.id}" is not "${show.date.replaceAll('-', '')}" with an optional two-digit ordinal`,
  ).toBe(show.date);
  expect(`${show.id}.json`).toBe(basename(file));
}

/** `sitting`, where authored, is one of the two performances of a night. */
const SITTINGS = ['early', 'late'];

/** Setlist titles that earn a show the `Dark Star` tag — see the guard below. */
const DARK_STAR_TITLES = ['Dark Star', 'Dark Star Jam'];

/**
 * The `Playing Palindrome`: Playing in the Band opens a second-set sequence that
 * turns around on Morning Dew and comes back out the way it went in. Must appear
 * as five *consecutive* songs — the same five titles scattered through a setlist
 * are not the thing.
 */
const PLAYING_PALINDROME = [
  'Playing in the Band',
  "Uncle John's Band",
  'Morning Dew',
  "Uncle John's Band",
  'Playing in the Band',
];

function hasPlayingPalindrome(show: ShowFile): boolean {
  const titles = show.songs.map((song) => song.title);
  return titles.some((_, start) =>
    PLAYING_PALINDROME.every(
      (title, offset) => titles[start + offset] === title,
    ),
  );
}

/** Wall of Sound era: debut at the Cow Palace → last night at Winterland. */
const WALL_OF_SOUND_FIRST = '1974-03-23';
const WALL_OF_SOUND_LAST = '1974-10-20';

function dataFiles(): string[] {
  // Recursive: shows live in data/shows/<year>/<id>.json subdirectories.
  return (readdirSync(DATA_DIR, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.json'))
    .sort();
}

const releases = (
  JSON.parse(readFileSync('data/releases.json', 'utf8')) as {
    releases: {
      name: string;
      series: string | null;
      eligible: boolean;
      tag: string | null;
      dates: string[];
      bonusDates: string[];
      completeness: Completeness;
      note: string;
    }[];
  }
).releases;

function readShow(file: string): ShowFile {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as ShowFile;
}

/**
 * Does this release's date set exactly match a grouping the galleries already
 * derive — a tour, or a run?
 *
 * Such a release grants no show tag: its index page would list precisely the
 * shows that gallery already lists, so the tag is a duplicate rather than a
 * grouping.
 *
 * **Tours** were the first case: Europe '72 covers all 22 shows of the Europe
 * 1972 tour and nothing besides. **Runs** are the second, and they arrived by
 * collision rather than by reasoning — `Winterland June 1977: The Complete
 * Recordings` holds 6/7, 6/8 and 6/9/77, which are also a run at one venue on
 * consecutive nights, so the derived run and the release tag were both named
 * `Winterland June 1977` and both slugified to `winterland-june-1977`. The
 * registry's duplicate-slug guard threw, which is how it surfaced.
 *
 * Derived from the corpus rather than hard-coded, so it keeps up: a release
 * growing a date beyond its run, or a run gaining a show the release lacks,
 * stops being an exact cover and the tag starts being required.
 */
function coversExactlyOneGrouping(dates: string[]): boolean {
  if (!dates.length) return false;
  const shows = dataFiles().map(
    (file) => readShow(file) as { tour?: string; date: string; id: string },
  );
  const groups: Set<string>[] = [];
  const byTour = new Map<string, Set<string>>();
  for (const show of shows) {
    if (!show.tour) continue;
    byTour.set(
      show.tour,
      (byTour.get(show.tour) ?? new Set<string>()).add(show.date),
    );
  }
  groups.push(...byTour.values());
  // Runs come from the same function the galleries use, so the two can't drift.
  for (const run of buildRuns(
    shows.map((show) => ({ ...show, durationSeconds: 0 })) as never,
  ))
    groups.push(new Set(run.shows.map((show) => show.date)));

  const set = new Set(dates);
  return groups.some(
    (group) =>
      group.size === set.size && [...group].every((date) => set.has(date)),
  );
}

describe('show data is well-formed', () => {
  const files = dataFiles();

  it('has at least one show', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is valid', (file) => {
    const show = readShow(file);

    // id present, well-formed, derived from the date, matching its filename.
    expectIdMatchesDate(show, file);
    expect(show.venue?.trim()).toBeTruthy();

    // non-empty setlist with valid songs.
    expect(Array.isArray(show.songs)).toBe(true);
    expect(show.songs.length).toBeGreaterThan(0);
    for (const song of show.songs) {
      expect(song.title?.trim()).toBeTruthy();
      expect(
        isValidDuration(song.duration),
        `${file}: bad duration "${song.duration}" for "${song.title}"`,
      ).toBe(true);
    }
  });

  it('has no duplicate ids', () => {
    const ids = files.map((f) => readShow(f).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(files)('%s declares a real sitting, if any', (file) => {
    const { sitting } = readShow(file);
    if (sitting === undefined) return;
    expect(
      SITTINGS,
      `${file}: sitting "${sitting}" is not one of ${SITTINGS.join('/')}`,
    ).toContain(sitting);
  });

  it('dates with two shows carry ordinals and sittings; lone dates carry neither', () => {
    // The whole early/late contract, in one place, because every part of it is
    // a statement about a *date* rather than about one file.
    //
    // The id's two-digit ordinal is only ever a collision-breaker: it exists so
    // two shows on one night can have two URLs, and it means nothing else. The
    // fact it breaks a tie on — which performance this was — lives in
    // `sitting`, which is why a lone show can carry `sitting` with a plain
    // 8-digit id (a date whose early tape is lost still has a knowable late
    // show) but must never carry an ordinal with nothing to be ordinal to.
    const byDate = new Map<string, ShowFile[]>();
    for (const file of files) {
      const show = readShow(file);
      byDate.set(show.date, [...(byDate.get(show.date) ?? []), show]);
    }

    for (const [date, dateShows] of byDate) {
      const ordinals = dateShows.map((show) => parseShowId(show.id)?.ordinal);

      if (dateShows.length === 1) {
        expect(
          ordinals[0],
          `${dateShows[0].id}: only show on ${date}, so it must not carry an ordinal`,
        ).toBeUndefined();
        continue;
      }

      // Contiguous 1..N, so the ids say how many shows the night had. A gap
      // would read as a missing sibling that isn't coming.
      expect(
        [...ordinals].sort((a, b) => (a ?? 0) - (b ?? 0)),
        `${date}: has ${dateShows.length} shows, so their ids must end 01..${String(dateShows.length).padStart(2, '0')}`,
      ).toEqual(dateShows.map((_, index) => index + 1));

      // Two performances is a thing you know about a night, not a thing you
      // discover later — if the corpus has both, it knows which was which.
      for (const show of dateShows) {
        expect(
          show.sitting,
          `${show.id}: shares ${date} with another show, so it needs a sitting`,
        ).toBeDefined();
      }

      // Ordinal order must agree with the order the night ran, or the gallery
      // rows and the run listing put the late show first.
      const byOrdinal = [...dateShows].sort(
        (showA, showB) =>
          (parseShowId(showA.id)?.ordinal ?? 0) -
          (parseShowId(showB.id)?.ordinal ?? 0),
      );
      expect(
        byOrdinal.map((show) => show.sitting),
        `${date}: ordinals disagree with the sittings — early comes first`,
      ).toEqual(SITTINGS.slice(0, dateShows.length));
    }
  });
});

describe('tags stay an editorial vocabulary', () => {
  const files = dataFiles();

  it.each(files)('%s carries no retired `collection` field', (file) => {
    // Retired in favour of derived facets (year/tour/venue/run) plus tags —
    // it was single-valued, so it forced a "what wins?" choice that the
    // many-to-many facets never have to make.
    expect('collection' in readShow(file)).toBe(false);
  });

  it.each(files)('%s tags restate no other field', (file) => {
    const show = readShow(file);
    for (const tag of show.tags ?? []) {
      // A year tag duplicates `date`, which already drives the year galleries.
      expect(tag, `${file}: "${tag}" is a year — `).not.toMatch(/^\d{4}$/);
      // Place/tour tags duplicate a field that already groups the show. Runs
      // are derived (src/galleries.ts), so venue-shaped tags earn nothing.
      expect(
        show.venue?.includes(tag) || show.city === tag || show.tour === tag,
        `${file}: tag "${tag}" restates venue/city/tour`,
      ).toBe(false);
    }
  });

  it.each(files)('%s has no duplicate tags', (file) => {
    const tags = readShow(file).tags ?? [];
    expect(new Set(tags).size).toBe(tags.length);
  });

  it.each(files)('%s tags Dark Star iff it played it', (file) => {
    // The one derivable tag we keep by hand. `Dark Star` is a special case —
    // the song the project is built around — rather than the start of a
    // per-song facet, so it stays authored; this guard is what stops it
    // drifting out of sync when a setlist is corrected. Song indexes, if they
    // ever happen, would supersede it.
    //
    // Once per show, not once per performance: 9 shows play it twice (the
    // post-drums reprise) and still carry exactly one tag.
    //
    // `Dark Star Jam` counts too (Jason, 2026-08-13). The tag asks whether the
    // band went to Dark Star that night, and on 1973-11-30 they went there
    // without singing it — the jam is the thing, not a lesser version of it.
    // Listed explicitly rather than matched on a `Dark Star` prefix, so a new
    // variant fails here until it is admitted deliberately, the same friction
    // data/songs.json applies to titles.
    const show = readShow(file);
    const played = show.songs.some((song) =>
      DARK_STAR_TITLES.includes(song.title),
    );
    const tagged = (show.tags ?? []).includes('Dark Star');
    expect(
      tagged,
      played
        ? `${file}: plays Dark Star but is not tagged`
        : `${file}: tagged Dark Star but never played it`,
    ).toBe(played);
  });

  it.each(files)('%s tags the Playing Palindrome iff it played one', (file) => {
    // The third derivable-by-rule tag, and the first keyed on a *sequence*
    // rather than a single song or a date. Playing in the Band opens, the set
    // turns around on Morning Dew, and it comes back out through the same two
    // songs in reverse — a shape the band reached only a handful of times, all
    // of them 1973–74 (Jason, 2026-08-13).
    //
    // Pinned here for the same reason `Dark Star` is: the corpus doesn't hold
    // every instance yet, and when the remaining ones are imported this test
    // demands the tag rather than trusting anyone to remember it.
    const show = readShow(file);
    const played = hasPlayingPalindrome(show);
    const tagged = (show.tags ?? []).includes('Playing Palindrome');
    expect(
      tagged,
      played
        ? `${file}: plays the Playing palindrome but is not tagged`
        : `${file}: tagged Playing Palindrome but the sequence isn't in the setlist`,
    ).toBe(played);
  });

  it.each(files)('%s tags Wall of Sound iff it fell in the era', (file) => {
    // The second derivable-by-rule tag. The Wall of Sound PA debuted at the
    // Cow Palace on 1974-03-23 and played its last night at Winterland on
    // 1974-10-20, so era membership is purely a date range — every show
    // inside it had the rig, and the handful of early-1974 shows before the
    // debut did not. Deriving it from `date` rather than trusting the author
    // means a newly-added 1974 show can't be tagged by hand incorrectly, in
    // either direction.
    const show = readShow(file);
    const inEra =
      show.date >= WALL_OF_SOUND_FIRST && show.date <= WALL_OF_SOUND_LAST;
    const tagged = (show.tags ?? []).includes('Wall of Sound');
    expect(
      tagged,
      inEra
        ? `${file}: falls in the Wall of Sound era but is not tagged`
        : `${file}: tagged Wall of Sound but falls outside ${WALL_OF_SOUND_FIRST}..${WALL_OF_SOUND_LAST}`,
    ).toBe(inEra);
  });

  it('uses only known tags', () => {
    // An allow-list, not a shape check: tags are headed for index pages, so a
    // typo would quietly mint a phantom index.
    //
    // Two sources, because tags now come from two places. The editorial ones
    // are hand-listed — adding one is deliberate friction. The release ones are
    // *derived* from data/releases.json, so adding a batch of shows from a new
    // box doesn't mean remembering to widen this list, and a tag that no
    // release grants still fails.
    const EDITORIAL_TAGS = [
      'Dark Star',
      'Final Show',
      'Live/Dead',
      'Playing Palindrome',
      'Shows I Attended',
      'Sunshine Daydream',
      'Wall of Sound',
    ];
    const known = new Set([
      ...EDITORIAL_TAGS,
      ...releases.flatMap((release) => (release.tag ? [release.tag] : [])),
    ]);
    const used = new Set(files.flatMap((file) => readShow(file).tags ?? []));
    for (const tag of used) {
      expect(
        known.has(tag),
        `"${tag}" is neither an editorial tag nor granted by any release in data/releases.json`,
      ).toBe(true);
    }
  });
});

describe('song titles come from the canonical registry', () => {
  // Why a registry at all: `titleToRgb` uppercases and strips non-letters, so
  // case and punctuation are free but *word content* is not — "Lazy River" and
  // "Lazy River Road" are different colours, i.e. different songs on the wall.
  // Every entry in data/CORRECTIONS.md is an instance of that. Shows are now
  // imported from external sources (official release track listings,
  // archive.org), each with its own title conventions, so without this gate an
  // import can silently mint a near-miss variant — invisible until two shows
  // sit side by side. `aliases` are the external spellings that map onto a
  // canonical title; they must never appear in show data themselves.
  const files = dataFiles();
  const registry = JSON.parse(readFileSync('data/songs.json', 'utf8')) as {
    songs: { title: string; aliases?: string[]; sharesPrefixWith?: string }[];
  };
  const canonical = new Set(registry.songs.map((song) => song.title));
  const words = (title: string) => cleanTitle(title).split('_').filter(Boolean);

  it('registry has no duplicate or colour-colliding entries', () => {
    expect(canonical.size).toBe(registry.songs.length);
    // Two canonical titles that clean to the same string would render as one
    // colour — they are the same song spelled two ways, not two songs.
    const cleaned = registry.songs.map((song) => cleanTitle(song.title));
    expect(new Set(cleaned).size).toBe(cleaned.length);
  });

  it('aliases are distinct from every canonical title and each other', () => {
    const aliases = registry.songs.flatMap((song) => song.aliases ?? []);
    expect(new Set(aliases).size).toBe(aliases.length);
    for (const alias of aliases) {
      expect(canonical.has(alias), `"${alias}" is also a canonical title`).toBe(
        false,
      );
    }
  });

  it('no two canonical titles differ only in word boundaries', () => {
    // "Turn On Your Lovelight" vs "Turn On Your Love Light" clean to different
    // strings — different colours — but are the same song. Word spacing is the
    // one difference the colour algorithm sees that a human reader does not.
    const byLetters = new Map<string, string[]>();
    for (const song of registry.songs) {
      const key = cleanTitle(song.title).replace(/_/g, '');
      byLetters.set(key, [...(byLetters.get(key) ?? []), song.title]);
    }
    const collisions = [...byLetters.values()].filter(
      (group) => group.length > 1,
    );
    expect(collisions, `same letters, different spacing`).toEqual([]);
  });

  it('no two canonical titles are letter-for-letter rearrangements', () => {
    // Catches transposition typos, which are the one variant class that is
    // completely invisible: `Mississippi Half-Step Uptown Toodeloo` and the
    // misspelled `…Toodleoo` both render 131,120,128, because a channel is the
    // *mean* of its slice and averaging doesn't care about order. Two spellings
    // of that song sat in the corpus for years looking identical on the wall.
    // No two real songs in the repertoire are anagrams of each other.
    const byLetters = new Map<string, string[]>();
    for (const song of registry.songs) {
      const key = [...cleanTitle(song.title).replace(/_/g, '')].sort().join('');
      byLetters.set(key, [...(byLetters.get(key) ?? []), song.title]);
    }
    const clashes = [...byLetters.values()].filter((group) => group.length > 1);
    expect(clashes, 'same letters, different order — likely a typo').toEqual(
      [],
    );
  });

  it('titles that share a word-prefix say so deliberately', () => {
    // The failure mode this catches: an import drops a word and mints
    // "New Minglewood" beside "New Minglewood Blues". Real pairs exist though
    // — "Hey Jude Reprise", and Dylan's "It's All Over Now, Baby Blue" next to
    // Womack's "It's All Over Now" — so the rule is declare-it, not ban-it.
    for (const song of registry.songs) {
      const own = words(song.title);
      for (const other of registry.songs) {
        if (other === song) continue;
        const theirs = words(other.title);
        if (
          theirs.length >= own.length ||
          !theirs.every((word, i) => word === own[i])
        ) {
          continue;
        }
        // The test can't know which of the pair is wrong, so it names both
        // and leaves the call to a human: annotating the longer title is only
        // right when both songs are real.
        expect(
          song.sharesPrefixWith,
          `"${song.title}" starts with "${other.title}". If both are real songs, add sharesPrefixWith: "${other.title}" to "${song.title}". If one is a dropped-word typo, fix that instead`,
        ).toBe(other.title);
      }
    }
  });

  it('every sharesPrefixWith names a real, actual prefix', () => {
    for (const song of registry.songs) {
      if (!song.sharesPrefixWith) continue;
      expect(canonical.has(song.sharesPrefixWith)).toBe(true);
      const own = words(song.title);
      const theirs = words(song.sharesPrefixWith);
      expect(
        theirs.length < own.length &&
          theirs.every((word, i) => word === own[i]),
        `"${song.sharesPrefixWith}" is not a prefix of "${song.title}"`,
      ).toBe(true);
    }
  });

  it.each(files)('%s uses only canonical song titles', (file) => {
    for (const song of readShow(file).songs) {
      expect(
        canonical.has(song.title),
        `${file}: "${song.title}" is not in data/songs.json — add it there deliberately, or use the canonical spelling`,
      ).toBe(true);
    }
  });
});

describe('official-release index is well-formed', () => {
  // data/releases.json is drafted by `npm run releases --draft` and then
  // hand-corrected, so the fields most likely to be edited — `dates` and
  // `completeness` — are exactly the ones `tag` is derived from. Re-deriving
  // here is what stops an edit leaving a stale tag behind: resolving a release
  // to three complete shows must also give it a tag, and demoting one to a
  // selections-only compilation must take its tag away.

  it('has entries, each named uniquely', () => {
    expect(releases.length).toBeGreaterThan(0);
    const names = releases.map((release) => release.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(
    releases
      .filter((release) => !release.eligible)
      .map((r) => [r.name, r] as const),
  )('%s is ineligible, so sources nothing', (name, release) => {
    // Ineligible entries are kept so the index records what was rejected and
    // why, rather than the reasoning living only in the builder's constants.
    // They must stay inert: no dates to source from, no tag to index.
    expect(release.dates, `${name}: ineligible but lists show dates`).toEqual(
      [],
    );
    expect(release.tag, `${name}: ineligible but carries a tag`).toBeNull();
    expect(release.note, `${name}: ineligible without a reason`).toMatch(
      /^not a source: /,
    );
  });

  it.each(
    releases
      .filter((release) => release.eligible)
      .map((r) => [r.name, r] as const),
  )('%s earns a tag exactly when the rule says so', (name, release) => {
    // Presence, not spelling: a few releases (e.g. the RFK Stadium set, whose
    // name is comma-separated rather than subtitled) need a hand-picked
    // short name that no rule produces. Whether a tag exists is the part
    // that carries meaning, so that is what's pinned.
    const expected = releaseTag(
      name,
      release.series,
      release.completeness,
      release.dates.length,
    );
    expect(
      Boolean(release.tag),
      release.tag
        ? `${name}: tagged "${release.tag}" but the rule gives it no tag (${release.dates.length} show(s), ${release.completeness})`
        : `${name}: has ${release.dates.length} complete show(s) but no tag`,
    ).toBe(Boolean(expected));
    if (release.series) expect(release.tag).toBe(release.series);
  });

  it.each(releases.map((release) => [release.name, release] as const))(
    '%s has sorted, non-overlapping dates',
    (name, release) => {
      for (const date of [...release.dates, ...release.bonusDates]) {
        expect(date, `${name}: "${date}"`).toMatch(DATE_RE);
      }
      expect(release.dates, `${name}: dates out of order`).toEqual(
        [...release.dates].sort(),
      );
      // A date is either a whole show on this release or bonus material from a
      // night it doesn't otherwise carry — never both.
      const overlap = release.dates.filter((date) =>
        release.bonusDates.includes(date),
      );
      expect(
        overlap,
        `${name}: listed as both a show and a bonus date`,
      ).toEqual([]);
    },
  );

  it.each(dataFiles())('%s names a real source, if any', (file) => {
    // `source` records where a show's timings came from, so it must name
    // something real: a release exactly as `data/releases.json` spells it
    // (several, pipe-separated, when a show was stitched from more than one —
    // pipe because release names contain commas),
    // or an archive.org identifier for an unreleased show. A typo here would
    // quietly break the "should this be re-timed?" question the field exists to
    // answer, and nothing else would notice.
    const source = (readShow(file) as { source?: string }).source;
    if (!source) return;
    const names = new Set(releases.map((release) => release.name));
    for (const part of source.split('|').map((piece) => piece.trim())) {
      if (part.startsWith('archive.org:')) {
        expect(
          part.slice('archive.org:'.length).length,
          `${file}: empty archive.org identifier`,
        ).toBeGreaterThan(0);
        continue;
      }
      expect(
        names.has(part),
        `${file}: source "${part}" is not a release in data/releases.json`,
      ).toBe(true);
    }
  });

  it.each(dataFiles())(
    '%s carries the tag of every release that timed it',
    (file) => {
      // The standing rule is that a show takes the tag of its **chosen source**
      // and not of every release that happens to contain the date — most shows
      // sit on two or three, and tagging from all of them would describe a
      // release history rather than group anything.
      //
      // A stitched `source` is the case that rule doesn't cover. When a show is
      // built from more than one release, each named release *supplied
      // timings*: it is not a coincidence of the catalogue, it is part of how
      // the art was made. So every release in `source` grants its tag.
      //
      // Merely appearing on a release still grants nothing, which is what keeps
      // this narrow — `source` is the filter, and it names only what was used.
      // 19710806 is the case that prompted it: stitched from Dick's Picks 35
      // and Road Trips 1:3, it carried only `Dick's Picks` and was missing from
      // the `Road Trips` index it belongs in.
      //
      // One-directional on purpose. A show may carry editorial tags no release
      // grants (`Dark Star`, `Wall of Sound`), so this checks that
      // source-granted tags are *present*, never that nothing else is.
      const show = readShow(file) as { source?: string; tags?: string[] };
      if (!show.source) return;
      const tags = new Set(show.tags ?? []);
      for (const part of show.source.split('|').map((piece) => piece.trim())) {
        if (!part || part.startsWith('archive.org:')) continue;
        const release = releases.find((entry) => entry.name === part);
        const tag = release?.tag;
        if (!tag) continue;
        // One carve-out, already the project's rule: a release covering
        // *exactly* a tour's date set grants no tag, because its index would
        // duplicate the tour gallery. Europe '72 is the case — all 22 shows of
        // the Europe 1972 tour and nothing else — and those shows deliberately
        // carry no `Europe '72` tag.
        if (coversExactlyOneGrouping(release.dates)) continue;
        expect(
          tags.has(tag),
          `${file}: sourced from "${part}", which grants the tag "${tag}", but the show does not carry it`,
        ).toBe(true);
      }
    },
  );

  it('no two unrelated releases claim the same tag', () => {
    const owners = new Map<string, Set<string>>();
    for (const release of releases) {
      if (!release.tag) continue;
      const key = release.series ?? release.name;
      owners.set(release.tag, (owners.get(release.tag) ?? new Set()).add(key));
    }
    for (const [tag, keys] of owners) {
      expect(
        [...keys],
        `tag "${tag}" is claimed by more than one release`,
      ).toHaveLength(1);
    }
  });
});

describe('generated manifest is in sync with the data', () => {
  // Catches "added/removed a show but forgot to run `npm run generate`".
  // Only the id set is checked — not stripe content — so corrections to a
  // show's data never trip this; you just regenerate and commit.
  it('manifest ids match the data files', () => {
    const dataIds = dataFiles()
      .map((f) => readShow(f).id)
      .sort();
    const manifestIds = shows.map((s) => s.id).sort();
    expect(manifestIds).toEqual(dataIds);
  });
});

describe('staged partial shows are well-formed', () => {
  // `data/partial-shows/` holds shows an official release can only partly
  // source — the setlist skeleton comes from an archive.org soundboard, the
  // durations the release does carry are merged in, and the rest are left blank
  // for Jason to fill from whichever source he judges right. Promotion is a
  // plain `mv` into `data/shows/<year>/`.
  //
  // These are *format* guards only. Completeness is deliberately not checked —
  // a blank duration is the entire point, and the show-data guards above will
  // reject one the moment the file is promoted. What is checked is everything
  // that would otherwise stay silent until promotion and then surface with no
  // context: a bad id, a non-canonical title, a malformed duration, or a
  // staging file shadowing a show that already exists.
  const PARTIAL_DIR = 'data/partial-shows';
  const partialFiles = existsSync(PARTIAL_DIR)
    ? (readdirSync(PARTIAL_DIR) as string[])
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];
  const readPartial = (file: string) =>
    JSON.parse(readFileSync(join(PARTIAL_DIR, file), 'utf8')) as ShowFile;

  const registry = JSON.parse(readFileSync('data/songs.json', 'utf8')) as {
    songs: { title: string; aliases?: string[] }[];
  };
  const canonical = new Set(registry.songs.map((song) => song.title));
  const aliases = new Set(registry.songs.flatMap((song) => song.aliases ?? []));

  it('the directory is optional and flat', () => {
    // Nothing staged is the normal steady state, so an empty or absent
    // directory must pass. Flat because there are only ever a handful in
    // flight, and promotion should stay a one-step `mv`.
    for (const file of partialFiles) expect(file).not.toContain('/');
  });

  it('no staged id collides with a show that already exists', () => {
    const real = new Set(dataFiles().map((f) => readShow(f).id));
    for (const file of partialFiles) {
      const id = readPartial(file).id;
      expect(
        real.has(id),
        `${file} stages ${id}, which is already in data/shows/ — finish or delete the staged copy`,
      ).toBe(false);
    }
  });

  it('staged ids are unique', () => {
    const ids = partialFiles.map((f) => readPartial(f).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  if (partialFiles.length) {
    it.each(partialFiles)('%s is well-formed', (file) => {
      const show = readPartial(file);

      expectIdMatchesDate(show, file);
      expect(show.songs.length).toBeGreaterThan(0);

      for (const song of show.songs) {
        expect(
          aliases.has(song.title),
          `"${song.title}" is an alias; use the canonical title`,
        ).toBe(false);
        expect(
          canonical.has(song.title),
          `"${song.title}" is not in data/songs.json — add it deliberately or alias it`,
        ).toBe(true);
        // Blank is the work list. Anything else has to be a real duration:
        // a half-typed "12:" or "3:7" would otherwise survive until promotion.
        if (song.duration !== '')
          expect(
            isValidDuration(song.duration),
            `"${song.title}" has duration "${song.duration}" — use m:ss, or "" if still unknown`,
          ).toBe(true);
      }
    });
  }
});

describe('shows with unknown setlists are well-formed', () => {
  // `data/unknown-setlists/` is the other holding pen, and the distinction from
  // `data/partial-shows/` is intent, not format: a staged partial is waiting
  // for a timing somebody can still supply, while these are waiting for
  // nothing. The tape doesn't circulate, the sources disagree about what was
  // played, and no amount of listening will settle it — 19710824 survives only
  // as whatever was salvageable from Keith Godchaux's houseboat tapes.
  //
  // They are held out of `data/shows/` because the art would otherwise assert a
  // setlist the record doesn't support: stripes are a claim about what was
  // played and in what order, and here that claim can't be made.
  //
  // Format guards only, with two differences from the staged-partial block. A
  // `note` is required — a file whose whole reason for existing is doubt has to
  // carry the reason — and every duration must be real, since what survives is
  // released material with timings; a blank would mean the file is waiting for
  // something, which is exactly what this directory is not for.
  const UNKNOWN_DIR = 'data/unknown-setlists';
  const unknownFiles = existsSync(UNKNOWN_DIR)
    ? (readdirSync(UNKNOWN_DIR) as string[])
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];
  const readUnknown = (file: string) =>
    JSON.parse(readFileSync(join(UNKNOWN_DIR, file), 'utf8')) as ShowFile;

  const registry = JSON.parse(readFileSync('data/songs.json', 'utf8')) as {
    songs: { title: string; aliases?: string[] }[];
  };
  const canonical = new Set(registry.songs.map((song) => song.title));
  const aliases = new Set(registry.songs.flatMap((song) => song.aliases ?? []));

  it('the directory is optional and flat', () => {
    for (const file of unknownFiles) expect(file).not.toContain('/');
  });

  it('no id collides with a show that already exists, or with a staged partial', () => {
    const real = new Set(dataFiles().map((f) => readShow(f).id));
    const staged = new Set(
      (existsSync('data/partial-shows')
        ? (readdirSync('data/partial-shows') as string[])
        : []
      )
        .filter((f) => f.endsWith('.json'))
        .map(
          (f) =>
            (
              JSON.parse(
                readFileSync(join('data/partial-shows', f), 'utf8'),
              ) as ShowFile
            ).id,
        ),
    );
    for (const file of unknownFiles) {
      const id = readUnknown(file).id;
      expect(
        real.has(id),
        `${file} duplicates ${id}, which is already in data/shows/`,
      ).toBe(false);
      expect(
        staged.has(id),
        `${file} duplicates ${id}, which is already staged in data/partial-shows/`,
      ).toBe(false);
    }
  });

  if (unknownFiles.length) {
    it.each(unknownFiles)('%s is well-formed', (file) => {
      const show = readUnknown(file);

      expectIdMatchesDate(show, file);
      expect(show.songs.length).toBeGreaterThan(0);
      expect(
        (show.note ?? '').length,
        `${file}: needs a note saying what survived and why the setlist can't be known`,
      ).toBeGreaterThan(0);

      for (const song of show.songs) {
        expect(
          aliases.has(song.title),
          `"${song.title}" is an alias; use the canonical title`,
        ).toBe(false);
        expect(
          canonical.has(song.title),
          `"${song.title}" is not in data/songs.json — add it deliberately or alias it`,
        ).toBe(true);
        expect(
          isValidDuration(song.duration),
          `"${song.title}" has duration "${song.duration}" — what survives is released material, so it is timed`,
        ).toBe(true);
      }
    });
  }
});

describe('data/UNBUILT-DATES.md accounts for every date the corpus lacks', () => {
  // The file explains *why* each remaining date is unbuilt, and the four reasons
  // are not interchangeable: nothing circulates, a tape exists but falls short,
  // it is buildable and deliberately deferred, or the record is not out yet.
  // "Absent from data/shows/" reads identically in all four cases.
  //
  // A prose file describing data will drift from it silently, and this one has
  // an unusually good chance of doing so — a date leaves the list by being
  // *built*, which is exactly the moment nobody is thinking about the list. So
  // the guard runs in both directions: nothing unbuilt may go unlisted, and
  // nothing listed may already be built.
  //
  // The tape counts and checked-on dates in that file are deliberately NOT
  // guarded. Nothing local can verify what archive.org holds, and a test that
  // pretended otherwise would be asserting its own fixture.
  const DOC = 'data/UNBUILT-DATES.md';
  const doc = readFileSync(DOC, 'utf8');
  // Rows are `| 1968-02-23 | …`, but section D lists a run of dates on one line
  // (`1985-06-14, 06-15, …`), so scan for full dates and for the `MM-DD` short
  // form that follows one, rather than parsing the table.
  //
  // Only table rows count, not prose. Scanning the whole file looked fine and
  // was not: deleting 1972-11-18's row left the guard green, because the date is
  // also mentioned in a paragraph below the table. A date being *discussed* is
  // not the same as its being accounted for, and the mutation test caught it.
  const listed = new Set<string>();
  for (const line of doc.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue;
    for (const match of line.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
      // The Checked and Due columns are dates too. The band's last show was in
      // 1995, so anything this century is a stamp about the file rather than a
      // date in the corpus, and letting one through would mean the guard was
      // quietly asserting something it does not mean.
      if (Number(match[1]) >= 2000) continue;
      listed.add(match[0]);
      // Section D packs a run onto one row (`1985-06-14, 06-15, …`); a short
      // form continues the year of the full date preceding it.
      const rest = line.slice(match.index! + match[0].length);
      for (const short of rest.matchAll(
        /(?<![\d-])(\d{2})-(\d{2})(?![\d-])/g,
      )) {
        listed.add(`${match[1]}-${short[0]}`);
      }
    }
  }

  const built = new Set(dataFiles().map((file) => readShow(file).date));
  const unbuilt = new Set<string>();
  for (const release of releases) {
    if (!release.eligible) continue;
    for (const date of release.dates) if (!built.has(date)) unbuilt.add(date);
  }
  const UNKNOWN_SETLIST_DIR = 'data/unknown-setlists';
  if (existsSync(UNKNOWN_SETLIST_DIR)) {
    for (const file of readdirSync(UNKNOWN_SETLIST_DIR) as string[]) {
      if (!file.endsWith('.json')) continue;
      unbuilt.add(
        (
          JSON.parse(
            readFileSync(join(UNKNOWN_SETLIST_DIR, file), 'utf8'),
          ) as ShowFile
        ).date,
      );
    }
  }

  it('lists every eligible-release date the corpus does not hold', () => {
    const missing = [...unbuilt].filter((date) => !listed.has(date)).sort();
    expect(
      missing,
      `${DOC} does not account for: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('lists every show held in data/unknown-setlists/', () => {
    // Covered by the assertion above, which folds both sources into `unbuilt`;
    // stated separately so a failure names the pen the date came from.
    const pen = existsSync(UNKNOWN_SETLIST_DIR)
      ? (readdirSync(UNKNOWN_SETLIST_DIR) as string[])
          .filter((file) => file.endsWith('.json'))
          .map(
            (file) =>
              (
                JSON.parse(
                  readFileSync(join(UNKNOWN_SETLIST_DIR, file), 'utf8'),
                ) as ShowFile
              ).date,
          )
      : [];
    const missing = pen.filter((date) => !listed.has(date)).sort();
    expect(missing, `${DOC} omits held shows: ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('names no date the corpus already holds', () => {
    // The self-cleaning half: build one of these and its row has to go, or the
    // file goes on describing a problem that was solved.
    const stale = [...listed].filter((date) => built.has(date)).sort();
    expect(
      stale,
      `${DOC} still lists dates that are now shows: ${stale.join(', ')}`,
    ).toEqual([]);
  });
});
