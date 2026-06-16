import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isValidDuration } from '@/wwob';
import type { ShowFile } from '@/wwob';
import { shows } from '@/data/shows.generated';

// Show data is hand-authored, so the guard here is *validity*, not fidelity to
// the original art. The authored data is the source of truth and is freely
// editable for corrections; these tests just keep it well-formed and the
// generated manifest in sync with it.

const DATA_DIR = 'data/shows';
const ID_RE = /^\d{4}-\d{2}-\d{2}$/;

function dataFiles(): string[] {
  return readdirSync(DATA_DIR)
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
    expect(`${show.id}.json`).toBe(file);

    // required metadata.
    expect(show.date).toMatch(ID_RE);
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
