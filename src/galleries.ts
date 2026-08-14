// Relative, not the `@/` alias: this module is imported by the Cloudflare
// Worker (worker/routes.ts) as well as the app, and wrangler's bundler can't
// resolve path-prefix aliases. Same convention generator/ uses.
import { shows } from './data/shows.generated.ts';
import { isShowId, type ShowSummary } from './wwob/index.ts';

/**
 * Gallery registry: derives every gallery page (all shows, per-year, per-tour,
 * per-venue) from the bundled show index at module load. Gallery slugs are
 * flat, root-level URL segments (`/1977`, `/spring-1977`,
 * `/madison-square-garden`) sharing the namespace with show ids and the static
 * routes, so the builder enforces uniqueness, a non-show-id shape, and a
 * reserved-word list — loudly, at build/test time, never silently at runtime.
 */

export type GalleryKind = 'all' | 'year' | 'tour' | 'venue' | 'run' | 'tag';

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
  /**
   * Drawer navigation only — non-empty sections, and deliberately a subset of
   * the pages that exist. Runs are routed but not listed (40 of them would
   * swamp the drawer), so route builders must use `subGalleries`, not this.
   */
  sections: GallerySection[];
  /** Every sub-gallery page that exists (the all-shows root is not in here). */
  subGalleries: GalleryDef[];
  /** Every sub-gallery by slug (the all-shows root is not in here). */
  bySlug: Map<string, GalleryDef>;
  /** Show id → the run it belongs to, for shows that are part of one. */
  runByShowId: Map<string, GalleryDef>;
  /** Tag name (as authored, not slugified) → its index page. */
  tagByName: Map<string, GalleryDef>;
  /**
   * Tour name (as authored) → its gallery. NOT every authored tour is in here:
   * a tour named after a bare year defers to the year gallery and gets no page
   * of its own (see the skip in `buildGalleries`).
   */
  tourByName: Map<string, GalleryDef>;
  /**
   * `venue|city|state` → its gallery, for venues that cleared
   * `VENUE_MIN_SHOWS`. Keyed on all three because venue names repeat across
   * cities; most venues are not in here.
   */
  venueByKey: Map<string, GalleryDef>;
}

/** A venue needs this many shows to earn its own gallery page. */
export const VENUE_MIN_SHOWS = 10;

/**
 * How many days may separate two shows and still count as one run. A run is
 * 2+ shows at one venue on *adjacent performance dates* — the band not playing
 * in between (a "dark day", e.g. the union days that break up the Madison
 * Square Garden stands) must not split it. 3 covers every gap in the corpus;
 * anything larger is a separate visit.
 */
export const RUN_MAX_GAP_DAYS = 3;

