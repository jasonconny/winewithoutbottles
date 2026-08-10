/**
 * Show importer (dev tool, run via tsx). Drafts a show's setlist and timings
 * from the official release that contains it, so shows can be added or retimed
 * without transcribing track listings by hand.
 *
 *   tsx generator/import.ts 19760617           # diff against the authored show
 *   tsx generator/import.ts 19780708 --write   # write data/shows/1978/19780708.json
 *   tsx generator/import.ts 19770425 --release "30 Trips Around the Sun"
 *
 * Default mode never writes: for a show that already exists it prints a
 * track-by-track diff (the retime audit), and for a new one it prints the draft.
 * `--write` applies it; on an existing file that is a deliberate overwrite of
 * authored data, so it always shows the diff first.
 *
 * The source is chosen from `data/releases.json` by precedence — complete
 * before unknown before partial, then box before series volume before
 * standalone — or named outright with `--release`.
 *
 * Wikipedia is the only fetch. Its track listings carry both `m:ss` durations
 * (the exact form the corpus stores) and the per-show sectioning that says
 * which night a track belongs to; MusicBrainz has finer precision the corpus
 * would throw away, and no per-show attribution at all on a box set.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ShowFile } from '../src/wwob/index.ts';
import { formatDuration, parseDuration } from '../src/wwob/index.ts';
import { articles, longDate, monthDayIn, slashDate } from './wiki.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Release {
  page: string | null;
  name: string;
  kind: string;
  series: string | null;
  eligible: boolean;
  tag: string | null;
  dates: string[];
  bonusDates: string[];
  completeness: 'complete' | 'partial' | 'unknown';
  note: string;
}

interface SongEntry {
  title: string;
  aliases?: string[];
}

const releases = (
  JSON.parse(readFileSync(join(root, 'data/releases.json'), 'utf8')) as {
    releases: Release[];
  }
).releases;

const songData = JSON.parse(
  readFileSync(join(root, 'data/songs.json'), 'utf8'),
) as {
  songs: SongEntry[];
  /**
   * Track names that are a continuation of the preceding track, not a song of
   * their own. Terrapin Station (Ltd) spells the drums segment across three
   * tracks — "Drums" / "And" / "Space" — so "And" is 3:43 belonging to Drums.
   */
  foldIntoPrevious: string[];
  /**
   * Tracks that get no stripe. Two kinds: not music at all (tuning, banter,
   * introductions), and music that isn't a canonical song — the Dead teased
   * `Funiculì, Funiculà` for 28 seconds, and neither DeadBase nor JerryBase
   * counts it as a performance.
   */
  notASong: string[];
};
const registry = songData.songs;
const foldIntoPrevious = new Set(
  songData.foldIntoPrevious.map((t) => t.toLowerCase()),
);
const notASong = new Set(songData.notASong.map((t) => t.toLowerCase()));

/** Alias → canonical, plus every canonical title mapped to itself. */
const canonicalByLower = new Map<string, string>();
for (const song of registry) {
  canonicalByLower.set(song.title.toLowerCase(), song.title);
  for (const alias of song.aliases ?? []) {
    canonicalByLower.set(alias.toLowerCase(), song.title);
  }
}

const COMPLETENESS_RANK = { complete: 0, unknown: 5, partial: 10 } as const;
const KIND_RANK = (release: Release) =>
  release.kind === 'box' ? 0 : release.series ? 1 : 2;

/** Best release to source a given date from, or null if nothing carries it. */
function chooseSource(date: string): Release | null {
  const carrying = releases.filter(
    (release) => release.eligible && release.dates.includes(date),
  );
  if (!carrying.length) return null;
  return carrying.sort(
    (a, b) =>
      COMPLETENESS_RANK[a.completeness] +
      KIND_RANK(a) -
      (COMPLETENESS_RANK[b.completeness] + KIND_RANK(b)),
  )[0];
}

/**
 * Strip a wikitext track line down to its song title.
 *
 * Track lines carry more than the title: wikilinks that display something other
 * than their target (`[[Rain and Snow|Cold Rain and Snow]]`), songwriter
 * credits, segue markers in two flavours (`>` and Europe '72's `→`), reference
 * tags, and typographic apostrophes. All of it has to go, because the colour
 * algorithm hashes the title's words — a stray credit would repaint the stripe.
 */
