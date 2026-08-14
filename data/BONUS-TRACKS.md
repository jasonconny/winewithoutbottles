# Bonus tracks

Dates the corpus does not hold as shows, carried by an official release only as
**bonus tracks** — a handful of songs from a night the release doesn't otherwise
cover.

None of these can source a show on its own. Each needs an archive.org skeleton
with the released timings merged onto it, the same workflow that produced
1971-08-06 from _Dick's Picks 35_'s bonus tracks. Until then the date has no
piece of art, because stripes are a claim about what was played and in what
order, and a handful of tracks can't make it.

**This list grows sideways, not just shorter.** A date can be augmented as more
releases are indexed: two of the eighteen below are already carried by a second
release, and Jason notes that more of **1977-11-02** was issued on a _Dave's
Picks_ the index hasn't resolved to that date yet. So a low count here is a
snapshot of what is currently findable, not a verdict on what survives. Re-check
before treating any of them as unsourceable.

It grew from ten to eighteen when Road Trips was indexed, which is the same
effect from the other direction: eight of these dates were invisible until the
volumes carrying them were read.

| Date       | Tracks | Source volume                                                      |
| ---------- | -----: | ------------------------------------------------------------------ |
| 1970-05-14 |      4 | Road Trips Volume 3 Number 3                                       |
| 1971-08-04 |      3 | Road Trips Volume 1 Number 3                                       |
| 1971-11-14 |     10 | Road Trips Volume 3 Number 2                                       |
| 1972-03-25 |      8 | Dick's Picks Volume 30                                             |
| 1972-03-27 |      6 | Dick's Picks Volume 30 (1) + Dave's Picks Volume 14 (5)            |
| 1972-09-03 |      9 | Dick's Picks Volume 36 (3) + Dave's Picks Volume 46 (6)            |
| 1973-11-20 |      3 | Road Trips Volume 4 Number 3                                       |
| 1973-12-06 |      5 | Road Trips Volume 4 Number 3                                       |
| 1977-11-02 |      7 | Dick's Picks Volume 34 — _more on a Dave's Picks, not yet indexed_ |
| 1977-12-30 |      4 | Dick's Picks Volume 10                                             |
| 1978-02-04 |      2 | Dick's Picks Volume 18                                             |
| 1978-10-17 |      2 | Road Trips Volume 1 Number 4                                       |
| 1979-11-01 |      2 | Dick's Picks Volume 13                                             |
| 1979-12-30 |     10 | Road Trips Volume 3 Number 1                                       |
| 1980-09-02 |      4 | Dick's Picks Volume 21                                             |
| 1982-04-05 |      7 | Road Trips Volume 4 Number 4                                       |
| 1991-03-31 |      2 | Dick's Picks Volume 17                                             |
| 1992-12-17 |      4 | Dick's Picks Volume 27                                             |

Counts are tracks the importer resolves to that date, so they follow the release
index: `tsx generator/import.ts <id> --release "<name>"` reproduces any row.

Two notes on where the counts come from:

- **`bonusDates`, not `dates`.** A bonus date is deliberately kept out of a
  release's `dates` list, which is what records it as unable to source the show.
  `chooseSource` filters on `dates`, so these never resolve automatically —
  every row above needs `--release` naming the volume explicitly.
- **Not every `bonusDates` entry belongs on this list.** The field now carries
  two kinds of date, and only one of them is bonus tracks. Several Road Trips
  volumes hold a night substantially but not wholly — a disc each of two
  Winterland shows, say — and those dates sit in `bonusDates` too, because
  taking them out of the index entirely shrank the release's date **span** and
  made its own per-night headings unresolvable, so material leaked between
  shows. Those dates are staged in `data/partial-shows/` and are excluded here:
  they are a work list with a skeleton, not a handful of orphan tracks. The test
  is where the date lives, not which field names it. Of the twenty-six dates in
  Road Trips `bonusDates`, eight are bonus tracks and appear above; sixteen are
  staged partials; two are already in the corpus.
- **1979-11-01 needed a parser fix to count at all.** _Dick's Picks 13_ writes
  its two hidden bonus tracks as indented bullets (`::*"Title" … – 18:30`), a
  markup the reader didn't accept. See `data/CORRECTIONS.md`.
