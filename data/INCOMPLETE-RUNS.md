# Incomplete runs

A **run** is derived, not authored: `buildRuns` in `src/galleries.ts` groups 2+
shows at one physical venue on adjacent performance dates, tolerating gaps up to
`RUN_MAX_GAP_DAYS` (3) so a dark day doesn't split a stand. That tolerance is
what makes runs correct as shows are added — but it also means a run can quietly
be **missing a night**, and nothing in the data says so.

This file is where that gets recorded. A gap inside a run has two possible
causes and the corpus cannot tell them apart:

- **a missing show** — the band played, and the corpus doesn't have it; or
- **a dark day** — the band didn't play, and the run is complete as it stands.

Only the second is the normal case. The Madison Square Garden stands are full of
scheduled off-nights, which is exactly why `RUN_MAX_GAP_DAYS` exists.

A run can also be short at its **ends** — shows before the first or after the
last one the corpus holds. Nothing here can detect that; it only turns up when a
source says the stand was longer.

## Confirmed incomplete

| Run                                                                 | Have                   | Missing    | Note                                                                                                       |
| ------------------------------------------------------------------- | ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| [Boston Music Hall November 1973](/boston-music-hall-november-1973) | 1973-11-30, 1973-12-02 | 1973-12-01 | A third show of the stand. _Dick's Picks Volume 14_ carries only the two outer nights (Jason, 2026-08-13). |

## Gaps not yet verified

Every other run with an internal date gap, listed so the question can be
settled rather than re-derived. **Presence here is not a claim that a show is
missing** — most of these are expected to be genuine dark days.

**Each one needs Jason to confirm it by hand, and nothing should be promoted to
the table above without that.** The arena stands in particular ran on **union
dark days** — scheduled off-nights the hall required — so a one-night gap in a
Madison Square Garden or Boston Garden stand is the expected shape of a
_complete_ run, not evidence of a hole in the corpus. Only a source saying the
band played that night moves a row up.

| Run                                  | Gap date(s)            |
| ------------------------------------ | ---------------------- |
| Fillmore West June 1969              | 1969-06-06             |
| Fillmore East April 1971             | 1971-04-26             |
| Academy of Music March 1972          | 1972-03-27             |
| The Palladium April 1977             | 1977-05-02             |
| Oakland Auditorium December 1979     | 1979-12-29             |
| Greek Theatre July 1984              | 1984-07-14             |
| Madison Square Garden September 1987 | 1987-09-17             |
| Greek Theatre July 1988              | 1988-07-16             |
| Madison Square Garden September 1988 | 1988-09-17, 1988-09-21 |
| Brendan Byrne Arena October 1989     | 1989-10-13             |
| Madison Square Garden September 1990 | 1990-09-17             |
| Madison Square Garden September 1991 | 1991-09-11, 1991-09-15 |
| Madison Square Garden September 1993 | 1993-09-19             |
| Boston Garden October 1994           | 1994-10-02             |
| Madison Square Garden October 1994   | 1994-10-16             |

To regenerate this candidate list after adding shows, walk `allSubGalleries`
for `kind === 'run'` and report any run whose consecutive shows are more than
one day apart.
