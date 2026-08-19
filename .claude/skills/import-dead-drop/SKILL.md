---
name: import-dead-drop
description: Add a Wine Without Bottles show from a DeadDrop in the PlayDead app — transcribing a setlist and its timings from screenshots, the dead-drops index, and how the transcription is checked. Use when building a show that exists only in the PlayDead app, when screenshots appear in data/dead-drops/, or when editing data/dead-drops.json or generator/dead-drops.ts.
---

A DeadDrop is a show the PlayDead app publishes and nothing else carries: no
Wikipedia article, no MusicBrainz release, no track listing to fetch. The app's
show screen lists every track with an `m:ss` beside it, and there is no way to
export it. So this is the one path in the project where a show is **transcribed
from screenshots** rather than parsed from a source.

Everything else about the show is normal: the same `data/shows/<year>/<id>.json`,
the same canon, the same `npm run generate`, the same guards. Only the reading is
different — and the reading is the whole risk.

## Why this is a separate skill from `import-show`

Not the source. The **failure mode**.

Every other import is a parse, and a parse fails loudly: an unknown title stops
the run, a bad bucket produces a 49-track show, `--audit` re-sweeps the whole
corpus and reports `+0:00` when nothing moved. A transcription fails **silently**.
A `7:41` read as `7:47` changes a stripe width by an amount no one can see, and
there is no second copy to diff it against — not now, not later. `tsx
generator/import.ts <id>` will never confirm or contradict a DeadDrop show,
because no release claims the date.

So the verification below is not ceremony to be skipped when the reading feels
easy. **The reading always feels easy.** That is the trap: the screenshots are
crisp, the titles are large, and nothing pushes back.

## Reading the app screen

What a show screen carries, top to bottom:

- **Header** — venue and city on one line, then the date as `8/14/71`.
- **An A/B panel** — `DATE`, `N.R Yes/No`, `SOURCE` (e.g. `Reel`), and a sample
  rate (`24 bit/192 kHz`). This is the transfer provenance and the nearest thing
  a drop has to a tape identifier. Record it.
- **Section headings in blue** — `Set One`, `Set Two`, `Encore`. The corpus
  stores a flat setlist, so these are read for ordering and then discarded.
- **Rows** — title on the left, `m:ss` on the right, a `•••` menu after it.
- **`Show Notes`** at the bottom, in a dark panel.

**There is no total runtime anywhere on the screen.** That is worth knowing
because a stated total would be a real checksum, and its absence is why the
verification below is what it is. If a future app version adds one, use it: put
it in the drop entry and pin the sum in a test.

Four rows fit per screen on the first capture (the header eats the space) and
about ten thereafter, so a normal show is four or five captures.

### Three things the screen does to titles

1. **A long title is clipped** — `Goin' Down the Road Feeli…`. Resolve against
   `data/songs.json`, which is a closed canon, so a visible prefix usually has
   exactly one match. If it has two, the truncation cannot be resolved by
   looking; play the track or ask.
2. **Ampersands** — `Me & My Uncle`, `Me & Bobby McGee`. These are aliases, not
   songs. If the canon lacks one, **add the alias**, never the title: `cleanTitle`
   strips punctuation but not words, so `Me & My Uncle` and `Me and My Uncle`
   clean to different strings and would be two colours on the wall.
3. **Case differs freely** — `Turn on Your Love Light` vs the canonical
   `Turn On Your Love Light`. Harmless; `cleanTitle` uppercases.

### And one thing it does to venues

The app's spelling is not the corpus's. `Berkeley Community Theater` in the app
is `Berkeley Community Theatre` in the data, and the corpus spelling wins — two
spellings are two venues and the gallery splits. No importer runs on this path,
so this is `reconcileVenue`'s job done by hand: **check the venue against
`data/shows/` before authoring**, and record the app's spelling in the drop
entry so the difference stays visible.

## Capturing the screenshots

They go in `data/dead-drops/<id>/`, numbered in reading order — whatever the
phone names them is fine as long as the sequence sorts. **The directory is
gitignored**, following the legacy SVG masters: they are bulky app UI captures
whose only product is the authored JSON, and the reviewable record is the
`public/shows/<id>.svg` diff.

**Overlap consecutive captures by two or three rows. Do not make them abut.**

This is the single most important rule here. A row lost at a seam is the one
error nothing downstream can catch — the canon does not see it, the guards do not
see it, the art just has one fewer stripe. Overlap makes every seam
self-checking, and the duplicated rows are trivial to reconcile because they must
agree exactly. On the founding batch it double-read 18 of 43 rows for free.

