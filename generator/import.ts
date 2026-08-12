/**
 * Show importer (dev tool, run via tsx). Drafts a show's setlist and timings
 * from the official release that contains it, so shows can be added or retimed
 * without transcribing track listings by hand.
 *
 *   tsx generator/import.ts 19760617           # diff against the authored show
 *   tsx generator/import.ts 19780708 --write   # write data/shows/1978/19780708.json
 *   tsx generator/import.ts 19770425 --release "30 Trips Around the Sun"
 *   tsx generator/import.ts 19690607 --partial --release "Enjoying the Ride"
 *
 * `--partial` stages a show no release can source whole into
 * `data/partial-shows/<id>.json`: the setlist skeleton comes from an archive.org
 * soundboard (the only source that knows what was *played*), the release's
 * timings are merged onto it, and the songs it doesn't carry are left with an
 * empty duration for Jason to fill from whichever source he judges right. It
 * never writes into `data/shows/`, so an unfinished show cannot reach the
 * generator or the site; promotion is a plain `mv` into `data/shows/<year>/`.
 * `tests/data-validity.test.ts` guards the staged files' *format* — ids, titles,
 * durations — so a mistake surfaces while authoring rather than at promotion.
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
import type { Recording } from './archive.ts';
import { findRecordings, recordingTracks } from './archive.ts';
import { tracksByDateFromMusicBrainz } from './musicbrainz.ts';
import { articles, longDate, monthDayIn, slashDate } from './wiki.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * How many archive.org tapes --partial will open to find the fullest one.
 * Each costs a metadata request; six covers every date in the corpus so far.
 */
