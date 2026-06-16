# Art corrections

The reconstructed pieces reproduce the original 2013 SVGs stripe-for-stripe
(`tests/fidelity.test.ts` enforces this against `tests/fixtures/legacy/<id>.svg`).

A few stripes are **deliberate exceptions**: the original art encoded a typo'd
song title, so the stripe's color was "wrong." For these we use the **correct**
title and update the legacy fixture's color to match, so the regenerated archive
reflects the right title rather than preserving the typo. Each is confirmed by Jason.

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