function cleanWikiTitle(raw: string): string {
  return raw
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/''+/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*[>→]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Drop reference tags and comments, and expand the quote templates.
 *
 * `{{'"}}` renders as an apostrophe followed by a closing quote, so the source
 * for "Truckin'" is `"Truckin{{'"}}`. Left alone, the quote *inside* the
 * template ends the title early and yields `Truckin{{'`. Expanding first is
 * what makes the surrounding quotes findable at all.
 */
function stripMarkup(line: string): string {
  return (
    line
      .replace(/<ref[^>]*\/>/g, '')
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // Punctuation templates come in several shapes — {{'"}}, {{-"}}, {{' "}} —
      // all of them a mix of apostrophe, quote, hyphen and space standing in for
      // the real characters. Expand to just the apostrophes and quotes; the
      // hyphen is a join hint that renders as nothing.
      .replace(/\{\{(['"\- ]{1,4})\}\}/g, (_, inner: string) =>
        inner.replace(/[- ]/g, ''),
      )
      .replace(/&nbsp;/g, ' ')
  );
}

interface ParsedTrack {
  title: string;
  /** null when the article lists the track but gives it no time. */
  duration: string | null;
}

/**
 * Parse one `#`-prefixed track line into title and duration.
 *
 * Shape: an optional `<li value=N>` restart, the title in quotes, an optional
 * segue marker, optional songwriter credits, then `– m:ss`. The duration is
 * taken as the first dashed time *after* the title, not the last time on the
 * line: trailing parentheticals ("previously released on…") can carry their own.
 */
function parseTrack(line: string): ParsedTrack | null {
  const text = stripMarkup(line).replace(/^[#|]\s*(<li value=\d+>)?\s*/, '');
  // A track can carry two titles and one time — Dick's Picks 29 lists
  // `"Lady with a Fan" / "Terrapin Station" – 11:43`. Take the last: it's the
  // song the corpus knows, the earlier name being its opening movement. There
  // is only one duration, so splitting would mean inventing a boundary.
  const quoted = text.match(/^(?:"[^"]+"\s*[/>→]\s*)*"([^"]+)"/);
  if (!quoted) return null;
  const rest = text.slice(quoted[0].length);
  const timed = rest.match(/[–—-]\s*(\d{1,3}:\d{2})/);
  const title = cleanWikiTitle(quoted[1]);
  // A title with no time is still a real track: several articles list whole
  // discs untimed. Keep it so the caller can say so, rather than silently
  // shortening the show.
  return title ? { title, duration: timed ? timed[1] : null } : null;
}

/**
 * Split a release's track listing into per-show buckets.
 *
 * Walks the article top to bottom keeping a "current date", flipped by the same
 * heading shapes the release index reads (section headings, italic
 * sub-headings, bold night headings). Tracks land under whichever date was last
 * seen, which is what makes a box set's discs separable at all — and a
 * "Bonus tracks – March 24, 1990" heading flips to that date too, keeping
 * material from a night the release doesn't otherwise carry out of the show.
 *
 * A single-date release usually has no headings before its first track, so the
 * current date starts on its one date; a multi-date release starts unset, and
 * any track before the first heading is reported rather than misfiled.
 */
/** Sentinel for a heading naming a date the release index doesn't list. */
const UNKNOWN_DATE = '\u0000unknown';

function tracksByDate(
  wikitext: string,
  release: Release,
): { byDate: Map<string, ParsedTrack[]>; orphans: number } {
  // The window for resolving year-less headings has to cover bonus dates too,
  // or a "June 12 – First set:" heading on a 6/9 release won't resolve, will
  // read as undated, and will hand its tracks to the show in progress.
  const all = [...release.dates, ...release.bonusDates].sort();
  const span = all.length ? { first: all[0], last: all[all.length - 1] } : null;
  const known = new Set(all);
  const byDate = new Map<string, ParsedTrack[]>();
  // `main` is the show the listing is currently working through; `current` can
  // dip to a bonus date for a block and must come back.
  let main: string | null =
    release.dates.length === 1 ? release.dates[0] : null;
  let current = main;
  let orphans = 0;

  const headingDate = (line: string): string | null => {
    const heading =
      line.match(/^=+(.*?)=+\s*$/) ??
      line.match(/^:+''(.+?)''/) ??
      line.match(/^'''(.+?)'''/);
    if (!heading) return null;
    const inner = heading[1];
    const found =
      longDate(inner) ??
      slashDate(inner) ??
      monthDayIn(inner, span) ??
      // A bonus heading can name a date outside the release's own span.
      (/bonus/i.test(inner) ? longDate(line) : null);
    if (!found) return null;
    // A date the index doesn't list means the article covers material the index
    // doesn't know about. Return UNKNOWN rather than null: null would make this
    // read as an undated heading and hand the tracks to the show in progress.
    return known.has(found) ? found : UNKNOWN_DATE;
  };

  for (const line of wikitext.split('\n')) {
    const isHeading =
      /^=+.*=+\s*$/.test(line) || /^:+''/.test(line) || /^'''/.test(line);
    if (isHeading) {
      const flipped = headingDate(line);
      if (flipped) {
        current = flipped === UNKNOWN_DATE ? null : flipped;
        // Only a date the release actually *contains* becomes the new main
        // show; a bonus date is a detour.
        if (release.dates.includes(flipped)) main = flipped;
      } else if (/bonus/i.test(line)) {
        // A bonus heading that names no date — Download Series 4 just says
        // "Bonus tracks:" — is still bonus. Orphan it rather than letting the
        // undated rule below hand nine extra tracks to the show.
        current = null;
      } else {
        // An undated heading — "Disc 3", "Second set, continued:" — belongs to
        // the show in progress. Without this, a bonus block mid-listing
        // silently swallows every track after it: Dave's Picks 50 filed its
        // whole third disc under a May 4 bonus heading.
        current = main;
      }
      continue;
    }
    // Track rows are `#` lists, or `|"Title"` rows inside an {{ordered list}}.
    if (!line.startsWith('#') && !/^\|\s*"/.test(line)) continue;
    const track = parseTrack(line);
    if (!track) continue;
    if (!current) {
      orphans++;
      continue;
    }
    const key = track.title.toLowerCase();
    // Not a song: no stripe. Covers tuning and banter, and teases the
    // setlist databases don't count as performances.
    if (notASong.has(key)) continue;
    const bucket = byDate.get(current) ?? [];
    const previous = bucket[bucket.length - 1];
    // A continuation adds its time to the track it continues; with nothing to
    // continue it is dropped rather than standing alone under a name that
    // isn't a song.
    if (foldIntoPrevious.has(key)) {
      if (previous?.duration && track.duration) {
        previous.duration = formatDuration(
          parseDuration(previous.duration) + parseDuration(track.duration),
        );
      }
      continue;
    }
    byDate.set(current, [...bucket, track]);
  }
  return { byDate, orphans };
}

/** Map an imported title onto the canonical registry entry, or report it. */
function canonicalise(tracks: ParsedTrack[]) {
  const mapped: ParsedTrack[] = [];
  const unknown: string[] = [];
  for (const track of tracks) {
    const canonical = canonicalByLower.get(track.title.toLowerCase());
    if (canonical)
      mapped.push({ ...track, duration: track.duration, title: canonical });
    else {
      unknown.push(track.title);
      mapped.push(track);
    }
  }
  return { mapped, unknown };
}

const showPath = (id: string) =>
  join(root, 'data/shows', id.slice(0, 4), `${id}.json`);

/**
 * Serialise a show the way the corpus is authored: one song per line.
 *
 * `JSON.stringify(…, 2)` would explode every song onto four lines, and Prettier
 * cannot collapse them back — it preserves whether the source had a newline
 * after `{`. That would turn a one-line timing fix into a whole-file diff.
 */
function serialiseShow(show: ShowFile): string {
  const { songs, ...meta } = show;
  const head = JSON.stringify(meta, null, 2).replace(/\n}$/, '');
  const lines = songs.map(
    (song) =>
      `    { "title": ${JSON.stringify(song.title)}, "duration": ${JSON.stringify(song.duration)} }`,
  );
  return `${head},\n  "songs": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

function fmt(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}

/** Track-by-track comparison of authored data against the imported listing. */
function diff(existing: ShowFile, imported: ParsedTrack[]) {
  const rows = Math.max(existing.songs.length, imported.length);
  let changed = 0;
  let before = 0;
  let after = 0;
  console.log('\n  #   authored                          imported');
  for (let i = 0; i < rows; i++) {
    const was = existing.songs[i];
    const now = imported[i];
    before += was ? parseDuration(was.duration) : 0;
    after += now?.duration ? parseDuration(now.duration) : 0;
    const same =
      was && now && was.title === now.title && was.duration === now.duration;
    if (!same) changed++;
    const left = was ? `${was.title} ${was.duration}` : '—';
    const right = now ? `${now.title} ${now.duration ?? '(untimed)'}` : '—';
    const delta =
      was && now?.duration && was.duration !== now.duration
        ? `  (${fmt(parseDuration(now.duration) - parseDuration(was.duration))})`
        : '';
    console.log(
      `  ${same ? ' ' : '!'} ${String(i + 1).padStart(2)}  ${left.padEnd(32).slice(0, 32)}  ${right.padEnd(32).slice(0, 32)}${delta}`,
    );
  }
  console.log(
    `\n  ${existing.songs.length} → ${imported.length} tracks, ${changed} rows differ; total ${fmt(after - before)}`,
  );
  return changed;
}

/**
 * Sweep every corpus show that has a source and report the deltas — the retime
 * audit. Read-only; it exists so the numbers behind a batch of rewrites are
 * reviewable before any file changes.
 */
async function audit() {
  const dataDir = join(root, 'data/shows');
  const shows: ShowFile[] = [];
  for (const year of readdirSync(dataDir)) {
    for (const file of readdirSync(join(dataDir, year))) {
      shows.push(JSON.parse(readFileSync(join(dataDir, year, file), 'utf8')));
    }
  }
  const jobs = shows
    .map((show) => ({ show, source: chooseSource(show.date) }))
    .filter((job): job is { show: ShowFile; source: Release } =>
      Boolean(job.source?.page),
    )
    .sort((a, b) => a.show.date.localeCompare(b.show.date));

  // One fetch per release, not per show: a 22-show box would otherwise be
  // pulled 22 times.
  const pages = [...new Set(jobs.map((job) => job.source.page!))];
  console.log(
    `auditing ${jobs.length} shows across ${pages.length} releases…\n`,
  );
  const text = await articles(pages);

  const unknownTitles = new Set<string>();
  let failed = 0;
  let untimedShows = 0;
  console.log('show       tracks      total   source');
  for (const { show, source } of jobs) {
    const wikitext = text.get(source.page!);
    if (!wikitext) {
      console.log(`${show.id}   — could not fetch ${source.page}`);
      failed++;
      continue;
    }
    const { byDate } = tracksByDate(wikitext, source);
    const raw = byDate.get(show.date) ?? [];
    if (!raw.length) {
      console.log(`${show.id}   !! no tracks matched — ${source.name}`);
      failed++;
      continue;
    }
    const { mapped, unknown } = canonicalise(raw);
    for (const title of unknown) unknownTitles.add(title);
    const untimed = mapped.filter((track) => !track.duration).length;
    if (untimed) {
      console.log(
        `${show.id}   ${String(mapped.length).padStart(2)}      untimed   ${source.name.slice(0, 40)} (${untimed}/${mapped.length} without a time)`,
      );
      untimedShows++;
      continue;
    }
    const before = show.songs.reduce(
      (a, s) => a + parseDuration(s.duration),
      0,
    );
    const after = mapped.reduce((a, s) => a + parseDuration(s.duration!), 0);
    const counts =
      show.songs.length === mapped.length
        ? `${String(mapped.length).padStart(2)}     `
        : `${String(show.songs.length).padStart(2)}→${String(mapped.length).padEnd(3)} !`;
    console.log(
      `${show.id}   ${counts}  ${fmt(after - before).padStart(7)}   ${source.name.slice(0, 40)}`,
    );
  }
  if (unknownTitles.size) {
    console.log(`\n${unknownTitles.size} title(s) not in data/songs.json:`);
    for (const title of [...unknownTitles].sort()) console.log(`   ${title}`);
  }
  console.log(
    `\n${jobs.length - failed - untimedShows} timed, ${untimedShows} untimed in the article, ${failed} unparsed`,
  );
}

const args = process.argv.slice(2);
if (args.includes('--audit')) {
  await audit();
  process.exit(0);
}

const id = args.find((a) => /^\d{8}$/.test(a));
if (!id) {
  console.error(
    'usage: tsx generator/import.ts <YYYYMMDD> [--write] [--release "<name>"]\n' +
      '       tsx generator/import.ts --audit',
  );
  process.exit(1);
}
const write = args.includes('--write');
const releaseAt = args.indexOf('--release');
const named = releaseAt >= 0 ? args[releaseAt + 1] : null;

const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
const source = named
  ? (releases.find((r) => r.name === named) ?? null)
  : chooseSource(date);

if (!source) {
  console.error(
    named
      ? `no release named "${named}" in data/releases.json`
      : `no eligible release carries ${date}`,
  );
  process.exit(1);
}
if (!source.page) {
  console.error(`"${source.name}" has no Wikipedia article to read`);
  process.exit(1);
}

console.log(`${date} ← ${source.name} (${source.completeness})`);
if (source.completeness !== 'complete') {
  console.log(`  ! ${source.note}`);
}

const wikitext = (await articles([source.page])).get(source.page);
if (!wikitext) {
  console.error(`could not fetch "${source.page}"`);
  process.exit(1);
}

const { byDate, orphans } = tracksByDate(wikitext, source);
const raw = byDate.get(date) ?? [];
if (orphans) {
  console.log(
    `  ! ${orphans} track(s) before the first dated heading — ignored`,
  );
}
if (!raw.length) {
  console.error(
    `no tracks found for ${date}; the article's headings may not match the index`,
  );
  process.exit(1);
}

const { mapped, unknown } = canonicalise(raw);
if (unknown.length) {
  console.log(`\n  ! ${unknown.length} title(s) not in data/songs.json:`);
  for (const title of [...new Set(unknown)]) console.log(`      ${title}`);
  console.log('    Add them there deliberately, or map them with an alias.');
}

/**
 * Narrow to fully-timed tracks, or refuse.
 *
 * Several articles list whole discs with titles but no times. A show written
 * from those would be silently wrong — stripe widths come from durations — so
 * the tool stops rather than guessing or dropping the untimed tracks.
 */
function requireTimed(
  tracks: ParsedTrack[],
): { title: string; duration: string }[] {
  const untimed = tracks.filter((track) => !track.duration);
  if (untimed.length) {
    console.error(
      `\n${untimed.length} of ${tracks.length} tracks have no duration in the article ` +
        `(${untimed
          .slice(0, 3)
          .map((t) => t.title)
          .join(', ')}${untimed.length > 3 ? '…' : ''}).` +
        '\nThis release cannot source the show from Wikipedia alone.',
    );
    process.exit(1);
  }
  return tracks as { title: string; duration: string }[];
}

const path = showPath(id);
const exists = existsSync(path);

if (exists) {
  const current = JSON.parse(readFileSync(path, 'utf8')) as ShowFile;
  const changed = diff(current, mapped);
  if (!write) {
    console.log(
      changed
        ? '\n  (diff only — pass --write to apply)'
        : '\n  already matches the release',
    );
    process.exit(0);
  }
  writeFileSync(
    path,
    serialiseShow({ ...current, songs: requireTimed(mapped) }),
  );
  console.log(`\n✓ rewrote ${path.replace(`${root}/`, '')}`);
} else {
  const draft: ShowFile = {
    id,
    date,
    venue: '',
    city: '',
    songs: requireTimed(mapped),
  };
  if (!write) {
    console.log(`\n${serialiseShow(draft)}`);
    console.log('  (draft only — pass --write to create the file)');
    process.exit(0);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serialiseShow(draft));
  console.log(
    `\n✓ wrote ${path.replace(`${root}/`, '')} — venue/city are blank, fill them in`,
  );
}
