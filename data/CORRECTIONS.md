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
| 1990-03-25 | #20     | mis-colored stripe (`105-136-95`)                                                                                      | `Quinn the Eskimo (The Mighty Quinn)`                   |
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

| Show       | Problem                                                                                                                                                            | Resolution                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1990-04-03 | the 2013 art duplicated 4/02's exact song order (same stripe colors/sequence, only widths differ) — impossible for a back-to-back Omni run the band never repeated | legacy SVG discarded; setlist + durations entered by hand from the official source. No color checksum applies for this show.                             |
| 1994-10-15 | the 2013 art mis-placed `I Want to Tell You` (`112-100-142`) at the set break (#9); it was actually the show closer                                                | reordered by hand (closer → #18) and durations re-timed from the official source                                                                         |
| 1972-04-16 | the 2013 art duplicated 4/14's exact setlist (same stripe colors/sequence, only widths differ) — impossible across distinct Aarhus/Copenhagen dates                | legacy SVG discarded; setlist + durations entered by hand from _Europe '72: The Complete Recordings_ (Vol. 5). No color checksum applies for this show.  |
| 1972-05-25 | the 2013 art duplicated 5/24's exact setlist (same stripe colors/sequence, only widths differ) — impossible across distinct Lyceum dates                           | legacy SVG discarded; setlist + durations entered by hand from _Europe '72: The Complete Recordings_ (Vol. 21). No color checksum applies for this show. |

## Duplicate spellings folded

The same song authored two ways renders as two songs. Unlike the title typos
above these are **not** departures from the 2013 art — the art is unchanged —
they are internal inconsistencies in the authored data, folded to one spelling.

| Song                  | Was                | Folded to          | Shows | Art       |
| --------------------- | ------------------ | ------------------ | ----- | --------- |
| Mississippi Half-Step | `…Uptown Toodleoo` | `…Uptown Toodeloo` | 14    | unchanged |

The Half-Step fold is invisible to the art: both spellings clean to the same
length and the transposed letters fall in the same channel slice, which is a
_mean_, so both render `131,120,128`. That is exactly why it survived so long,
and why `tests/data-validity.test.ts` now rejects two canonical titles that are
letter-for-letter rearrangements of each other.

### Quinn the Eskimo, retitled

`Quinn the Eskimo (Mighty Quinn)` became **`Quinn the Eskimo (The Mighty
Quinn)`** on 2026-08-12: Jason checked bobdylan.com, and that is the official
title of the song. The old form is kept as an alias, alongside the release
spellings `The Mighty Quinn` and `The Mighty Quinn (Quinn the Eskimo)`.

Unlike the Half-Step fold this one **is visible in the art**. The extra `THE_`
lengthens the cleaned title from 30 to 33 characters and shifts every channel
slice, so the stripe moves from `108,104,135` to `103,103,131` — slightly
darker, slightly less blue. Five shows carry the song, one stripe each:
19880919, 19900325, 19900919, 19910909 and 19910925.

## Import departures

Shows imported from an official release rather than bootstrapped from the 2013
art, where the authored data deliberately **differs from the release's own track
listing**. A release names tracks for a CD index, not for a setlist, so its
splits and spellings are not always the performance. Each is confirmed by Jason.

| Show(s)    | Release says                                                                                             | Authored as                                        | Why                                                                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1975-09-28 | `Milkin' the Turkey` (6:26)                                                                              | `King Solomon's Marbles` (6:26)                    | Not a jam — the composed _Blues for Allah_ instrumental. `King Solomon's Marbles` is the umbrella covering both themes (Stronger Than Dirt, Milkin' the Turkey) per Jesse Jarnow on the Good Ol' Grateful Deadcast; both are played here. DeadBase/JerryBase call it `Stronger Than Dirt`, which names only half. |
| 1969-02-22 | `Cryptical Envelopment` / `The Other One` / `Cryptical Envelopment`                                      | `That's It for the Other One` (16:53)              | The full suite played unbroken. Matches the four Feb–Mar 1969 shows already in the corpus (19690227/28, 19690301/02), which store it as one stripe.                                                                                                                                                               |
| 1970-04-15 | `Cryptical` / `Drums` / `Jam` / `The Other One` / `Cryptical`                                            | `That's It for the Other One` (24:16)              | Same suite. Drums, Jam and Space are _excepted_ — they occur inside the suite and do not break it; any other song does.                                                                                                                                                                                           |
| 1985-06-24 | `Cryptical` / `Drums` / `Space` / `Comes a Time` / `The Other One` / `Cryptical`                         | left split, `Cryptical Envelopment` × 2            | **Not** folded: `Comes a Time` is a separate song sitting inside the span, so the suite is genuinely interrupted. This is why `Cryptical Envelopment` exists as a canonical title at all.                                                                                                                         |
| 1970-04-15 | `Technical Difficulties` (4:11)                                                                          | dropped (`notASong`)                               | Banter while the roadies dealt with technical difficulties — not music, like `Tuning` and `Introduction`.                                                                                                                                                                                                         |
| 1981-05-16 | `Nobody's Jam` (2:30)                                                                                    | `Nobody's Jam` (kept, as its own song)             | Charlie Miller's soundboard titles it `Nobody's Fault But Mine Jam`. Following DeadBase, the sung `Nobody's Fault But Mine` and the purely instrumental `Nobody's Jam` are two different songs; JerryBase instead calls both by the sung title, marking instrumentals "theme only".                               |
| 1975-09-28 | `The Eleven Jam` (5:34)                                                                                  | `Jam` (5:34)                                       | Never touches the Eleven theme; the soundboard just calls it `Jam`. Matches JerryBase's notation and the existing `Lunatic Preserve` / `Mock Turtle Jam` / `No MSG Jam` aliases.                                                                                                                                  |
| 1982-08-07 | `Encore: U.S. Blues` printed on Disc One, straight after the first set                                   | `U.S. Blues` last, after `Morning Dew`             | Purest case of a CD index differing from a setlist: the encore is on disc one because that is where it fit. Both circulating soundboards (`gd1982-08-07.137625.sbd.miller`, `…141795.sbd.pcm.streeter.dalton.miller.clugston`) have it as the closer.                                                             |
| 1982-08-07 | `Drums` (5:31) / `Space` (5:31), footnoted "Edited version of performance"                               | `Drums` (8:22) / `Space` (4:24)                    | The release says outright that these two are edited, so its timings describe the CD, not the night. Taken from the PCM transfer of Dan Healy's master cassettes (Streeter reels → Dalton PCM → Clugston/Miller), the best-lineage unedited source; a second soundboard corroborates a ~13-minute pair.            |
| 1972-03-28 | `Sidewalks of New York` (1:10), called in the article "a brief, instrumental tuning before the encore"   | kept as a song                                     | **Not** retired the way `Beer Barrel Polka` and `Funiculì, Funiculà` were. Jason's call: this is the Dead's only live performance of it, which makes it singular rather than routine tuning.                                                                                                                      |
| 1981-05-06 | one 15:24 track, `Caution / Spanish Jam`                                                                 | `Caution Jam` (11:06) + `Spanish Jam` (4:18)       | Two pieces under one CD index. The combined-track rule (take the last title) only fires on two separately quoted titles, and both pieces are canonical here, so neither half should vanish. Jason placed the seam: Jerry starts the Spanish Jam at 11:06, and the remainder is arithmetic.                        |
| 1983-10-14 | `Spinach Jam` (13:05)                                                                                    | `Space` (13:05)                                    | The name is the release's alone — DeadBase and JerryBase both read `Space > Spanish Jam` across this stretch. Jason doesn't hear a Spanish Jam in it, so it stands as one `Space` stripe rather than a jam the canon would otherwise have to mint.                                                                |
| 1991-09-25 | `Boston Clam Jam` (5:37)                                                                                 | `Jam` (5:37)                                       | A compiler's pun on the venue, not a piece of repertoire. Folded into `Jam` like `Mock Turtle Jam` / `No MSG Jam` / `The Eleven Jam` before it, rather than joining the named jams (`Spanish Jam`, `Mind Left Body Jam`) that name a theme.                                                                       |
| 1970-05-02 | `Cryptical Envelopment` / `Drums` / `The Other One` / `Cryptical Envelopment` (28:17 across four tracks) | `That's It for the Other One` (28:17)              | The Cryptical rule below, third instance. Corroborated by the primary source rather than only by convention: Charlie Miller's soundboard (`gd1970-05-02.138227.sbd.miller`) titles the same stretch as one 28:46 track.                                                                                           |
| 1970-05-02 | nothing — `Cold Rain and Snow` is left off the release entirely                                          | `Cold Rain and Snow` (8:03), after `Good Lovin'`   | The article names both the omission and its slot: "played between Good Lovin' and It's a Man's Man's Man's World". The timing comes from `gd1970-05-02.sbd.remaster.dp8outtake`, which is that song alone from the release's own remaster, so it sits consistently beside the other 21 stripes.                   |
| 1973-02-28 | nothing — `Promised Land` is absent from Dick's Picks 28                                                 | `Promised Land` (3:32), after `Row Jimmy`          | The soundboard (`gd1973-02-28.sbd.jools`) has it there, but that tape stops after Eyes of the World and never reaches the release's `Truckin'`, so the position is **inferred**: the tape's ordering as far as it goes, with Truckin' left where the release puts it.                                             |
| 1976-09-25 | nothing — `It's All Over Now` is absent                                                                  | `It's All Over Now` (6:38), after `Cosmic Charlie` | Dick's Picks 20 says it holds "the majority of the concerts"; against the soundboard this is the one song missing from 9/25, and the tape places it between Cosmic Charlie and Scarlet Begonias.                                                                                                                  |
| 1976-09-28 | nothing — `Bertha` is absent                                                                             | `Bertha` (5:36), after `Big River`                 | Same release, same reason; the tape has it third, between Big River and Cassidy. The release's `Orange Tango Jam` is **not** a second gap — it is the tape's second `Jam`, in the same slot between Eyes of the World and Dancing in the Street.                                                                  |
| 1977-12-29 | nothing — `It Must Have Been the Roses` and `Sunrise` are absent                                         | both restored after `Good Lovin'` (9:19, 8:24)     | Dick's Picks 10 holds 21 of the night's 23 songs. The two come from the PCM transfer of Betty's masters, which places them between Good Lovin' and Playing in the Band. The release's `Playing Jam` is not a third gap — DeadBase and JerryBase both call that coda `Playing in the Band`.                        |

The Cryptical rule is mechanical and worth restating, since it will come up
again: fold a `Cryptical Envelopment` … `Cryptical Envelopment` span into one
`That's It for the Other One` stripe **only** when nothing but `The Other One`,
`Drums`, `Jam` or `Space` sits between them. It is the same umbrella-name
convention the corpus already uses for `Terrapin Station` (31 uses; `Lady with a
Fan` appears nowhere).

### A duration the source doesn't carry

`1978-05-13` (_Enjoying the Ride_) is the one show in the corpus with a timing
that came from neither the release's track listing nor a tape. The article omits
the duration for the encore, `One More Saturday Night`, and the importer
deliberately refuses a show with any untimed track — stripe widths _are_ the
durations, so a guess would be silently wrong. **Jason owns the release and
timed it: 5:28.** The other 17 tracks are the article's own. The show is
therefore hand-authored rather than `--write`-imported, and re-running the
importer on it will still refuse; that is correct behaviour, not a regression.

The same show carries a second, separate departure. The release lists one
`Drums` of **22:26**, anomalously long for 1978 because — per JerryBase — it
folds Space in. Jason listened to the track and placed the seam: Garcia starts
noodling with the MuTron around **18:45**, Lesh joins about thirty seconds
later, and it is full Space from there to the end. So the single track is
authored as two stripes, `Drums` (18:45) + `Space` (3:41), the remainder being
arithmetic rather than a second judgement.

`1972-09-17` (_Dick's Picks Volume 23_) is the mirror case: the release is
otherwise the complete Baltimore Civic Center show, and its own article says so
— "complete concert, except for the encore, which was `One More Saturday
Night`". The circulating soundboard (`gd72-09-17.sbd.hamilton`) stops short of
the encore too, so for a while the show stood at 23 stripes with a documented
song missing. Jason found an audience tape,
`gd1972-09-17.aud-wolfson.minches.28165.shnf`, which carries it at **5:34**, and
that is the authored timing. The `source` names both, pipe-separated, because
23 of the 24 stripes are the release's.

This is the same kind of call as the 1974-10-19 `He's Gone` / `Truckin'` split
above: an official release's track _grouping_ is a CD index, not a claim about
where one piece of music ends. Where the grouping and the performance disagree
and Jason can hear the boundary, the performance wins.

### Shows whose setlist can't be known

`data/unknown-setlists/` is a third holding pen, alongside `data/shows/` and
`data/partial-shows/`, opened on 2026-08-12 for **`1971-08-24`** (Auditorium
Theatre, Chicago).

_Dick's Picks Volume 35_ presents it as one of two complete shows, and the
importer read it that way — 16 tracks, 1h34, short for 1971. It isn't a short
show, it's a fragment: per JerryBase the tape was found among Keith Godchaux's
houseboat tapes, only what was salvageable was released, and nothing else
circulates. DeadBase 50 lists mostly the same songs **in a different order**,
and where the rest of its setlist came from is unclear. No tape is catalogued on
archive.org for the date, so there is nothing to check either source against.

That is a different condition from a staged partial. A partial is waiting for a
timing somebody can still supply; this is waiting for nothing. And it can't sit
in `data/shows/`, because stripes are a claim about what was played and in what
order — a claim the record here doesn't support. So the file keeps its 16
surviving timings and a required `note` explaining the doubt, and stays out of
the generator's reach (`generate.ts` reads `data/shows` recursively and never
sees the sibling).

`data/releases.json` records the same judgement by keeping `1971-08-24` out of
Dick's Picks 35's `dates` — the convention that already means "this release
can't source that show whole".

### Patched and edited tracks

_Dick's Picks 20_ and _28_ both splice material from other nights into otherwise
whole performances, and say so in their own footnotes: 20 patches its
`Mississippi Half-Step` from 1976-10-09 and another track from 1976-10-01, and
prints an "edited version with second verse excised" of `Dancing in the
Streets`; 28 patches from 1973-02-22 and 1973-06-29. _Dick's Picks 32_ footnotes
its `Drums` and `Space` as edited, which is why those two came off a tape
instead (above).

Jason's call, 2026-08-12: import the patched ones as they stand and log it. The
splices are seconds to a verse inside performances that are otherwise the night
in question, and the release is the only source that times them at all — where a
release admits to shortening a whole _piece_, as 32 does, the tape wins instead.

### Set headings and the depth rule

`tracksByDate` ranks headings — `==Section==` above `===Subsection===` above
`'''Disc 1'''` above `:''First set:''` — because an undated heading means two
opposite things depending on where it sits.

Dick's Picks 28 heads each night with a section (`===February 26, 1973 –
Pershing…===`) and opens discs beneath it, so `'''Disc 1'''` is _inside_ that
night. Dave's Picks 50 does the reverse: a `:''May 4 bonus''` subheading sits
inside a disc, and the `'''Disc 3'''` after it leaves the bonus block behind.
Treating every undated heading as a return to the main show gets the second
right and the first badly wrong — with 1973-02-26 moved to `bonusDates`, 2/28
came back carrying both nights, 38 tracks.

So an undated heading _subordinate_ to whatever set the current date stays with
it; a sibling or more senior one returns to the main show. `--audit` reports the
same shows at +0:00 before and after the change.

### Source typos

Wikipedia's _Enjoying the Ride_ track listing misspells four titles. They are
mapped with `aliases` in `data/songs.json` rather than corrected in the show
data, so `--audit` stays quiet instead of re-flagging them on every sweep.

| Article spells it          | Canonical                  | Note                                                                              |
| -------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `Sugar Magonlia`           | `Sugar Magnolia`           | letter transposition                                                              |
| `Greatest Story Even Told` | `Greatest Story Ever Told` | Even/Ever                                                                         |
| `I Know Your Rider`        | `I Know You Rider`         | Your/You; this spelling does circulate elsewhere                                  |
| `Black Throated Wind`      | `Black-Throated Wind`      | missing hyphen — **changes the colour**, since `BLACK_THROATED` ≠ `BLACKTHROATED` |

A fifth was broken markup rather than a spelling: `#"The Other One: > (Weir,
Kreutzmann) – 20:45` never closes its quote, so the unquoted fallback kept the
colon and minted `The Other One:` as a separate song. Fixed in `cleanWikiTitle`
(`generator/import.ts`) by stripping a trailing colon — no song title ends in
one — rather than by aliasing the artifact.

### Additions to the canon from Dick's Picks

Two titles the canon didn't hold, both settled by Jason on 2026-08-12:

- **`Empty Pages`** (5:22, `1971-08-24`, _Dick's Picks Volume 35_) is a Pigpen
  original — the release credits McKernan, not Traffic's Steve Winwood, whose
  same-named song it isn't. Added as a canonical song with its own colour.
- **`Phil Solo`** (2:06, `1977-11-05`, _Dick's Picks Volume 34_) went to
  `notASong`. It opens the second set immediately before `Take A Step Back`,
  which the canon already drops: the two are one crowd-control moment, Lesh
  playing the crowd back off the stage front rather than a piece of repertoire.
  That takes the show from 20 tracks to 19.

### Set headings written flush left

The `Dick's Picks` articles head their sets with an unindented italic line —
`''March 25 – first set:''`, `''Bonus tracks recorded September 2, 1980:''` —
where the releases imported earlier indent theirs (`:''First set:''`). The
importer's heading test required at least one leading colon, so on those
articles **every** set heading was invisible and every track fell to whichever
show the listing was already on. Three of the nine Dick's Picks imports were
wrong because of it:

| Show       | Wrong                                                                             | Right |
| ---------- | --------------------------------------------------------------------------------- | ----- |
| 1972-03-28 | 36 tracks — disc one's Bo Diddley guest set (3/25) and a 3/27 selection prepended | 27    |
| 1985-11-01 | 26 tracks — four bonus tracks from 1980-09-02, Rochester, appended                | 22    |
| 1992-12-16 | 22 tracks — four bonus tracks from 1992-12-17 appended                            | 18    |

The 1985 case is the loudest: it silently placed five-years-earlier music from
another state inside a 1985 show. Fixed by making the indent optional in
`tracksByDate`'s heading match (`generator/import.ts`). `--audit` reports the
same 129 shows at +0:00 before and after, so no already-imported show was
reading its headings that way.

### Reclassified as not a song

`Beer Barrel Polka` was a canonical title and a **1:39 stripe in 1977-05-01**
(The Palladium, track 15, between `Brown-Eyed Women` and `Playing in the Band`).
Jason's call, 2026-08-11: it is a tuning rather than a performance — the same
judgement already applied to `Funiculì, Funiculà`. It moved from `songs` to
`notASong` (both the correct spelling and the tape's `Beer Barrell Polka`), and
the stripe was removed, taking that show from 21 tracks to 20.

This is the first time a `notASong` decision has **retired an existing stripe**
rather than merely excluded a track during import, so it changed art that was
already generated. The show is 1:39 shorter and every stripe after position 15
shifts left.

### Venue naming

Venues are filled in by hand (the importer leaves `venue`/`city` blank), so where
sources disagree the choice is recorded here.

| Show       | Sources disagree                                                                                           | Authored as                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1967-11-10 | Wikipedia's discography says `Shrine Auditorium`; DeadBase and JerryBase both say `Shrine Exhibition Hall` | `Shrine Exposition Hall` — the spelling on the official vinyl release. The Shrine complex has two distinct rooms and the band played both, so Auditorium is not a synonym. |
