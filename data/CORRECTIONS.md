# Art corrections

The reconstructed pieces were bootstrapped from the original 2013 SVGs
stripe-for-stripe (verified once at reconstruction time via
`npx tsx generator/verify.ts <id>` against `tests/fixtures/legacy/<id>.svg`).
Those legacy fixtures are a **one-time bootstrap oracle, not a permanent
checksum** — they encode the originals' own mistakes. The authored data in
`data/shows/<id>.json` is now the source of truth and is freely editable for
corrections (`tests/data-validity.test.ts` keeps it well-formed; the
`public/shows/<id>.svg` diff is the reviewable record). This file is the log of
deliberate departures from the 2013 art. Each is confirmed by Jason.

## Title typos in the original art

The original art encoded a typo'd / non-canonical song title, so the stripe's
color was "wrong." These use the **correct** title instead, so the regenerated
archive reflects the right title rather than preserving the typo.

| Show       | Stripe  | Was (2013)                          | Corrected to                      |
| ---------- | ------- | ----------------------------------- | --------------------------------- |
| 1969-03-02 | Caution | `(Do Not Step On Tracks)`           | `Caution (Do Not Stop On Tracks)` |
| 1974-10-20 | "Roses" | a non-canonical form (`122-68-100`) | `It Must Have Been the Roses`     |
| 1974-10-20 | closer  | a non-canonical form (`61-105-115`) | `And We Bid You Goodnight`        |
| 1989-10-09 | #17     | a non-canonical form (`56-90-158`)  | `Dear Mr. Fantasy`                |
| 1995-07-09 | #5      | a non-canonical form (`60-122-58`)  | `Childhood's End`                 |
| 1974-10-19 | #18     | a non-canonical form (`102-36-106`) | `The Race Is On`                  |

(2/27–2/28 etc. use the original hyphenated forms — `Black-Throated Wind`,
`Brown-Eyed Women` — those reproduce the art exactly and are _not_ corrections.)

## Setlist segmentation deviations

Where the original art (following an official-release tracklist) merged a
segment the band clearly plays as a distinct song.

| Show       | Was (2013)                                                                        | Corrected to                                                                                                   |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1974-10-19 | `He's Gone` 13:49 (one stripe; Truckin' intro folded in per the Movie Soundtrack) | `He's Gone` 12:12 + `Truckin'` 1:37 (Weir starts the Truckin' riff at 12:12 before the jam veers into Caution) |

## Timing corrections

Where the original art's stripe widths reflected wrong durations.

| Show       | Was (2013)                                                       | Corrected to                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1974-10-16 | back-half jam suite (stripes 12–23) had inaccurate stripe widths | rebuilt from taper-consensus timings — `Seastones` → `Jam` → `Space` → `Wharf Rat` → `Eyes` (archive.org taper order, not JerryBase's), with corrected durations; stripes 1–11 still match the art |
