import { shows } from '@/data/shows.generated';
import {
  RESERVED_SLUGS,
  VENUE_MIN_SHOWS,
  allShowsGallery,
  buildGalleries,
  findGallery,
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

const subGalleries = gallerySections.flatMap((section) => section.galleries);

describe('slugify', () => {
  it('lowercases, hyphenates, and strips diacritics + edge punctuation', () => {
    expect(slugify('Zénith Paris')).toBe('zenith-paris');
    expect(slugify('St. Louis')).toBe('st-louis');
    expect(slugify('  --Weird__ Name!  ')).toBe('weird-name');
    expect(slugify('Spring 1977')).toBe('spring-1977');
  });
});

describe('gallery registry (real corpus)', () => {
  it('gives every sub-gallery a unique, root-safe slug', () => {
    const slugs = subGalleries.map((gallery) => gallery.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(slug).not.toMatch(/^\d{8}$/); // never show-id-shaped
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

  it('drops the bare-year "1969" tour — the year gallery wins', () => {
    // Regression pin for the real collision: 4 shows carry tour "1969".
    expect(shows.some((show) => show.tour === '1969')).toBe(true);
    expect(findGallery('1969')!.kind).toBe('year');
    const tours = gallerySections.find(
      (section) => section.label === 'Tours',
    )!.galleries;
    expect(tours.map((gallery) => gallery.title)).not.toContain('1969');
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
