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
| 1990-10-17 | #9      | mis-colored stripe (`133-120-48`, G off by 14)                                                                         | `Tennessee Jed` (`133-106-48`)                          |
| 1990-10-22 | #4      | mis-colored stripe (`90-45-102`, G off by 5)                                                                           | `Wang Dang Doodle` (`90-50-102`)                        |
| 1990-10-22 | #13     | mis-colored jam stripe (`135-100-60`)                                                                                  | `Jam` (`100-10-130`)                                    |
| 1990-10 ×2 | Valley  | art's non-canonical `Valley Road` (`118-100-95`); 10-22 #8 + 10-30 #9                                                  | `The Valley Road` (`110-110-76`)                        |
| 1979-09-04 | #6      | art's non-canonical `New Minglewood` (`110-105-124`)                                                                   | `New Minglewood Blues` (`111-128-90`)                   |
| 1987-09-20 | #3      | mis-colored stripe (`110-138-92`)                                                                                      | `My Brother Esau` (`116-132-92`)                        |
| 1990-09-14 | #9      | mis-colored stripe (`97-68-120`)                                                                                       | `Scarlet Begonias` (`106-65-116`)                       |
| 1990-09-20 | #2      | mis-colored stripe (`105-80-30`)                                                                                       | `Althea` (`65-140-30`)                                  |
| 1991-09-13 | #1      | mis-colored stripe (`148-58-128`, B off by 10)                                                                         | `Touch of Grey` (`148-58-138`)                          |
| 1993-09-20 | #7      | art's abbreviated `Lazy River` (`128-130-150`)                                                                         | `Lazy River Road` (`127-144-76`)                        |
| 1993-09-21 | #5      | mis-colored stripe (`145-62-185`)                                                                                      | `Broken Arrow` (`115-50-185`)                           |
| 1993-09-22 | #16     | art's one-word `Turn On Your Lovelight` (`146-133-119`)                                                                | `Turn On Your Love Light` (`128-151-104`)               |
| 1994-10-14 | #4      | mis-colored stripe (`127-125-76`, G off by 19)                                                                         | `Lazy River Road` (`127-144-76`)                        |

(2/27–2/28 etc. use the original hyphenated forms — `Black-Throated Wind`,
`Brown-Eyed Women` — those reproduce the art exactly and are _not_ corrections.
1976-06-28's `Happiness Is Drumming` (`99-100-136`) and 1976-06-29's
`Playin' Reprise` (`126-93-134`) likewise reproduce the art exactly — the titles
just weren't in the matcher's repertoire — so they are _not_ corrections. The MSG
'79–'88 batch added several faithful one-off / guest titles that reproduce the art
exactly and are likewise _not_ corrections: `From the Heart of Me`, `Deep Elem Blues`,
`(I Can't Get No) Satisfaction`, `Louie, Louie`, `Devil with the Blue Dress On`,
`Good Golly Miss Molly`, `Never Trust a Woman`, and the 1988-09-24 Rainforest-benefit
guest spots `Chinese Bones`, `Neighborhood Girls`, `Everytime You Go Away`,
`What's Going On?`.)

## Cross-archive title standardizations

A single song rendered under two spellings across the 2013 art, standardized to
the canonical form archive-wide so the song is one color everywhere.

| Song                      | Standardized to                           | Notes                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Turn On Your Love Light` | `Turn On Your Love Light` (`128-151-104`) | the art used the one-word `Turn On Your Lovelight` (`146-133-119`) on 20 shows; the two-word spelling is correct (Live/Dead + the Bobby "Blue" Bland 45). Swept: 1969-02-27/28, 1969-03-01/02, 1972-04-26, 1972-05-07, 1972-05-24/25, 1987-09-19, 1988-09-15/22, 1989-10-11/19/23, 1990-03-14/21/29, 1990-10-17/22/30 |

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
| 1994-10-15 | the 2013 art mis-placed `I Want to Tell You` (`112-100-142`) at the set break (#9); it was actually the show closer                                                | reordered by hand (closer → #18) and durations re-timed from the official source                                             |