## Verifying the transcription

In order of how much they are worth.

1. **The seam overlap**, above. Blind, free, and aimed at the failure that has
   no other guard.
2. **The canon.** `data/songs.json` is closed, so a mis-transcribed title lands
   non-canonical and `tests/data-validity.test.ts` names it. This is real
   verification and it costs nothing. Its blind spot is a misread that happens
   to be _another_ canonical song — the `Lazy River` / `Lazy River Road` class,
   which is what `sharesPrefixWith` exists for.
3. **JerryBase or DeadBase, via Jason.** The only genuinely independent
   statement of what was played. jerrybase blocks automated agents, so this is a
   manual lookup and Jason does it. Worth asking for on a founding batch or
   whenever the setlist looks odd.
4. **Re-reading a screenshot in the same session — nearly worthless.** Having
   already stated a value, a second read agrees with itself. Do not report it as
   a check. If a genuine second read is wanted it has to come from a context that
   has not seen the first.

**What is deliberately NOT in this loop: archive.org.** Cross-checking the
setlist against a soundboard sounds right and is not. Tapes disagree with
official releases about track boundaries _by nature_ — tuning tracks,
differently-split Drums/Space, per-taper naming — which is the entire reason
`foldIntoPrevious`, `notASong` and the combined-row rules exist. A routine diff
would throw false alarms constantly, and a check that cries wolf is a check
nobody reads. It also cannot verify a single duration. Keep it for a specific
doubt — a blurry capture, an ambiguous seam — where `--gaps` already reaches it.

## `data/dead-drops.json`

**A sibling of `data/releases.json`, never merged into it.** The reason is
mechanical: `tsx generator/releases.ts --draft` rebuilds that file wholesale from
the Wikipedia discography, so an entry with no article behind it is deleted on
the next draft, and the guard there only _refuses_ the draft rather than
preserving. Nothing fetches `data/dead-drops.json`, so nothing can overwrite it.

**Keyed on the date**, because the app's show screen carries no drop name — it
shows the venue, the date and the transfer, and nothing identifying the weekly
drop it arrived in. A show points at it with `source: "dead-drop:<id>"`,
mirroring `archive.org:<identifier>` except that this one resolves against a
local file, so the guard checks the reference exists rather than merely being
non-empty.

Fields are in `generator/dead-drops.ts`; all are required and all are guarded.
`transfer` is the A/B panel verbatim, and it earns its place because a re-transfer
would otherwise be invisible.

A drop takes **no tag**. A per-drop tag would mint a weekly index holding one
show; a single `DeadDrops` tag across all of them would be a real grouping but
the release-tag rule cannot produce it, so it would have to be an editorial tag.
Deferred until there are enough drops to see the shape — raise it, don't decide
it.

## The loop

```
# screenshots already in data/dead-drops/<id>/, overlapping
# 1. read them in order; reconcile the overlaps — they must agree exactly
# 2. check every title against data/songs.json BEFORE authoring
# 3. check the venue spelling against data/shows/
# 4. add the drop to data/dead-drops.json
# 5. author data/shows/<year>/<id>.json — source: "dead-drop:<id>"
npm run generate <id>
npx vitest run
npx prettier --write 'data/shows/**/*.json' data/dead-drops.json
```

Then **pause for Jason's spot-check before the next show.** The standing batch
cadence applies, and it applies harder here: batches of about five, not by year.
The error class is systematic — a habit of misreading a column, a wrong rule
about section headings — so it wants catching on show two, not show thirty.

`--audit` will not cover these shows, and that is correct: it sweeps shows that
resolve to a release, and a drop is not one. Confirm the counts are _unchanged_
after adding a drop show. If they move, something resolved that should not have.

## Where the tooling stops

Everything above is judgement, and two calls in particular are Jason's, not
yours — he is the authority on the catalogue:

- **Whether a track is a song.** `Happy Birthday` (1:09) closes 1971-08-14 and
  the app indexes it as a numbered track; it is recorded as `notASong`, which is
  a deliberate departure from the source. Adding a title to the canon mints a
  permanent colour, so it is never a default.
- **Where a medley splits**, and whether the app's track grouping is where the
  music actually ends. A release's CD index has never been that, and there is no
  reason an app's is either.

Surface the evidence and ask. See `data/CORRECTIONS.md` — "The first shows read
off a screen" — for how these were settled the first time.
