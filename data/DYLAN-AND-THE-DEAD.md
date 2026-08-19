# Dylan and the Dead

Six stadium shows in July 1987 where the Grateful Dead played their own two sets
and then backed **Bob Dylan** for a third. Every official release of this tour
carries the Dead's sets and drops Dylan's, so every show the corpus builds from
one is **a real night with a real piece missing** — and the missing piece is not
a scrap. On 7/12/87 it is thirteen songs, and it takes the night's encore with
it.

**These shows are flagged, not fixed.** Jason wants the Dylan sets included one
day and given a tag of their own. This file records what would be needed, so the
decision isn't re-derived from scratch each time a tour date is imported.

## The tour

`July 4 & July 10–26, 1987`, six concerts.

| Date       | Venue                   | City                | In corpus | Released on                     |
| ---------- | ----------------------- | ------------------- | --------- | ------------------------------- |
| 1987-07-04 | Sullivan Stadium        | Foxborough, MA      | no        | —                               |
| 1987-07-10 | John F. Kennedy Stadium | Philadelphia, PA    | no        | —                               |
| 1987-07-12 | Giants Stadium          | East Rutherford, NJ | **yes**   | Giants Stadium 1987, 1989, 1991 |
| 1987-07-19 | Autzen Stadium          | Eugene, OR          | no        | —                               |
| 1987-07-24 | Oakland Coliseum        | Oakland, CA         | no        | View from the Vault IV          |
| 1987-07-26 | Anaheim Stadium         | Anaheim, CA         | no        | View from the Vault IV          |

**Two more will hit this the moment they are imported.** `View from the Vault IV`
resolves to 7/24 and 7/26 and is still `completeness: unknown`, so it sits in the
triage bucket. When it is read, expect the same shape: the Dead's sets present,
Dylan's absent. Do not record either date as a whole show without saying so.

## Why the Dylan sets are hard

`Dylan & the Dead` (Columbia, 1989) is the one release built from the Dylan sets,
and it cannot source them. It is **seven songs drawn from across four nights** —
a highlights record, not a concert — and it is already in `data/releases.json`
as `eligible: false`, `kind: contemporary`. It gives a handful of timings and no
night whole.

Nothing else times them. So a Dylan set would have to be assembled the way
1977-11-02 was: an archive.org tape for what was played and in what order, with
whatever official timings exist merged on top. That is per-night hand work
against a source no official release covers, which is why it is deferred rather
than scheduled.

## The open design question

A Dylan set is **not a Grateful Dead setlist**, and the project's whole premise
is that a stripe is a song the Dead played. Three things would have to be
settled before any of this becomes data:

1. **One show or two?** DeadBase counts Dylan's as a third set of the same
   concert. If it is one show, 7/12/87 grows from 18 stripes to 33 and its art
   changes. If it is two, the early/late machinery already exists for a date
   carrying more than one performance (`sitting`, id ordinals) — but "early/late"
   is the wrong word for this, and the field is a closed union of those two
   values.
2. **The tag.** Jason wants one. `Dylan and the Dead` is the obvious name and
   would be **editorial, not release-derived** — no single release grants it, and
   it groups by who was on stage rather than by what issued it. It would need
   adding to the editorial allow-list in `tests/data-validity.test.ts`, and it is
   a good candidate for a pinned tag: tag ⇔ date in the six above.
3. **The songs.** Dylan's set is mostly his own catalogue, and `data/songs.json`
   is a closed canon of what the Dead played. Thirteen titles on 7/12 alone,
   several of which the Dead never played without him. Admitting them means
   deciding whether the canon is "songs the Dead played" or "songs performed at a
   Grateful Dead concert" — the corpus already contains
   `Stuck Inside Of Mobile With The Memphis Blues Again` and
   `Queen Jane Approximately` from Dead sets, so the line is not where it first
   appears.

Until those are answered, the corpus holds the Dead's sets and each affected
show carries a `note` saying what is absent.
