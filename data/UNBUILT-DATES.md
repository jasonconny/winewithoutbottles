# Unbuilt dates

Every officially-released show that **can** be built now exists.
`data/partial-shows/` is empty. These are the 21 dates that remain, and they are
unbuilt for four quite different reasons — which is the whole point of this
file, because "not in the corpus" reads the same in all four cases and means
something different in each.

The detailed reasoning for each date stays where it already is: a `note` on the
file in `data/unknown-setlists/`, or an entry in
`generator/hand-readings.ts`. **This file does not restate it.** What it adds is
the thing those notes cannot say — **what archive.org held when somebody last
looked**, and on what date.

That matters more than it sounds. This survey was re-derived twice inside two
days (2026-08-18 and 2026-08-19), both times by querying archive.org date by
date, because "we checked, there is no tape" had never been written down. Worse,
without a checked-on date a genuine change — somebody uploads a 1968 Kings Beach
Bowl reel — is indistinguishable from a stale assumption.

**Section A is effectively permanent. Section B is not.** B turns entirely on
whether a better transfer surfaces, and transfers do surface: the Egypt 9/16/78
audience tape that finally supplied `Sunrise`, and the partial matrix that
supplied 9/16/72's `Not Fade Away` reprise, were both cases where the _fullest_
soundboard was the incomplete one. Re-check B before assuming it still holds.

**One warning, learned on 1972-07-21.** A tape's description is not its
contents. The 2020 Miller/Bear transfer of that night lists `Promised Land` as
the set-one opener in its description; the audio begins mid-song, and the first
track is literally `//Sug//aree`. **Read the track list, not the prose.**

## A. Nothing circulates beyond the release

Zero recordings catalogued on archive.org. The release is the only audio that
exists, and it does not carry the whole night — so the night cannot be drawn,
and no amount of looking will change that.

| Date       | Release                                 | Held in            | Why the release is not enough                         | Tapes | Checked    |
| ---------- | --------------------------------------- | ------------------ | ----------------------------------------------------- | ----: | ---------- |
| 1968-02-23 | Dick's Picks Volume 22                  | `unknown-setlists` | "portions of the concerts" at the Kings Beach Bowl    |     0 | 2026-08-19 |
| 1968-02-24 | Dick's Picks Volume 22                  | `unknown-setlists` | as above — the same two-night salvage                 |     0 | 2026-08-19 |
| 1968-03-17 | Download Series Volume 6                | `unknown-setlists` | the first-set closer and the second set, nothing more |     0 | 2026-08-19 |
| 1970-01-18 | Download Series Volume 2                | `unknown-setlists` | one 79:47 disc, never called complete                 |     0 | 2026-08-19 |
| 1970-04-18 | Family Dog at the Great Highway 4/18/70 | —                  | the acoustic set only; the electric set is unknowable |     0 | 2026-08-19 |
| 1971-08-24 | Dick's Picks Volume 35                  | `unknown-setlists` | Godchaux houseboat reel, only the salvageable part    |     0 | 2026-08-19 |

**1970-04-18 sits in neither holding pen**, which is worth knowing: it is a
`partial` release date that was never staged, so nothing in `data/` describes it
at all. This row is its only record.

## B. A tape exists but cannot complete the night

Recordings circulate, and they still do not close the gap — usually because
every one of them is the same partial set, or because the one missing song is
missing everywhere.

| Date       | Release                      | Why the tapes do not close it                                   | Tapes | Checked    |
| ---------- | ---------------------------- | --------------------------------------------------------------- | ----: | ---------- |
| 1970-01-23 | Dave's Picks Volume 19       | Casey Jones cut at 1:22 mid-song; neither tape carries the song |     2 | 2026-08-19 |
| 1970-02-04 | Download Series: Family Dog  | release and tape disagree in both directions                    |     3 | 2026-08-19 |
| 1972-07-21 | Download Series Volume 10    | opener `Promised Land` on neither tape — see the warning above  |     2 | 2026-08-19 |
| 1972-11-18 | Houston, Texas 11-18-1972    | every tape is set two only; the first set has no audio          |     3 | 2026-08-19 |
| 1973-12-10 | Download Series Volume 8     | setlist known, timings not; the only tape is a 2-track fragment |     1 | 2026-08-19 |
| 1977-10-07 | Road Trips Volume 1 Number 2 | every tape is set two only                                      |     4 | 2026-08-19 |

**1973-12-10 is the closest to buildable of any row here.** Unusually, its
setlist is not in doubt — the article names the five songs the release omits.
Only their durations are missing, and a single fuller transfer would finish it.

**1972-11-18 also sits in neither pen**, like 1970-04-18.

## C. Buildable today, deferred by choice

| Date       | Release      | Tapes | Checked    |
| ---------- | ------------ | ----: | ---------- |
| 1980-10-09 | The Warfield |     8 | 2026-08-19 |
| 1980-10-10 | The Warfield |    11 | 2026-08-19 |

**Nothing is blocking these.** The release holds both nights' acoustic sets and
the tapes are plentiful; they are held on Jason's judgement (2026-08-19) that
these 15th-anniversary residencies — the Warfield, Radio City Music Hall and two
New Orleans nights, most or all multi-tracked for _Reckoning_ and _Dead Set_ —
are conspicuously under-released, which suggests a box being kept back. If one
appears it would likely supersede this release for both dates, so building them
now risks doing the work twice. Reasoning lives on the release's entry in
`generator/hand-readings.ts`.

## D. Not yet released

| Dates                                                | Release           | Due        |
| ---------------------------------------------------- | ----------------- | ---------- |
| 1985-06-14, 06-15, 06-16, 06-27, 06-28, 06-30, 07-01 | Summer Magic 1985 | 2026-09-18 |

The article already lists all 145 tracks and **not one duration**, so the
importer refuses the whole box — correctly, and in a way that reads as a parser
bug if you do not know why. `Merriweather 6/30/85` is the same 6/30 recording
issued separately on the same day, so it adds no date but is the easier of the
two to import by mistake, since it reads as a single complete date. Both carry
notes in `generator/hand-readings.ts`.

## Keeping this honest

`tests/data-validity.test.ts` pins the file against the data:

- every file in `data/unknown-setlists/` has a row here;
- every eligible-release date the corpus does not hold has a row here;
- **no row names a date the corpus now holds** — so building one of these forces
  its row out, and this file cannot quietly go on describing a solved problem.

The tape counts and checked-on dates are **not** guarded, because nothing local
can verify them. They are a record of what a human saw, and they age.