/** Root URL segments gallery slugs must never claim. */
export const RESERVED_SLUGS = [
  'all',
  'about',
  'builder',
  'placeholder',
  'gallery',
  'progress',
];

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip combining marks: Zénith → Zenith
      .toLowerCase()
      // Intra-word punctuation is *removed*, not turned into a separator, so
      // `Dick's Picks` slugs as `dicks-picks` rather than `dick-s-picks`, where
      // the orphaned `s` reads as a word. Apostrophes and periods only: a hyphen
      // has to keep separating, or `Black-Throated Wind` would collapse into
      // `blackthroated-wind`.
      .replace(/['’.]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
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
  if (isShowId(slug)) {
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

const RUN_MONTHS = [
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

/**
 * Physical venue identity. The bare name repeats across cities (two Capitol
 * Theatres), and two venues sharing a name are not one run.
 */
function venueKey(show: Pick<ShowSummary, 'venue' | 'city' | 'state'>): string {
  return `${show.venue}|${show.city}|${show.state ?? ''}`;
}

/** ISO date → whole days since epoch, for gap arithmetic. */
function toDayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * A run is 2+ shows at one venue on adjacent performance dates: consecutive in
 * the corpus (so the band played nowhere else in between) and no more than
 * RUN_MAX_GAP_DAYS apart (so dark days don't split a stand). Named
 * `Venue Month Year` from the run's FIRST show — three runs in the corpus cross
 * a month boundary, which is why the name can't be derived from the calendar
 * month alone.
 *
 * Derived rather than authored: it reproduces the groupings the retired
 * `collection` field used to carry by hand, stays correct as shows are added,
 * and puts no redundant string on the 137 shows that belong to a run.
 *
 * Sorts defensively — unlike the other groupings, membership here depends on
 * source order, so an unsorted corpus would silently produce wrong runs.
 */
export function buildRuns(
  source: ShowSummary[],
): { name: string; shows: ShowSummary[] }[] {
  // Tiebreak on id, not just date: a two-show night puts two shows on one date,
  // and the id's ordinal (…01 before …02) is what orders them.
  const ordered = [...source].sort(
    (showA, showB) =>
      showA.date.localeCompare(showB.date) || showA.id.localeCompare(showB.id),
  );
  const runs: ShowSummary[][] = [];
  let current: ShowSummary[] = [];
  for (const show of ordered) {
    const previous = current[current.length - 1];
    const continues =
      previous !== undefined &&
      venueKey(previous) === venueKey(show) &&
      toDayNumber(show.date) - toDayNumber(previous.date) <= RUN_MAX_GAP_DAYS;
    if (continues) {
      current.push(show);
    } else {
      if (current.length > 1) runs.push(current);
      current = [show];
    }
  }
  if (current.length > 1) runs.push(current);

  return runs.map((runShows) => {
    const [first] = runShows;
    const month = RUN_MONTHS[Number(first.date.slice(5, 7)) - 1];
    return {
      name: `${first.venue} ${month} ${first.date.slice(0, 4)}`,
      shows: runShows,
    };
  });
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
 * Group shows by EACH of several keys — unlike `groupBy`, one show can land in
 * more than one group. Tags are many-per-show, which is the whole point of
 * them being the editorial layer.
 */
function groupByEach(
  source: ShowSummary[],
  keysOf: (show: ShowSummary) => string[],
): Map<string, ShowSummary[]> {
  const groups = new Map<string, ShowSummary[]>();
  for (const show of source) {
    for (const key of keysOf(show)) {
      const group = groups.get(key);
      if (group) group.push(show);
      else groups.set(key, [show]);
    }
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
  // `venueKey`, not an inline equivalent: the same key is what `venueByKey`
  // below is built from, and the lookup would break silently if the two ever
  // drifted apart.
  const venueGroups = groupBy(source, venueKey);
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

  // Keyed by venue + city + state rather than name, because the name alone
  // isn't unique — that's the whole reason an ambiguous venue's slug and title
  // get city-suffixed. Every show in a venue gallery shares the group key, so
  // the first one carries it.
  const venueByKey = new Map<string, GalleryDef>();
  for (const gallery of venueGalleries) {
    venueByKey.set(venueKey(gallery.shows[0]), gallery);
  }

  // Runs last: the most specific slug (venue + month + year), so anything it
  // collides with is a real problem and register() should throw.
  const runGalleries = buildRuns(source).map(
    ({ name, shows: runShows }): GalleryDef => ({
      slug: slugify(name),
      title: name,
      kind: 'run',
      shows: runShows,
    }),
  );
  for (const gallery of runGalleries) register(bySlug, gallery);

  const runByShowId = new Map<string, GalleryDef>();
  for (const gallery of runGalleries) {
    for (const show of gallery.shows) runByShowId.set(show.id, gallery);
  }

  // Tags — the editorial layer, so these are index pages rather than nav:
  // reachable from the tags on a show, not from the drawer. Alphabetical by
  // tag, and a show appears in every tag index it carries (many-to-many, which
  // is exactly what the retired single-valued `collection` could not express).
  const tagGalleries = [...groupByEach(source, (show) => show.tags ?? [])]
    .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
    .map(
      ([tag, tagShows]): GalleryDef => ({
        slug: slugify(tag),
        title: tag,
        kind: 'tag',
        shows: tagShows,
      }),
    );
  for (const gallery of tagGalleries) register(bySlug, gallery);

  // Keyed by the name as authored — these galleries' titles ARE their source
  // values. Tours that were skipped (bare-year) are simply absent.
  const tagByName = new Map<string, GalleryDef>();
  for (const gallery of tagGalleries) tagByName.set(gallery.title, gallery);
  const tourByName = new Map<string, GalleryDef>();
  for (const gallery of tourGalleries) tourByName.set(gallery.title, gallery);

  // Drawer sections deliberately exclude runs — 40 entries would swamp the
  // nav. They are still real pages; `subGalleries` is what routes are built
  // from.
  const sections: GallerySection[] = [
    { label: 'Years', galleries: yearGalleries },
    { label: 'Tours', galleries: tourGalleries },
    { label: 'Venues', galleries: venueGalleries },
  ].filter((section) => section.galleries.length > 0);

  return {
    all: { slug: '', title: 'All Shows', kind: 'all', shows: source },
    sections,
    subGalleries: [...bySlug.values()],
    bySlug,
    runByShowId,
    tagByName,
    tourByName,
    venueByKey,
  };
}

// Computed once from the real index; the app imports these.
const registry = buildGalleries(shows);

export const allShowsGallery = registry.all;
export const gallerySections = registry.sections;
/** Every sub-gallery page — what routers and the Worker enumerate. */
export const allSubGalleries = registry.subGalleries;

export function findGallery(slug: string): GalleryDef | undefined {
  return registry.bySlug.get(slug);
}

/** The run a show belongs to, if any. Undefined for one-off shows. */
export function findRunForShow(showId: string): GalleryDef | undefined {
  return registry.runByShowId.get(showId);
}

/**
 * The index page for a tag, keyed by the tag as authored. Every tag in the
 * corpus has one (they're derived from the corpus), so this only returns
 * undefined for a tag that isn't in the data — callers should fall back to
 * rendering the tag as plain text rather than linking nowhere.
 */
export function findTagGallery(tag: string): GalleryDef | undefined {
  return registry.tagByName.get(tag);
}

/**
 * The gallery for a tour, keyed by the tour as authored. Returns undefined for
 * a bare-year tour (e.g. "1969"), which has no page of its own because the
 * year gallery covers the same shows — callers should render the tour as plain
 * text in that case rather than linking to a page titled something else.
 */
export function findTourGallery(tour: string): GalleryDef | undefined {
  return registry.tourByName.get(tour);
}

/**
 * The gallery for a show's venue, if that venue earned one.
 *
 * Most venues have not — a page needs `VENUE_MIN_SHOWS` shows — so callers
 * should render the venue as plain text when this returns undefined. Takes the
 * show rather than a name because venue names repeat across cities and the
 * gallery is identified by venue + city + state.
 */
export function findVenueGallery(
  show: Pick<ShowSummary, 'venue' | 'city' | 'state'>,
): GalleryDef | undefined {
  return registry.venueByKey.get(venueKey(show));
}