const MAX_CANDIDATES = 6;

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
  return (
    raw
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/''+/g, '')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      // Trailing segue markers, and a trailing colon left by broken markup:
      // Enjoying the Ride writes `#"The Other One: > (Weir, Kreutzmann) – 20:45`,
      // never closing the quote, so the unquoted fallback keeps the colon and
      // mints `The Other One:` as a separate song from `The Other One`. No song
      // title ends in a colon, so stripping one is safe; repeat the group so
      // `: >` comes off in either order.
      .replace(/(?:\s*[>→:])+\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
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
/** Title of a track line that carries no usable quotes. */
function unquotedTitle(text: string): string {
  return (
    text
      .split(/\s*\(/)[0]
      .split(/\s+[–—-]\s+/)[0]
      // A stray quote can sit on either end when the pair is unbalanced.
      .replace(/^["'\s]+/, '')
      .replace(/["'\s>→]+$/, '')
      .trim()
  );
}

function parseTrack(line: string): ParsedTrack | null {
  // The value attribute may be quoted (`<li value="7">`), bare, or spaced
  // (`<li value= 5>`); 30 Trips uses the quoted form, and missing any variant
  // drops the track silently.
  const text = stripMarkup(line)
    .replace(/^[#|]\s*(<li value=\s*"?\d+"?>)?\s*/, '')
    .replace(/<\/li>\s*$/, '');
  // The title is not always flush left: a line can open with a set label
  // (`''Encore:'' "Terrapin Station"`), a nested-list bullet for a suite
  // movement (`* "Prelude"`), or a wikilink wrapping the quotes. Start from the
  // first quote rather than requiring one at position 0.
  const opens = text.indexOf('"');
  // An opening quote is no guarantee of a closing one: Formerly the Warlocks
  // never closes the quote on "Stuck Inside of Mobile…", and July 1978 omits the
  // opening one on "Mexicali Blues". Either way the pair is unusable, so treat
  // an unterminated quote as no quote at all.
  const closes =
    opens >= 0 && /^(?:"[^"]+"\s*[/>→]\s*)*"[^"]+"/.test(text.slice(opens));
  let title: string;
  let after: string;
  if (closes) {
    // A track can carry two titles and one time — Dick's Picks 29 lists
    // `"Lady with a Fan" / "Terrapin Station" – 11:43`. Take the last: it's the
    // song the corpus knows, the earlier name being its opening movement. There
    // is only one duration, so splitting would mean inventing a boundary.
    const from = text.slice(opens);
    const quoted = from.match(/^(?:"[^"]+"\s*[/>→]\s*)*"([^"]+)"/);
    if (!quoted) return null;
    title = cleanWikiTitle(quoted[1]);
    after = from.slice(quoted[0].length);
  } else {
    // No usable quote pair — Europe '72 prints
    // `#The Yellow Dog Story (traditional…) – 3:13` unquoted, and July 1978
    // loses its opening quote on one track. Fall back to the text before the
    // songwriter credits, but *only* for a line already carrying a duration:
    // quotes are what identifies a track otherwise, and without that guard the
    // fallback starts naming section labels and prose as untimed songs.
    if (!/[–—-]\s*\d{1,3}:\d{2}/.test(text)) return null;
    title = cleanWikiTitle(unquotedTitle(text));
    // The whole line, since there is no closing quote to measure from.
    after = text;
  }
  const timed = after.match(/[–—-]\s*(\d{1,3}:\d{2})/);
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
        // A date the index doesn't claim ends the show in progress outright:
        // the listing has moved on to material the index knows nothing about.
        // Clearing `main` too is what stops the *next* undated heading from
        // resurrecting it — Enjoying the Ride carries three composite discs of
        // selections between its complete shows, and with `main` left standing
        // each following `'''Disc N'''` handed their tracks back to 2/24/71,
        // which grew from 22 tracks to 49 across two venues and eighteen
        // months. A bonus date deliberately does *not* do this: it is a detour
        // inside a show the index does claim, and must come back.
        else if (flipped === UNKNOWN_DATE) main = null;
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
    byDate.set(current, [...(byDate.get(current) ?? []), track]);
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

/**
 * Per-show departures from what a release's track listing says.
 *
 * `drop` removes tracks by position in the release's own listing — position
 * rather than title, because title alone can't do it: the Europe '72 box opens
 * 5/16/72 with two soundcheck performances and one of them is `Sugar Magnolia`,
 * which the band also played for real later that night. The expected title is
 * recorded alongside so a parser change warns instead of silently dropping a
 * different track. Titles here are the *parsed* form, before the registry maps
 * aliases onto canonical names.
 *
 * `keepAuthored` forces a merge instead of a replace, for a release that packs
 * several songs the corpus keeps separate into one track: dropping the packed
 * track and replacing would delete those songs, so the authored ones stand and
 * only the rest of the show is retimed.
 */
const SHOW_OVERRIDES: Record<
  string,
  {
    drop?: { position: number; title: string }[];
    keepAuthored?: boolean;
    note: string;
  }
> = {
  '1972-05-16': {
    drop: [
      { position: 1, title: 'Big River' },
      { position: 2, title: 'Sugar Magnolia' },
    ],
    note: 'the box opens with two soundcheck performances, before the concert',
  },
  '1987-09-16': {
    drop: [{ position: 11, title: 'Devil with the Blue Dress' }],
    keepAuthored: true,
    note: 'the release runs Devil with a Blue Dress On > Good Golly Miss Molly > Devil with a Blue Dress On as one 3:56 track; the corpus keeps the three separate, so their authored timings stand',
  },
};

/**
 * Apply the registry's two track-level rules to a show's listing.
 *
 * Shared by both sources deliberately: these are facts about the *repertoire*,
 * not about Wikipedia's markup, so a show sourced from MusicBrainz has to come
 * out the same. Skipping this on the MusicBrainz path let a `Funiculì,
 * Funiculà` tease back into a show it had already been excluded from.
 */
function applyTrackRules(tracks: ParsedTrack[], date: string): ParsedTrack[] {
  const excluded = SHOW_OVERRIDES[date]?.drop ?? [];
  const out: ParsedTrack[] = [];
  for (const [index, track] of tracks.entries()) {
    const drop = excluded.find((e) => e.position === index + 1);
    if (drop) {
      if (drop.title === track.title) continue;
      console.log(
        `  ! expected "${drop.title}" at position ${drop.position} to exclude, ` +
          `found "${track.title}" — keeping it; check EXCLUDED_TRACKS`,
      );
    }
    const key = track.title.toLowerCase();
    // Not a song: no stripe. Covers tuning and banter, and teases the setlist
    // databases don't count as performances.
    if (notASong.has(key)) continue;
    const previous = out[out.length - 1];
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
    out.push({ ...track });
  }
  return out;
}

/**
 * Fall back to MusicBrainz when Wikipedia can't supply the show.
 *
 * Two cases, both common enough to matter:
 *   - the article lists the show but gives no durations;
 *   - the article organises its listing by disc rather than by night
 *     ("===Disc 1===" … "===Disc 9==="), so no tracks bucket to the date at all.
 *
 * MusicBrainz titles each medium with the night it holds, so it answers both.
 * Takes its tracks wholesale rather than grafting lengths onto Wikipedia's
 * titles by position: it supplies title, order *and* length for the same night,
 * so pairing by index would add a failure mode for nothing. Returns the input
 * unchanged if MusicBrainz can't answer, leaving the gap visible.
 */
async function fillUntimed(
  tracks: ParsedTrack[],
  release: Release,
  date: string,
): Promise<{ tracks: ParsedTrack[]; source: 'wikipedia' | 'musicbrainz' }> {
  if (tracks.length && tracks.every((track) => track.duration)) {
    return { tracks: applyTrackRules(tracks, date), source: 'wikipedia' };
  }
  const byDate = await tracksByDateFromMusicBrainz(release.name, release.dates);
  const fromMb = byDate.get(date);
  if (!fromMb?.length) {
    return { tracks: applyTrackRules(tracks, date), source: 'wikipedia' };
  }
  return { tracks: applyTrackRules(fromMb, date), source: 'musicbrainz' };
}

const showPath = (id: string) =>
  join(root, 'data/shows', id.slice(0, 4), `${id}.json`);

/**
 * Serialise a show in the style the file already uses.
 *
 * The corpus is authored two ways — 159 shows put each song across four lines,
 * 16 keep it on one — and Prettier will not reconcile them, because it
 * preserves whether the source had a newline after `{`. Rewriting a file in the
 * other style turns a one-line timing fix into a whole-file diff and buries the
 * change being reviewed, so the existing layout is matched rather than imposed.
 * New files follow the majority.
 */
function serialiseShow(show: ShowFile, compact: boolean): string {
  if (!compact) return `${JSON.stringify(show, null, 2)}\n`;
  const { songs, ...meta } = show;
  const head = JSON.stringify(meta, null, 2).replace(/\n}$/, '');
  const lines = songs.map(
    (song) =>
      `    { "title": ${JSON.stringify(song.title)}, "duration": ${JSON.stringify(song.duration)} }`,
  );
  return `${head},\n  "songs": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

/** True when a show file keeps each song on a single line. */
const isCompact = (text: string) => /\{ "title":/.test(text);

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
  let recovered = 0;
  console.log('show       tracks      total   source');
  for (const { show, source } of jobs) {
    const wikitext = text.get(source.page!);
    if (!wikitext) {
      console.log(`${show.id}   — could not fetch ${source.page}`);
      failed++;
      continue;
    }
    const { byDate } = tracksByDate(wikitext, source);
    const filled = await fillUntimed(
      byDate.get(show.date) ?? [],
      source,
      show.date,
    );
    if (!filled.tracks.length) {
      console.log(`${show.id}   !! no tracks matched — ${source.name}`);
      failed++;
      continue;
    }
    const { mapped, unknown } = canonicalise(filled.tracks);
    for (const title of unknown) unknownTitles.add(title);
    if (filled.source === 'musicbrainz') recovered++;
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
    // A partial source — or a show whose override keeps authored tracks —
    // merges into the setlist rather than replacing it, so report what the
    // merge would actually do. Counting a release's 8 excerpted tracks against
    // an 18-song night reads as a catastrophic loss that never happens.
    if (
      source.completeness === 'partial' ||
      SHOW_OVERRIDES[show.date]?.keepAuthored
    ) {
      const merged = mergePartial(show.songs, mapped);
      const after = merged.songs.reduce(
        (a, s) => a + parseDuration(s.duration),
        0,
      );
      console.log(
        `${show.id}   ${String(show.songs.length).padStart(2)} merge ${fmt(after - before).padStart(8)}   ` +
          `${source.name.slice(0, 30)} (${merged.updated} updated` +
          `${merged.unmatched.length ? `, ${merged.unmatched.length} unmatched` : ''})`,
      );
      continue;
    }
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
    `\n${jobs.length - failed - untimedShows} timed (${recovered} via MusicBrainz), ` +
      `${untimedShows} untimed, ${failed} unparsed`,
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
    'usage: tsx generator/import.ts <YYYYMMDD> [--write] [--gaps] [--partial] [--release "<name>"]\n' +
      '       tsx generator/import.ts --audit',
  );
  process.exit(1);
}
const write = args.includes('--write');
// Stage a show the release can't source whole into data/partial-shows/ for
// Jason to finish by hand. Never writes into data/shows/.
const partial = args.includes('--partial');
// Repeatable: a show can need several releases. 3/24/90 was issued complete
// only across four of them, so `--release A --release B …` merges in order.
const named = args.flatMap((arg, i) =>
  arg === '--release' ? [args[i + 1]] : [],
);

const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
const sources: Release[] = [];
if (named.length) {
  for (const name of named) {
    const found = releases.find((r) => r.name === name);
    if (!found) {
      console.error(`no release named "${name}" in data/releases.json`);
      process.exit(1);
    }
    sources.push(found);
  }
} else {
  const chosen = chooseSource(date);
  if (!chosen) {
    console.error(`no eligible release carries ${date}`);
    process.exit(1);
  }
  sources.push(chosen);
}

/** Merge rather than replace when no source claims the whole night. */
const merging =
  sources.length > 1 ||
  sources[0].completeness === 'partial' ||
  SHOW_OVERRIDES[date]?.keepAuthored === true;

const collected: ParsedTrack[] = [];
for (const source of sources) {
  console.log(`${date} ← ${source.name} (${source.completeness})`);
  if (source.completeness !== 'complete') console.log(`  ! ${source.note}`);
  if (!source.page) {
    console.error(`  "${source.name}" has no Wikipedia article to read`);
    process.exit(1);
  }
  const wikitext = (await articles([source.page])).get(source.page);
  if (!wikitext) {
    console.error(`  could not fetch "${source.page}"`);
    process.exit(1);
  }
  // A partial target is deliberately *not* in the release's `dates` — that is
  // what records it as unsourceable — but the parser buckets on those dates, so
  // without this its tracks orphan and the skeleton comes back empty. Inject
  // the one date being staged, and only for `--partial`, so the release's own
  // claim about what it can source stays untouched.
  const bucketing =
    partial && !source.dates.includes(date)
      ? { ...source, dates: [...source.dates, date] }
      : source;
  const { byDate, orphans } = tracksByDate(wikitext, bucketing);
  if (orphans) {
    console.log(
      `  ! ${orphans} track(s) before the first dated heading — ignored`,
    );
  }
  const filled = await fillUntimed(byDate.get(date) ?? [], source, date);
  if (filled.source === 'musicbrainz') {
    console.log('  durations from MusicBrainz — the article lists it untimed');
  }
  if (!filled.tracks.length) {
    console.log(`  ! no tracks for ${date} in the article or MusicBrainz`);
    continue;
  }
  console.log(`  ${filled.tracks.length} track(s)`);
  collected.push(...filled.tracks);
}

if (!collected.length) {
  console.error(
    `\nno tracks found for ${date}; the release may organise its listing in a ` +
      `way neither Wikipedia nor MusicBrainz exposes per-night`,
  );
  process.exit(1);
}

const { mapped, unknown } = canonicalise(collected);
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

/**
 * Update an authored setlist from a partial release, in place.
 *
 * A partial release holds only some of the night — selections across three
 * Knickerbocker shows, or the parts of 3/24/90 that reached four different
 * albums. Replacing the setlist with it would delete every song it omits, so
 * instead its tracks are matched into the existing one and only those
 * durations change; everything else keeps what was authored.
 *
 * Each incoming track claims the first *unclaimed* occurrence of its title.
 * Songs repeat within a night — two `Let It Grow`s around a drums segment,
 * `Dark Star` reprised after the break — so claiming has to be one-to-one, or
 * both performances collapse onto whichever came first. It deliberately does
 * not require forward progress: a partial release may be resequenced rather
 * than excerpted, and Road Trips 2:1 is, so a forward-only cursor matched one
 * track and then failed the other seven.
 */
function mergePartial(
  existing: { title: string; duration: string }[],
  incoming: ParsedTrack[],
): {
  songs: { title: string; duration: string }[];
  updated: number;
  unmatched: string[];
} {
  const songs = existing.map((song) => ({ ...song }));
  const claimed = new Set<number>();
  const unmatched: string[] = [];
  let updated = 0;
  for (const track of incoming) {
    if (!track.duration) continue;
    const at = songs.findIndex(
      (song, i) => !claimed.has(i) && song.title === track.title,
    );
    if (at < 0) {
      unmatched.push(track.title);
      continue;
    }
    claimed.add(at);
    if (songs[at].duration !== track.duration) updated++;
    songs[at] = { ...songs[at], duration: track.duration };
  }
  return { songs, updated, unmatched };
}

interface ScoredRecording {
  recording: Recording;
  tracks: ParsedTrack[];
  /** Tracks whose title the registry recognises — see `bestRecording`. */
  usable: number;
}

/**
 * The best archive.org tape for a date, with its tracks.
 *
 * Opens up to `MAX_CANDIDATES` and keeps the one with the most *recognisable*
 * songs, because tapes of one night differ enormously — 1972-09-16 has a
 * 25-track soundboard and an 8-track one.
 *
 * Two reasons it can't just take the best-ranked tape, both observed:
 *
 * 1. **Rank is not completeness.** `findRecordings` prefers Charlie Miller
 *    transfers, and on 1974-08-05 the only Miller item is a *one-track*
 *    `jam-segment` excerpt, which outranked three complete 25-track
 *    soundboards. Same at 1976-09-25 and 1976-09-28. A gap report built on a
 *    one-track tape says the release is missing the entire show.
 * 2. **Raw track count is not usefulness.** The 31-track 4/27/71 reel titles
 *    every track as a filename (`gd71-04-27 t01 Intro`), so on count alone it
 *    beat four properly-titled 27-track tapes while recognising nothing.
 *
 * Scoring `tracks − unmapped` measures what the tape is actually worth for
 * either purpose. Ranking order breaks ties, so a Miller transfer still wins an
 * even match. Shared by `--gaps` and `--partial`: both are answering the same
 * question — what was played that night — and only one of them used to get a
 * trustworthy answer.
 */
async function bestRecording(date: string): Promise<{
  recording: Recording;
  tracks: ParsedTrack[];
  scored: ScoredRecording[];
} | null> {
  const candidates = (await findRecordings(date)).slice(0, MAX_CANDIDATES);
  if (!candidates.length) return null;
  const scored: ScoredRecording[] = [];
  for (const candidate of candidates) {
    const tracks = applyTrackRules(
      await recordingTracks(candidate.identifier),
      date,
    );
    const { unknown } = canonicalise(tracks);
    scored.push({
      recording: candidate,
      tracks,
      usable: tracks.length - unknown.length,
    });
  }
  const best = scored.reduce((a, b) => (b.usable > a.usable ? b : a));
  return { recording: best.recording, tracks: best.tracks, scored };
}

/**
 * Report which songs a release leaves out, against the circulating soundboard.
 *
 * A partial release's own track listing can't say what it's missing — only that
 * it's short. Diffing against archive.org names the gaps, which is what makes
 * them fillable by hand instead of merely detectable.
 *
 * Matching is one-to-one on canonical titles, ignoring order, for the same
 * reason `mergePartial` is: some releases resequence.
 */
async function reportGaps(date: string, release: ParsedTrack[]) {
  const best = await bestRecording(date);
  if (!best) {
    console.log(`\n  no archive.org recording catalogued for ${date}`);
    return;
  }
  const { recording } = best;
  console.log(
    `\n  gaps vs archive.org: ${recording.identifier}` +
      `${recording.transferer ? ` (${recording.transferer})` : ''}`,
  );
  if (best.scored.length > 1) {
    console.log(
      `    best of ${best.scored.length} tapes (recognised/total): ` +
        best.scored
          .map(
            (s) =>
              `${s.usable}/${s.tracks.length}${s.recording === recording ? '*' : ''}`,
          )
          .join(', '),
    );
  }
  const recorded = canonicalise(best.tracks);
  const played = recorded.mapped;
  if (recorded.unknown.length) {
    // An unmapped title can't match the release, so it would be reported as a
    // gap whether or not the release actually has it. Say so rather than let a
    // spelling difference masquerade as a missing song.
    console.log(
      `    ! ${recorded.unknown.length} recording title(s) not in the registry, ` +
        `so any match is missed: ${[...new Set(recorded.unknown)].join(', ')}`,
    );
  }
  if (!played.length) {
    console.log('    recording has no usable track list');
    return;
  }
  const claimed = new Set<number>();
  const missing: ParsedTrack[] = [];
  for (const track of played) {
    const at = release.findIndex(
      (candidate, i) => !claimed.has(i) && candidate.title === track.title,
    );
    if (at < 0) missing.push(track);
    else claimed.add(at);
  }
  const extra = release.filter((_, i) => !claimed.has(i));
  console.log(
    `    ${played.length} played, ${played.length - missing.length} on the release`,
  );
  if (missing.length) {
    console.log(`    missing from the release (${missing.length}):`);
    for (const track of missing) {
      console.log(`      ${track.title} ${track.duration ?? ''}`);
    }
  }
  if (extra.length) {
    console.log(
      `    on the release but not this recording (${extra.length}): ` +
        extra.map((track) => track.title).join(', '),
    );
  }
}

/**
 * Stage a show the release can only partly source, for finishing by hand.
 *
 * A release's track listing says what it *has* and can never say what it lacks,
 * so the skeleton comes from the circulating soundboard instead: every song
 * actually played, in performance order. The release's timings are merged onto
 * that, and every song it doesn't carry is left with an empty duration. The
 * blanks are the work list.
 *
 * Writes to `data/partial-shows/`, never `data/shows/`, so an unfinished show
 * cannot reach the generator, the manifest, or the site. Promotion is a plain
 * `mv` into `data/shows/<year>/` once the blanks are filled.
 */
async function writePartial(
  // Taken as a parameter rather than closed over: `id` is `args.find(…)`, so
  // its declared type is `string | undefined`, and the module-level guard that
  // narrows it does not reach inside a function body.
  id: string,
  date: string,
  release: ParsedTrack[],
) {
  const best = await bestRecording(date);
  if (!best) {
    console.error(
      `\nno archive.org recording catalogued for ${date} — no skeleton to build.` +
        '\nThe release alone cannot say which songs it is missing.',
    );
    process.exit(1);
  }
  const { recording, scored } = best;
  console.log(
    `\n  skeleton ← archive.org: ${recording.identifier}` +
      `${recording.transferer ? ` (${recording.transferer})` : ''}`,
  );
  if (scored.length > 1) {
    console.log(
      `    best of ${scored.length} tapes (recognised/total): ` +
        scored
          .map(
            (s) =>
              `${s.usable}/${s.tracks.length}${s.recording === recording ? '*' : ''}`,
          )
          .join(', '),
    );
  }
  const recorded = canonicalise(best.tracks);
  // `canonicalise` keeps unknown titles in `mapped` so the diff view can show
  // them, which is wrong for a file: they would be written as songs the
  // registry has never agreed to, and the partials guard rejects exactly that.
  // Drop them here and name them instead. Taper titles need it more than any
  // release does — abbreviations (`GDTRFB`, `Big RxR Blues`), variant spellings
  // (`Playin' In The Band`) and outright non-songs (`Set II crowd`) all appear.
  const unknownTitles = new Set(recorded.unknown);
  const skeleton = recorded.mapped
    .filter((track) => !unknownTitles.has(track.title))
    // Blank durations, then let the release fill what it carries.
    .map((track) => ({ title: track.title, duration: '' }));
  if (unknownTitles.size) {
    console.log(
      `  ! ${unknownTitles.size} recording title(s) not in data/songs.json, ` +
        `LEFT OUT of the skeleton: ${[...unknownTitles].join(', ')}`,
    );
    console.log(
      '    Add them to data/songs.json (or alias them) and re-run to get a complete skeleton.',
    );
  }
  if (!skeleton.length) {
    console.error('  recording has no usable track list');
    process.exit(1);
  }
  const { songs, updated, unmatched } = mergePartial(skeleton, release);
  const blank = songs.filter((song) => !song.duration);
  console.log(
    `  ${songs.length} songs played; ${updated} timed from the release, ` +
      `${blank.length} left blank`,
  );
  if (blank.length)
    console.log(`  to fill: ${blank.map((s) => s.title).join(', ')}`);
  if (unmatched.length)
    console.log(
      `  ! ${unmatched.length} release track(s) matched nothing in the recording: ` +
        `${unmatched.join(', ')}`,
    );
  const out: ShowFile = {
    id,
    date,
    venue: '',
    city: '',
    // Both origins, in the documented pipe-separated form: the timings that do
    // exist came from the release, the setlist and order from the soundboard.
    source: `${sources.map((r) => r.name).join(' | ')} | archive.org:${recording.identifier}`,
    songs,
  };
  const dir = join(root, 'data/partial-shows');
  mkdirSync(dir, { recursive: true });
  const target = join(dir, `${id}.json`);
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\n✓ staged ${target.replace(`${root}/`, '')}`);
  console.log(
    '  fill the blank durations, then move it into data/shows/<year>/',
  );
}

const path = showPath(id);
const exists = existsSync(path);
if (args.includes('--gaps')) await reportGaps(date, mapped);

if (partial) {
  if (exists) {
    console.error(
      `\n${date} already exists in data/shows/ — staging would duplicate it`,
    );
    process.exit(1);
  }
  await writePartial(id, date, mapped);
  process.exit(0);
}

if (exists) {
  const raw = readFileSync(path, 'utf8');
  const current = JSON.parse(raw) as ShowFile;
  let songs: { title: string; duration: string }[];
  let changed: number;
  if (merging) {
    const merged = mergePartial(current.songs, mapped);
    songs = merged.songs;
    changed = merged.updated;
    console.log(
      `\n  merge: ${merged.updated} of ${current.songs.length} durations updated, ` +
        `${current.songs.length - merged.updated} left as authored`,
    );
    if (merged.unmatched.length) {
      console.log(
        `  ! ${merged.unmatched.length} release track(s) matched nothing in the setlist:`,
      );
      for (const title of merged.unmatched) console.log(`      ${title}`);
    }
    diff(current, songs);
  } else {
    changed = diff(current, mapped);
    songs = requireTimed(mapped);
  }
  if (!write) {
    console.log(
      changed
        ? '\n  (diff only — pass --write to apply)'
        : '\n  already matches the release',
    );
    process.exit(0);
  }
  // Pipe, not comma: release names contain commas of their own — "In and Out
  // of the Garden: Madison Square Garden '81, '82, '83" would split into three
  // sources that don't exist.
  const source = sources.map((release) => release.name).join(' | ');
  // Rebuild without `songs` first: it already exists on `current`, so adding a
  // new key alongside it would append `source` *after* the setlist.
  const { songs: _previous, ...meta } = current;
  void _previous;
  writeFileSync(
    path,
    serialiseShow({ ...meta, source, songs }, isCompact(raw)),
  );
  console.log(`\n✓ rewrote ${path.replace(`${root}/`, '')}`);
} else {
  const draft: ShowFile = {
    id,
    date,
    venue: '',
    city: '',
    source: sources.map((release) => release.name).join(' | '),
    songs: requireTimed(mapped),
  };
  if (!write) {
    console.log(`\n${serialiseShow(draft, false)}`);
    console.log('  (draft only — pass --write to create the file)');
    process.exit(0);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serialiseShow(draft, false));
  console.log(
    `\n✓ wrote ${path.replace(`${root}/`, '')} — venue/city are blank, fill them in`,
  );
}
