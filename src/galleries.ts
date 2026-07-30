import { shows } from '@/data/shows.generated';
import type { ShowSummary } from '@/wwob';

/**
 * Gallery registry: derives every gallery page (all shows, per-year, per-tour,
 * per-venue) from the bundled show index at module load. Gallery slugs are
 * flat, root-level URL segments (`/1977`, `/spring-1977`,
 * `/madison-square-garden`) sharing the namespace with show ids and the static
 * routes, so the builder enforces uniqueness, a non-show-id shape, and a
 * reserved-word list — loudly, at build/test time, never silently at runtime.
 */

export type GalleryKind = 'all' | 'year' | 'tour' | 'venue';

export interface GalleryDef {
  /** Root-level URL segment ('' for the all-shows gallery at /all). */
  slug: string;
  /** Display + page-title text: 'All Shows' | '1977' | 'Spring 1977' | …. */
  title: string;
  kind: GalleryKind;
  /** Chronological ascending (the index is date-sorted; filtering keeps it). */
  shows: ShowSummary[];
}

/** A drawer-ready group of galleries ('Years' | 'Tours' | 'Venues'). */
export interface GallerySection {
  label: string;
  galleries: GalleryDef[];
}

export interface GalleryRegistry {
  all: GalleryDef;
  /** Non-empty sections only. */
  sections: GallerySection[];
  /** Every sub-gallery by slug (the all-shows root is not in here). */
  bySlug: Map<string, GalleryDef>;
}

/** A venue needs this many shows to earn its own gallery page. */
export const VENUE_MIN_SHOWS = 10;

/** Root URL segments gallery slugs must never claim. */
export const RESERVED_SLUGS = [
  'all',
  'about',
  'builder',
  'placeholder',
  'gallery',
];

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks: Zénith → Zenith
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Guarded insert — every slug rule lives here so no gallery can skip one. */
function register(bySlug: Map<string, GalleryDef>, gallery: GalleryDef): void {
  const { slug, title, kind } = gallery;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Gallery "${title}" produced an invalid slug "${slug}"`);
  }
  if (RESERVED_SLUGS.includes(slug)) {
    throw new Error(
      `Gallery "${title}" slug "${slug}" collides with a reserved route`,
    );
  }
  if (/^\d{8}$/.test(slug)) {
    throw new Error(
      `Gallery "${title}" slug "${slug}" is show-id-shaped and would clash with show URLs`,
    );
  }
  const existing = bySlug.get(slug);
  if (existing) {
    throw new Error(
      `Slug "${slug}" claimed by both "${existing.title}" (${existing.kind}) and "${title}" (${kind})`,
    );
  }
  bySlug.set(slug, gallery);
}

/** Group shows into an insertion-ordered map (source order = date order). */
function groupBy(
  source: ShowSummary[],
  keyOf: (show: ShowSummary) => string | undefined,
): Map<string, ShowSummary[]> {
  const groups = new Map<string, ShowSummary[]>();
  for (const show of source) {
    const key = keyOf(show);
    if (key === undefined) continue;
    const group = groups.get(key);
    if (group) group.push(show);
    else groups.set(key, [show]);
  }
  return groups;
}

/**
 * Pure builder (exported for tests to feed synthetic corpora). Precedence on
 * slug collisions: years > tours > venues — years are always-complete
 * partitions of the corpus, so they win; anything else colliding throws.
 */
export function buildGalleries(source: ShowSummary[]): GalleryRegistry {
  const bySlug = new Map<string, GalleryDef>();

  // Years — ascending; the year is both slug and title.
  const yearGalleries = [...groupBy(source, (show) => show.date.slice(0, 4))]
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, yearShows]): GalleryDef => {
      return { slug: year, title: year, kind: 'year', shows: yearShows };
    });
  for (const gallery of yearGalleries) register(bySlug, gallery);

  // Tours — in first-show order (insertion order of the date-sorted source).
  const tourGalleries: GalleryDef[] = [];
  for (const [tourName, tourShows] of groupBy(source, (show) => show.tour)) {
    const slug = slugify(tourName);
    if (bySlug.get(slug)?.kind === 'year') {
      // A tour named after a bare year (e.g. tour "1969") duplicates that
      // always-complete year gallery — the year wins and the tour page is
      // skipped. Guard the subset assumption: a skipped tour must not contain
      // shows the colliding year page wouldn't show.
      const stray = tourShows.find((show) => show.date.slice(0, 4) !== slug);
      if (stray) {
        throw new Error(
          `Tour "${tourName}" collides with the ${slug} year gallery but has an out-of-year show (${stray.id}) — rename the tour`,
        );
      }
      continue;
    }
    const gallery: GalleryDef = {
      slug,
      title: tourName,
      kind: 'tour',
      shows: tourShows,
    };
    register(bySlug, gallery);
    tourGalleries.push(gallery);
  }

  // Venues — grouped by physical venue (name + city + state), qualifying by
  // show count. Name ambiguity (same venue name in several cities) is judged
  // over the WHOLE corpus, not just qualifying venues, so a slug doesn't churn
  // when a same-named venue elsewhere later crosses the threshold.
  const venueGroups = groupBy(
    source,
    (show) => `${show.venue}|${show.city}|${show.state ?? ''}`,
  );
  const citiesByVenueName = groupBy(source, (show) => show.venue);
  const venueEntries = [...venueGroups.values()]
    .filter((venueShows) => venueShows.length >= VENUE_MIN_SHOWS)
    .map((venueShows) => {
      const { venue, city, state } = venueShows[0];
      const cities = new Set(
        citiesByVenueName
          .get(venue)!
          .map((show) => `${show.city}|${show.state ?? ''}`),
      );
      const ambiguous = cities.size > 1;
      return {
        slug: slugify(ambiguous ? `${venue} ${city}` : venue),
        title: ambiguous ? `${venue}, ${city}` : venue,
        venue,
        city,
        state,
        shows: venueShows,
      };
    });
  // Same venue + city name in different states (hello, Springfield): append
  // the state to the colliding entries; any remaining duplicate throws in
  // register().
  const slugCounts = new Map<string, number>();
  for (const entry of venueEntries) {
    slugCounts.set(entry.slug, (slugCounts.get(entry.slug) ?? 0) + 1);
  }
  for (const entry of venueEntries) {
    if ((slugCounts.get(entry.slug) ?? 0) > 1 && entry.state) {
      entry.slug = slugify(`${entry.venue} ${entry.city} ${entry.state}`);
      entry.title = `${entry.venue}, ${entry.city}, ${entry.state}`;
    }
  }
  const venueGalleries = venueEntries
    .sort(
      (entryA, entryB) =>
        entryB.shows.length - entryA.shows.length ||
        entryA.title.localeCompare(entryB.title),
    )
    .map(({ slug, title, shows: venueShows }): GalleryDef => {
      return { slug, title, kind: 'venue', shows: venueShows };
    });
  for (const gallery of venueGalleries) register(bySlug, gallery);

  const sections: GallerySection[] = [
    { label: 'Years', galleries: yearGalleries },
    { label: 'Tours', galleries: tourGalleries },
    { label: 'Venues', galleries: venueGalleries },
  ].filter((section) => section.galleries.length > 0);

  return {
    all: { slug: '', title: 'All Shows', kind: 'all', shows: source },
    sections,
    bySlug,
  };
}

// Computed once from the real index; the app imports these.
const registry = buildGalleries(shows);

export const allShowsGallery = registry.all;
export const gallerySections = registry.sections;

export function findGallery(slug: string): GalleryDef | undefined {
  return registry.bySlug.get(slug);
}
