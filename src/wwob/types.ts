export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Song {
  title: string;
  /** Song length in whole seconds. */
  durationSeconds: number;
}

export interface Stripe {
  title: string;
  rgb: Rgb;
  /** Stripe width in pixels (100px per minute). */
  width: number;
  /** Cumulative x offset of this stripe within the piece. */
  x: number;
}

/** Show metadata shared by the on-disk, parsed, and manifest shapes. */
export interface ShowMeta {
  /** Stable id, e.g. "1972-08-27". */
  id: string;
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  venue: string;
  city: string;
  state?: string;
  country?: string;
  /** Named tour, e.g. "Summer 1972". */
  tour?: string;
  /**
   * Editorial tags — the many-to-many curation layer, aimed at tag index
   * pages. Deliberately sparse: anything restating `date`/`tour`/`venue`/`city`
   * belongs to those fields, and runs are derived (see `buildRuns` in
   * src/galleries.ts), so a tag is only for what no facet can express, e.g.
   * ["Dark Star", "Shows I Attended"].
   */
  tags?: string[];
}

/** A show as authored on disk (`data/shows/*.json`); durations as "m:ss" strings. */
export interface ShowFile extends ShowMeta {
  /**
   * Where the timings came from — an official release name as spelled in
   * `data/releases.json`, several comma-separated when a show was stitched from
   * more than one, or `archive.org:<identifier>` for an unreleased show.
   *
   * Deliberately on `ShowFile` and not `ShowMeta`: it exists to answer
   * "should this be re-timed?" and to make a source swap auditable, so it never
   * reaches `ShowSummary`, the bundled index, or the UI.
   */
  source?: string;
  songs: { title: string; duration: string }[];
}

/** A parsed, in-memory show (durations in seconds). */
export interface Show extends ShowMeta {
  songs: Song[];
}

/**
 * Light index entry the app reads from the in-bundle manifest
 * (`src/data/shows.generated.ts`). No `songs` — kept small so the bundle stays
 * roughly flat as the show count grows. Used by list/nav views (Gallery,
 * Placeholder).
 */
export interface ShowSummary extends ShowMeta {
  /** Public path to the generated SVG, e.g. "/shows/1972-08-27.svg". */
  svg: string;
  songCount: number;
  /** Total show length in whole seconds (sum of song durations). */
  durationSeconds: number;
}

/**
 * Full per-show detail, written to `public/shows/<id>.json` and fetched on
 * demand by the Show reader (the only view that needs `songs`).
 */
export interface ShowDetail extends ShowSummary {
  songs: Song[];
}
