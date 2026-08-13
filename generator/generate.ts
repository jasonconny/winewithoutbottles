/**
 * Offline WWOB generator. Reads hand-authored show data, runs the (framework-free)
 * `src/wwob` machine, and writes:
 *   - one export-grade SVG per show       →  public/shows/<id>.svg
 *   - one full detail JSON per show       →  public/shows/<id>.json  (fetched on
 *                                            demand by the Show reader)
 *   - a light, songs-free index the app   →  src/data/shows.generated.ts
 *     bundles for list/nav views
 *
 * Run with `npm run generate`. Re-run whenever you add or edit a show.
 *
 * Pass one or more filters to regenerate only matching shows' per-show artifacts
 * (SVG + detail JSON):
 *   npm run generate 19770508              # one show by id
 *   npm run generate 19770508.json         # …or by filename
 *   npm run generate data/shows/1977/19770508.json  # …or by path
 *   npm run generate '1977*' '1989*'       # globs (quote them so the shell
 *                                          # doesn't expand them first)
 * The index is always rebuilt from every show, so it stays complete and
 * correctly sorted regardless of which per-show artifacts were (re)written.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStripes,
  parseDuration,
  svgMarkup,
  totalWidth,
} from '../src/wwob/index.ts';
import type {
  Show,
  ShowDetail,
  ShowFile,
  ShowSummary,
  Song,
} from '../src/wwob/index.ts';

/** Uniform export height; the SVG scales, so this is just the canonical unit. */
const HEIGHT = 100;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data', 'shows');
const svgOutDir = join(root, 'public', 'shows');
const manifestOut = join(root, 'src', 'data', 'shows.generated.ts');

function parseShow(file: ShowFile, source: string): Show {
  if (!file.id || !Array.isArray(file.songs) || file.songs.length === 0) {
    throw new Error(`${source}: missing id or songs`);
  }
  const songs: Song[] = file.songs.map((s, i) => {
    if (!s.title || !s.duration) {
      throw new Error(`${source}: song ${i + 1} missing title or duration`);
    }
    return { title: s.title, durationSeconds: parseDuration(s.duration) };
  });
  return { ...file, songs };
}

/**
 * Reduce a CLI filter to a bare show id pattern: drop any directory, drop the
 * `.json` extension, leave globs (`*`) intact.
 */
function filterToPattern(filter: string): string {
  const base = filter.replace(/^.*[/\\]/, '');
  return base.endsWith('.json') ? base.slice(0, -'.json'.length) : base;
}

/** Build a matcher from CLI args. No args → matches everything. */
function makeMatcher(filters: string[]): (id: string) => boolean {
  if (filters.length === 0) return () => true;
  const patterns = filters.map((filter) => {
    const escaped = filterToPattern(filter).replace(
      /[.+?^${}()|[\]\\]/g,
      '\\$&',
    );
    return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
  });
  return (id: string) => patterns.some((re) => re.test(id));
}

/** Light index entry — no `songs`, so the bundle stays small as shows grow. */
function toSummary(show: Show): ShowSummary {
  return {
    id: show.id,
    date: show.date,
    venue: show.venue,
    city: show.city,
    state: show.state,
    country: show.country,
    tour: show.tour,
    tags: show.tags,
    svg: `/shows/${show.id}.svg`,
    songCount: show.songs.length,
    durationSeconds: show.songs.reduce(
      (total, song) => total + song.durationSeconds,
      0,
    ),
  };
}

/** Full per-show detail = the index summary plus the setlist. */
function toDetail(summary: ShowSummary, songs: Song[]): ShowDetail {
  return { ...summary, songs };
}

function main(): void {
  const filters = process.argv.slice(2);
  const matches = makeMatcher(filters);

  // Recursive so shows can live in data/shows/<year>/<id>.json subdirectories.
  const files = (readdirSync(dataDir, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) throw new Error(`No show data in ${dataDir}`);

  mkdirSync(svgOutDir, { recursive: true });
  const index: ShowSummary[] = [];
  let written = 0;

  for (const file of files) {
    const raw = JSON.parse(
      readFileSync(join(dataDir, file), 'utf8'),
    ) as ShowFile;
    const show = parseShow(raw, file);
    const summary = toSummary(show);
    // Every show feeds the index; only matched shows get their per-show
    // artifacts (SVG + detail JSON) rewritten.
    index.push(summary);
    if (!matches(show.id)) continue;
    const stripes = buildStripes(show.songs);
    writeFileSync(
      join(svgOutDir, `${show.id}.svg`),
      svgMarkup(stripes, HEIGHT) + '\n',
    );
    writeFileSync(
      join(svgOutDir, `${show.id}.json`),
      JSON.stringify(toDetail(summary, show.songs), null, 2) + '\n',
    );
    written++;
    console.log(
      `✓ ${show.id} — ${show.songs.length} songs, ${totalWidth(stripes)}px wide`,
    );
  }

  if (filters.length > 0 && written === 0) {
    throw new Error(
      `No shows matched: ${filters.join(', ')}. ` +
        `Check data/shows/ for available ids.`,
    );
  }
  if (filters.length > 0) {
    console.log(`  (selective: ${written} of ${files.length} shows rewritten)`);
  }

  // Date first, then id: a two-show night shares one date, and the id suffixes
  // (`-early` < `-late`) are what put the two performances in the order played.
  index.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const banner =
    '// GENERATED by `npm run generate` from data/shows/**/*.json — do not edit by hand.\n';
  // Relative (not `@/`): the index feeds src/galleries.ts, which the Cloudflare
  // Worker imports too, and wrangler's bundler can't resolve path-prefix aliases.
  const body = `import type { ShowSummary } from '../wwob/index.ts';\n\nexport const shows: ShowSummary[] = ${JSON.stringify(
    index,
    null,
    2,
  )};\n`;
  mkdirSync(dirname(manifestOut), { recursive: true });
  writeFileSync(manifestOut, banner + body);
  console.log(`✓ index → src/data/shows.generated.ts (${index.length} shows)`);
}

main();
