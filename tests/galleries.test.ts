import { shows } from '@/data/shows.generated';
import { isShowId } from '@/wwob';
import {
  RESERVED_SLUGS,
  RUN_MAX_GAP_DAYS,
  VENUE_MIN_SHOWS,
  allShowsGallery,
  allSubGalleries,
  buildGalleries,
  buildRuns,
  findGallery,
  findRunForShow,
  findTagGallery,
  gallerySections,
  slugify,
} from '@/galleries';
import type { ShowSummary } from '@/wwob';

/** Minimal synthetic show for exercising buildGalleries with fixtures. */
function stubShow(overrides: Partial<ShowSummary> = {}): ShowSummary {
  const date = overrides.date ?? '1970-01-01';
  return {
    id: date.replaceAll('-', ''),
    date,
    venue: 'Test Hall',
    city: 'Testville',
    state: 'CA',
    country: 'USA',
    svg: '/shows/test.svg',
    songCount: 1,
    durationSeconds: 600,
    ...overrides,
  };
}

/** N copies of a venue's shows, dated consecutively within a year. */
function venueRun(
  count: number,
  venue: string,
  city: string,
  state: string | undefined,
  year = 1970,
): ShowSummary[] {
  return Array.from({ length: count }, (_element, index) =>
    stubShow({
      venue,
      city,
      state,
      date: `${year}-01-${String(index + 1).padStart(2, '0')}`,
    }),
  );
}

// Every gallery page, drawer-listed or not — run pages are routed without
// appearing in the nav, so `gallerySections` would miss them here.
const subGalleries = allSubGalleries;

describe('slugify', () => {
  it('lowercases, hyphenates, and strips diacritics + edge punctuation', () => {
    expect(slugify('Zénith Paris')).toBe('zenith-paris');
    expect(slugify('St. Louis')).toBe('st-louis');
    expect(slugify('  --Weird__ Name!  ')).toBe('weird-name');
    expect(slugify('Spring 1977')).toBe('spring-1977');
  });

  it('removes intra-word punctuation instead of separating on it', () => {
    // An apostrophe used to become a separator, stranding the possessive `s`
    // as its own word: `dick-s-picks`. These are live tag-page URLs.
    expect(slugify("Dick's Picks")).toBe('dicks-picks');
    expect(slugify("Dave's Picks")).toBe('daves-picks');
    expect(slugify('Dozin’ at the Knick')).toBe('dozin-at-the-knick');
  });

  it('keeps hyphens separating, so hyphenated words do not fuse', () => {
    // The reason the rule strips only apostrophes and periods. Treating every
    // punctuation mark as removable would give `blackthroated-wind`.
    expect(slugify('Black-Throated Wind')).toBe('black-throated-wind');
    expect(slugify('Half-Step')).toBe('half-step');
  });
});

