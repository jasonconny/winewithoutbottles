/**
 * Reconstruction aid (dev tool, run via tsx). Two modes, keyed on whether
 * `data/shows/<id>.json` exists yet:
 *
 *   tsx generator/verify.ts <id>
 *
 *   - No data file  → EXTRACT: dump the legacy fixture's stripes (rgb, width,
 *     duration) so you can author the setlist against real targets.
 *   - Data file     → VERIFY: build stripes from the data and compare to the
 *     legacy fixture per stripe (the color checksum + width check). Exits non-zero
 *     on any mismatch, so a wrong title/form or duration is caught immediately.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStripes,
  formatDuration,
  parseDuration,
  titleToRgb,
} from '../src/wwob/index.ts';
import type { Rgb, ShowFile } from '../src/wwob/index.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rgbStr = (c: Rgb) => `${c.r},${c.g},${c.b}`;
const eq = (a: Rgb, b: Rgb) => a.r === b.r && a.g === b.g && a.b === b.b;

function legacyStripes(id: string): { rgb: Rgb; width: number }[] {
  const svg = readFileSync(
    join(root, 'tests/fixtures/legacy', `${id}.svg`),
    'utf8',
  );
  return [...svg.matchAll(/<rect[^>]*>/g)].map((m) => {
    const w = m[0].match(/width="(\d+)"/);
    if (!w) throw new Error(`unparseable rect: ${m[0]}`);
    // Legacy masters use either rgb(r, g, b) or hex (#RRGGBB) fills.
    const rgb = m[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const hex = m[0].match(/fill="#([0-9a-fA-F]{6})"/);
    let c: Rgb;
    if (rgb) c = { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
    else if (hex) {
      const n = parseInt(hex[1], 16);
      c = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    } else throw new Error(`unparseable rect: ${m[0]}`);
    return { rgb: c, width: +w[1] };
  });
}

const id = process.argv[2];
if (!id) {
  console.error('usage: tsx generator/verify.ts <id>   (e.g. 1977-05-08)');
  process.exit(1);
}

const legacy = legacyStripes(id);
// Show data lives in per-year subdirectories: data/shows/<year>/<id>.json.
const dataPath = join(root, 'data/shows', id.slice(0, 4), `${id}.json`);

if (!existsSync(dataPath)) {
  console.log(`${id}: ${legacy.length} stripes — no data yet, targets:\n`);
  console.log(' #   rgb               width   dur');
  legacy.forEach((s, i) => {
    const secs = Math.round(s.width * 0.6);
    console.log(
      `${String(i + 1).padStart(2)}   ${rgbStr(s.rgb).padEnd(15)}   ${String(s.width).padStart(5)}   ${formatDuration(secs)}`,
    );
  });
  process.exit(0);
}

const file = JSON.parse(readFileSync(dataPath, 'utf8')) as ShowFile;
const stripes = buildStripes(
  file.songs.map((s) => ({
    title: s.title,
    durationSeconds: parseDuration(s.duration),
  })),
);

let ok = file.songs.length === legacy.length;
console.log(`${id}: ${file.songs.length} songs vs ${legacy.length} stripes\n`);
file.songs.forEach((song, i) => {
  const got = stripes[i];
  const want = legacy[i];
  const cOk = !!want && eq(titleToRgb(song.title), want.rgb);
  const wOk = !!want && got.width === want.width;
  if (!cOk || !wOk) ok = false;
  const flag = cOk && wOk ? 'ok ' : '!! ';
  const detail =
    cOk && wOk
      ? ''
      : `  (got ${rgbStr(got.rgb)}/${got.width}, want ${want ? `${rgbStr(want.rgb)}/${want.width}` : '—'})`;
  console.log(`${flag}${String(i + 1).padStart(2)}  ${song.title}${detail}`);
});
if (file.songs.length !== legacy.length) {
  console.log(
    `\n!! song count ${file.songs.length} != ${legacy.length} stripes`,
  );
}
console.log(
  ok ? '\n✓ all stripes match the legacy art' : '\n✗ mismatches above',
);
process.exit(ok ? 0 : 1);
