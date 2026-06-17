# Art corrections

The reconstructed pieces are bootstrapped from Jason's original 2013 SVGs
stripe-for-stripe (`npx tsx generator/verify.ts <id>`; the masters are dropped
into the gitignored `tests/fixtures/legacy/` per batch, not committed). The
originals encode mistakes of their own, so the authored data in
`data/shows/<id>.json` is the source of truth and is freely editable for
corrections (`tests/data-validity.test.ts` keeps it well-formed; the
`public/shows/<id>.svg` diff is the reviewable record). This file is the log of
deliberate departures from the 2013 art. Each is confirmed by Jason.

## Title typos in the original art

The original art encoded a typo'd / non-canonical song title, so the stripe's
color was "wrong." These use the **correct** title instead, so the regenerated
archive reflects the right title rather than preserving the typo.

| Show       | Stripe  | Was (2013)                                                                                                             | Corrected to                                            |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1969-03-02 | Caution | `(Do Not Step On Tracks)`                                                                                              | `Caution (Do Not Stop On Tracks)`                       |
| 1974-10-20 | "Roses" | a non-canonical form (`122-68-100`)                                                                                    | `It Must Have Been the Roses`                           |
| 1974-10-20 | closer  | a non-canonical form (`61-105-115`)                                                                                    | `And We Bid You Goodnight`                              |
| 1989-10-09 | #17     | a non-canonical form (`56-90-158`)                                                                                     | `Dear Mr. Fantasy`                                      |
| 1995-07-09 | #5      | a non-canonical form (`60-122-58`)                                                                                     | `Childhood's End`                                       |
| 1974-10-19 | #18     | a non-canonical form (`102-36-106`)                                                                                    | `The Race Is On`                                        |
| 1977-04-22 | #15     | `Got My Mojo Working` (`133-109-123`)                                                                                  | `I Got My Mojo Workin'`                                 |
| 1977-05-17 | #6      | mis-colored stripe (`47-100-67`)                                                                                       | `Jack-A-Roe`                                            |
| 1977-05-21 | #23     | a non-canonical form (`106-105-104`)                                                                                   | `One More Saturday Night`                               |
| 1972 ×6    | Caution | art typo `…Step on Tracks` (`102-121-101`); affects 04-08, 04-14, 04-16, 04-17, 04-29, 05-11                           | `Caution (Do Not Stop on Tracks)`                       |
| 1972-05-10 | #27     | mis-colored stripe (`92-78-114`, copy/paste slip)                                                                      | `Ramble On Rose`                                        |
| 1989-10-20 | #7      | mis-colored stripe (`91-93-92`)                                                                                        | `Stuck Inside Of Mobile With The Memphis Blues Again`   |
| 1989 ×2    | opener  | mis-colored stripe (`88-116-86`); 10-20 set-1 closer #10 + 10-23 opener #1                                             | `California Earthquake`                                 |
| 1989-10-20 | #15     | mis-colored stripe (`113-92-72`)                                                                                       | `The Other One`                                         |
| 1989-10-25 | #11     | mis-colored stripe (`126-93-134`)                                                                                      | `Playing in the Band`                                   |
| 1976 ×10   | BEW     | mis-colored stripe (`144-65-140`, G channel off); 06-04, 06-09, 06-10, 06-11, 06-12, 06-14, 06-18, 06-19, 06-21, 06-23 | `Brown-Eyed Women` (`144-78-140`)                       |
| 1976-06-18 | #19     | mis-colored stripe (`120-78-105`)                                                                                      | `Sugar Magnolia`                                        |
| 1990-03-14 | #13     | mis-colored jam stripe (`135-100-60`)                                                                                  | `Jam` (`100-10-130`)                                    |
| 1990-03-25 | #20     | mis-colored stripe (`105-136-95`)                                                                                      | `Quinn the Eskimo (Mighty Quinn)`                       |
| 1990-04-02 | #2      | mis-colored stripe (`131-128-128`, G off by 8)                                                                         | `Mississippi Half-Step Uptown Toodeloo` (`131-120-128`) |

(2/27–2/28 etc. use the original hyphenated forms — `Black-Throated Wind`,
`Brown-Eyed Women` — those reproduce the art exactly and are _not_ corrections.
1976-06-28's `Happiness Is Drumming` (`99-100-136`) and 1976-06-29's
`Playin' Reprise` (`126-93-134`) likewise reproduce the art exactly — the titles
just weren't in the matcher's repertoire — so they are _not_ corrections.)

## Setlist segmentation deviations

Where the original art (following an official-release tracklist) merged a
segment the band clearly plays as a distinct song.

| Show       | Was (2013)                                                                        | Corrected to                                                                                                   |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1974-10-19 | `He's Gone` 13:49 (one stripe; Truckin' intro folded in per the Movie Soundtrack) | `He's Gone` 12:12 + `Truckin'` 1:37 (Weir starts the Truckin' riff at 12:12 before the jam veers into Caution) |

## Timing corrections

Where the original art's stripe widths reflected wrong durations.

| Show                        | Was (2013)                                                       | Corrected to                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1974-10-16                  | back-half jam suite (stripes 12–23) had inaccurate stripe widths | rebuilt from taper-consensus timings — `Seastones` → `Jam` → `Space` → `Wharf Rat` → `Eyes` (archive.org taper order, not JerryBase's), with corrected durations; stripes 1–11 still match the art                                               |
| 1976-06 (full June '76 run) | the 2013 art predated the official June '76 releases             | setlists and durations across the batch revised against the official releases issued since; widths regenerated to match, and a few shows' stripe counts changed where the art over-segmented reprises/segues (06-09, 06-10, 06-15, 06-19, 06-28) |
| 1990-03/04 (Spring '90 run) | the 2013 art predated the official Spring 1990 releases          | durations across the batch revised against the official releases issued since; widths regenerated to match                                                                                                                                       |

## Reconstruction departures

Where a show was _not_ bootstrapped from the 2013 art at all, because the art
itself was a bad reconstruction.

| Show       | Problem                                                                                                                                                            | Resolution                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1990-04-03 | the 2013 art duplicated 4/02's exact song order (same stripe colors/sequence, only widths differ) — impossible for a back-to-back Omni run the band never repeated | legacy SVG discarded; setlist + durations entered by hand from the official source. No color checksum applies for this show. |