describe('gallery registry (real corpus)', () => {
  it('gives every sub-gallery a unique, root-safe slug', () => {
    const slugs = subGalleries.map((gallery) => gallery.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(isShowId(slug)).toBe(false); // never show-id-shaped
      expect(RESERVED_SLUGS).not.toContain(slug);
    }
  });

  it('resolves every sub-gallery through findGallery', () => {
    for (const gallery of subGalleries) {
      expect(findGallery(gallery.slug)).toBe(gallery);
    }
    expect(findGallery('nope')).toBeUndefined();
  });

  it('has the whole index, date-ascending, in the all-shows gallery', () => {
    expect(allShowsGallery.title).toBe('All Shows');
    expect(allShowsGallery.kind).toBe('all');
    expect(allShowsGallery.shows).toHaveLength(shows.length);
    const dates = allShowsGallery.shows.map((show) => show.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('partitions the corpus exactly into year galleries', () => {
    const years = gallerySections.find(
      (section) => section.label === 'Years',
    )!.galleries;
    const ids = years.flatMap((gallery) => gallery.shows.map((s) => s.id));
    expect(ids.sort()).toEqual(shows.map((show) => show.id).sort());
    for (const gallery of years) {
      expect(gallery.kind).toBe('year');
      for (const show of gallery.shows) {
        expect(show.date.slice(0, 4)).toBe(gallery.slug);
      }
    }
    const slugs = years.map((gallery) => gallery.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  it('has no bare-year tour in the corpus', () => {
    // The four 1969 Fillmore West shows used to carry tour "1969", which
    // collided with the year gallery. They were never really a tour, so the
    // field was dropped rather than worked around. The registry still handles
    // the collision (year wins) — see the synthetic cases below, which are now
    // the only coverage for it.
    expect(shows.filter((show) => /^\d{4}$/.test(show.tour ?? ''))).toEqual([]);
    expect(findGallery('1969')!.kind).toBe('year');
  });

  it('only gives venues with enough shows a gallery', () => {
    const venues = gallerySections.find(
      (section) => section.label === 'Venues',
    )!.galleries;
    for (const gallery of venues) {
      expect(gallery.kind).toBe('venue');
      expect(gallery.shows.length).toBeGreaterThanOrEqual(VENUE_MIN_SHOWS);
    }
    const msg = findGallery('madison-square-garden')!;
    expect(msg.title).toBe('Madison Square Garden');
    expect(msg.shows).toHaveLength(
      shows.filter((show) => show.venue === 'Madison Square Garden').length,
    );
    expect(findGallery('capitol-theatre')).toBeUndefined(); // below threshold
  });
});

describe('buildGalleries (synthetic corpora)', () => {
  const bySlug = (source: ShowSummary[]) => buildGalleries(source).bySlug;

  it('city-suffixes venue slug + title only when the name is ambiguous', () => {
    const registry = bySlug([
      ...venueRun(VENUE_MIN_SHOWS, 'Fox Theatre', 'Atlanta', 'GA', 1970),
      ...venueRun(VENUE_MIN_SHOWS, 'Fox Theatre', 'St. Louis', 'MO', 1971),
      ...venueRun(
        VENUE_MIN_SHOWS,
        'Winterland Arena',
        'San Francisco',
        'CA',
        1972,
      ),
    ]);
    expect(registry.get('fox-theatre-atlanta')!.title).toBe(
      'Fox Theatre, Atlanta',
    );
    expect(registry.get('fox-theatre-st-louis')!.title).toBe(
      'Fox Theatre, St. Louis',
    );
    expect(registry.get('fox-theatre')).toBeUndefined();
    // Unambiguous names stay bare.
    expect(registry.get('winterland-arena')!.title).toBe('Winterland Arena');
  });

  it('resolves a venue lookup past a shared name', () => {
    // The reason `venueByKey` is keyed on venue + city + state rather than the
    // name: two Fox Theatres are two galleries, and a show at one must not
    // resolve to the other. Real data can't cover this yet — Madison Square
    // Garden is the only venue over the threshold — but the composite key
    // exists precisely for the day it can.
    const registry = buildGalleries([
      ...venueRun(VENUE_MIN_SHOWS, 'Fox Theatre', 'Atlanta', 'GA', 1970),
      ...venueRun(VENUE_MIN_SHOWS, 'Fox Theatre', 'St. Louis', 'MO', 1971),
      ...venueRun(
        VENUE_MIN_SHOWS - 1,
        'Capitol Theatre',
        'Passaic',
        'NJ',
        1972,
      ),
    ]);
    const atlanta = registry.venueByKey.get('Fox Theatre|Atlanta|GA');
    const stLouis = registry.venueByKey.get('Fox Theatre|St. Louis|MO');
    expect(atlanta!.slug).toBe('fox-theatre-atlanta');
    expect(stLouis!.slug).toBe('fox-theatre-st-louis');
    expect(atlanta).not.toBe(stLouis);
    // Below the threshold means no page, so no entry to find.
    expect(
      registry.venueByKey.get('Capitol Theatre|Passaic|NJ'),
    ).toBeUndefined();
  });

  it('judges ambiguity corpus-wide, not just among qualifying venues', () => {
    // St. Louis is below threshold (no gallery), but its existence still
    // forces the Atlanta slug to carry the city — so the URL never churns
    // if St. Louis later qualifies.
    const registry = bySlug([
      ...venueRun(VENUE_MIN_SHOWS, 'Fox Theatre', 'Atlanta', 'GA', 1970),
      ...venueRun(2, 'Fox Theatre', 'St. Louis', 'MO', 1971),
    ]);
    expect(registry.get('fox-theatre-atlanta')).toBeDefined();
    expect(registry.get('fox-theatre')).toBeUndefined();
    expect(registry.get('fox-theatre-st-louis')).toBeUndefined();
  });

  it('state-suffixes same-name venues in same-name cities', () => {
    const registry = bySlug([
      ...venueRun(VENUE_MIN_SHOWS, 'Civic Center', 'Springfield', 'MA', 1970),
      ...venueRun(VENUE_MIN_SHOWS, 'Civic Center', 'Springfield', 'IL', 1971),
    ]);
    expect(registry.get('civic-center-springfield-ma')!.title).toBe(
      'Civic Center, Springfield, MA',
    );
    expect(registry.get('civic-center-springfield-il')!.title).toBe(
      'Civic Center, Springfield, IL',
    );
  });

  it('throws when a venue slug hits a reserved route', () => {
    expect(() =>
      bySlug(venueRun(VENUE_MIN_SHOWS, 'About', 'Testville', 'CA')),
    ).toThrow(/reserved/);
  });

  it('throws when a slug comes out show-id-shaped', () => {
    expect(() =>
      bySlug(venueRun(VENUE_MIN_SHOWS, '19770508', 'Testville', 'CA')),
    ).toThrow(/show-id-shaped/);
  });

  it('throws when a bare-year tour contains an out-of-year show', () => {
    expect(() =>
      bySlug([
        stubShow({ date: '1970-03-01', tour: '1970' }),
        stubShow({ date: '1971-06-01', tour: '1970' }),
      ]),
    ).toThrow(/out-of-year/);
  });

  it('silently skips a bare-year tour that matches its year', () => {
    const registry = buildGalleries([
      stubShow({ date: '1970-03-01', tour: '1970' }),
      stubShow({ date: '1970-04-01', tour: '1970' }),
    ]);
    expect(registry.bySlug.get('1970')!.kind).toBe('year');
    expect(
      registry.sections.find((section) => section.label === 'Tours'),
    ).toBeUndefined(); // empty sections are dropped
  });
});

describe('buildRuns', () => {
  /** Shows at one venue on the given days of 1970-01. */
  function nights(venue: string, days: number[]): ShowSummary[] {
    return days.map((day) =>
      stubShow({ venue, date: `1970-01-${String(day).padStart(2, '0')}` }),
    );
  }

  it('needs two shows — a one-off night is not a run', () => {
    expect(buildRuns(nights('Fillmore', [1]))).toEqual([]);
  });

  it('bridges dark days up to the gap limit', () => {
    // The Madison Square Garden shape: nights with union dark days between.
    const runs = buildRuns(nights('The Garden', [1, 2, 4, 5, 7]));
    expect(runs).toHaveLength(1);
    expect(runs[0].shows).toHaveLength(5);
  });

  it('splits once the gap exceeds the limit', () => {
    const tooFar = RUN_MAX_GAP_DAYS + 1;
    const runs = buildRuns(
      nights('The Garden', [1, 2, 2 + tooFar, 3 + tooFar]),
    );
    expect(runs.map((run) => run.shows.length)).toEqual([2, 2]);
  });

  it('splits when the band played elsewhere in between', () => {
    // Adjacent *performance* dates: an intervening show at another venue ends
    // the run even though the dates would otherwise be close enough.
    const runs = buildRuns([
      ...nights('The Garden', [1, 2]),
      ...nights('Elsewhere', [3]),
      ...nights('The Garden', [4, 5]),
    ]);
    expect(runs).toHaveLength(2);
    expect(runs.every((run) => run.shows.length === 2)).toBe(true);
  });

  it('keeps same-named venues in different cities apart', () => {
    const runs = buildRuns([
      stubShow({ venue: 'Capitol', city: 'Passaic', date: '1970-01-01' }),
      stubShow({ venue: 'Capitol', city: 'Cardiff', date: '1970-01-02' }),
    ]);
    expect(runs).toEqual([]);
  });

  it('names a month-spanning run after its first show', () => {
    const runs = buildRuns([
      stubShow({ venue: 'Fillmore West', date: '1969-02-27' }),
      stubShow({ venue: 'Fillmore West', date: '1969-02-28' }),
      stubShow({ venue: 'Fillmore West', date: '1969-03-01' }),
    ]);
    expect(runs[0].name).toBe('Fillmore West February 1969');
  });

  it('is order-independent (sorts defensively)', () => {
    const [first, second, third] = nights('The Garden', [1, 2, 3]);
    expect(buildRuns([third, first, second])[0].shows).toHaveLength(3);
  });
});

describe('runs in the real corpus', () => {
  it('derives the two runs the retired `collection` field named by hand', () => {
    const winterland = findGallery('winterland-october-1974')!;
    expect(winterland.kind).toBe('run');
    expect(winterland.title).toBe('Winterland October 1974');
    expect(winterland.shows).toHaveLength(5);

    // Spans Feb→Mar, so it is named for its first show, not the calendar month.
    const fillmore = findGallery('fillmore-west-february-1969')!;
    expect(fillmore.title).toBe('Fillmore West February 1969');
    expect(fillmore.shows).toHaveLength(4);
  });

  it('bridges the Madison Square Garden dark days into one run', () => {
    // 1988-09-14..24 is nine nights broken by two-day union gaps; naive
    // date-adjacency would report three separate runs.
    const run = findRunForShow('19880914')!;
    expect(run.title).toBe('Madison Square Garden September 1988');
    expect(run.shows).toHaveLength(9);
    expect(findRunForShow('19880924')).toBe(run);
  });

  it('leaves one-off shows out of any run', () => {
    expect(findRunForShow('19720827')).toBeUndefined(); // Veneta, single night
  });

  it('keeps runs out of the drawer but routable', () => {
    const drawer = gallerySections.flatMap((section) => section.galleries);
    expect(drawer.some((gallery) => gallery.kind === 'run')).toBe(false);
    expect(allSubGalleries.some((gallery) => gallery.kind === 'run')).toBe(
      true,
    );
  });
});

describe('tag index galleries', () => {
  it('gives every authored tag an index page, alphabetically', () => {
    // Derived, not listed: release tags now come from data/releases.json, so a
    // batch of shows from a new box would otherwise mean remembering to widen
    // a literal here. The invariant that matters is the mapping — every tag any
    // show carries gets exactly one page, and no page exists without a show.
    const authored = [
      ...new Set(shows.flatMap((show) => show.tags ?? [])),
    ].sort((a, b) => a.localeCompare(b, 'en'));
    const tags = allSubGalleries.filter((gallery) => gallery.kind === 'tag');
    expect(tags.map((gallery) => gallery.title)).toEqual(authored);
    // Slugs survive the punctuation in "Live/Dead".
    expect(findGallery('live-dead')!.title).toBe('Live/Dead');
  });

  it('matches each tag index against the corpus', () => {
    for (const gallery of allSubGalleries.filter((g) => g.kind === 'tag')) {
      const expected = shows.filter((show) =>
        (show.tags ?? []).includes(gallery.title),
      );
      expect(gallery.shows).toEqual(expected);
      expect(gallery.shows.length).toBeGreaterThan(0);
    }
  });

  it('puts a multi-tagged show in every one of its indexes', () => {
    // Many-to-many is the point: 8/27/72 is in both of its tag indexes, which
    // the retired single-valued `collection` field could not express.
    expect(
      findGallery('dark-star')!.shows.some((show) => show.id === '19720827'),
    ).toBe(true);
    expect(
      findGallery('sunshine-daydream')!.shows.some(
        (show) => show.id === '19720827',
      ),
    ).toBe(true);
  });

  it('resolves a tag to its gallery by authored name', () => {
    expect(findTagGallery('Wall of Sound')!.slug).toBe('wall-of-sound');
    expect(findTagGallery('wall of sound')).toBeUndefined(); // exact, not fuzzy
    expect(findTagGallery('Nonexistent')).toBeUndefined();
  });

  it('keeps tag indexes out of the drawer but routable', () => {
    const drawer = gallerySections.flatMap((section) => section.galleries);
    expect(drawer.some((gallery) => gallery.kind === 'tag')).toBe(false);
    expect(allSubGalleries.some((gallery) => gallery.kind === 'tag')).toBe(
      true,
    );
  });

  it('groups a synthetic corpus by each tag independently', () => {
    const registry = buildGalleries([
      stubShow({ date: '1970-01-01', tags: ['Alpha', 'Beta'] }),
      stubShow({ date: '1971-01-01', tags: ['Beta'] }),
      stubShow({ date: '1972-01-01' }),
    ]);
    expect(registry.bySlug.get('alpha')!.shows).toHaveLength(1);
    expect(registry.bySlug.get('beta')!.shows).toHaveLength(2);
    expect(registry.bySlug.get('beta')!.kind).toBe('tag');
  });
});
