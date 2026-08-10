import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { cleanTitle, isValidDuration } from '@/wwob';
import type { ShowFile } from '@/wwob';
import { shows } from '@/data/shows.generated';
import { releaseTag } from '../generator/release-tag';
import type { Completeness } from '../generator/release-tag';

// Show data is hand-authored, so the guard here is *validity*, not fidelity to
// the original art. The authored data is the source of truth and is freely
// editable for corrections; these tests just keep it well-formed and the
// generated manifest in sync with it.

const DATA_DIR = 'data/shows';
/** Show ids are compact dates (also the show's URL): 19720827. */
const ID_RE = /^\d{8}$/;
/** The `date` field stays ISO for display and sorting: 1972-08-27. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Wall of Sound era: debut at the Cow Palace → last night at Winterland. */
const WALL_OF_SOUND_FIRST = '1974-03-23';
const WALL_OF_SOUND_LAST = '1974-10-20';

function dataFiles(): string[] {
  // Recursive: shows live in data/shows/<year>/<id>.json subdirectories.
  return (readdirSync(DATA_DIR, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function readShow(file: string): ShowFile {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as ShowFile;
}

describe('show data is well-formed', () => {
  const files = dataFiles();

  it('has at least one show', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is valid', (file) => {
    const show = readShow(file);

    // id present, well-formed, and matches its filename.
    expect(show.id).toMatch(ID_RE);
    expect(`${show.id}.json`).toBe(basename(file));

    // required metadata; the id is the date, compacted.
    expect(show.date).toMatch(DATE_RE);
    expect(show.id).toBe(show.date.replaceAll('-', ''));
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
    const show = readShow(file);
    const played = show.songs.some((song) => song.title === 'Dark Star');
    const tagged = (show.tags ?? []).includes('Dark Star');
    expect(
      tagged,
      played
        ? `${file}: plays Dark Star but is not tagged`
        : `${file}: tagged Dark Star but never played it`,
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
    // typo would quietly mint a phantom index. Adding a tag means adding it
    // here — deliberately a small amount of friction.
    const KNOWN_TAGS = [
      'Dark Star',
      'Final Show',
      'Formerly the Warlocks',
      'Live/Dead',
      'Shows I Attended',
      'Sunshine Daydream',
      'Wall of Sound',
    ];
    const used = new Set(files.flatMap((file) => readShow(file).tags ?? []));
    expect([...used].sort()).toEqual(
      KNOWN_TAGS.filter((tag) => used.has(tag)).sort(),
    );
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
