import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isValidDuration } from '@/wwob';
import type { ShowFile } from '@/wwob';
import { shows } from '@/data/shows.generated';

// Show data is hand-authored, so the guard here is *validity*, not fidelity to
// the original art. The authored data is the source of truth and is freely
// editable for corrections; these tests just keep it well-formed and the
// generated manifest in sync with it.

const DATA_DIR = 'data/shows';
/** Show ids are compact dates (also the show's URL): 19720827. */
const ID_RE = /^\d{8}$/;
/** The `date` field stays ISO for display and sorting: 1972-08-27. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
