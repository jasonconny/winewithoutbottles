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

**`1968-02-23` and `1968-02-24`** (Kings Beach Bowl, Kings Beach) joined them the
same day. _Dick's Picks Volume 22_ says outright that it "documents portions of
the concerts", giving 8 tracks from the first night and 10 from the second,
mastered from Dan Healy's original reels — the live material that also fed
_Anthem of the Sun_. Neither night circulates on archive.org, so unlike a
staged partial there is no soundboard to say what else was played, and unlike a
retiming there is nothing to check the order against. Dick's Picks 22 therefore
carries **no** `dates` at all: both are `bonusDates`, since the release can
source neither whole.

The 2/24 file folds the article's untimed `Cryptical Envelopment` / `The Faster
We Go, the Rounder We Get` / `Cryptical Envelopment` sub-bullets into the single
8:13 `That's It for the Other One` they sit under — the same umbrella the corpus
uses everywhere else.

`Born Cross-Eyed` was added to the canon for the 2/23 file: a Weir song off
_Anthem of the Sun_, credited as such by the release.

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

| Show       | Sources disagree                                                                                           | Authored as                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1967-11-10 | Wikipedia's discography says `Shrine Auditorium`; DeadBase and JerryBase both say `Shrine Exhibition Hall` | `Shrine Exposition Hall` — the spelling on the official vinyl release. The Shrine complex has two distinct rooms and the band played both, so Auditorium is not a synonym.  |
| 1969-04-26 | Wikipedia links the venue as `[[Kinetic Playground\|Electric Theater]]`                                    | `Electric Theater` — the room's name in April 1969. It was renamed Kinetic Playground later that year, so the article's link target is the modern article, not the marquee. |

### Attribution by disc and track number

_Dick's Picks Volume 26_ could not be imported at all: its two nights are split
**within a single disc**, so no heading rule could ever separate them, and
MusicBrainz was no help either because its per-medium titles name one night
where this medium holds two. The article states the attribution in prose instead:

```
*April 26, 1969 – Disc 1 tracks 1–9 (an additional track from this date was released on ''Fallout from the Phil Zone'')
*April 27, 1969 – Disc 1 tracks 10–12, Disc 2
```

`discTrackDates` (`generator/import.ts`) now reads a `==Recording dates==`
section of that shape and, when it resolves completely, it **outranks the
heading walk** — it is the only reader that can split one disc across two nights.
It returns null on any doubt, since a half-read mapping would attribute some
tracks and silently orphan the rest.

Three other releases carry such a section. _Go to Nassau_ was also unreadable
before (23 tracks orphaned, no show importable) and now splits 14/9. _Dick's
Picks Volume 14_ parses identically either way — its headings already worked.
_Rocking the Cradle: Egypt 1978_ writes its bullets date-**last** and references
an unnumbered "Bonus disc" and a DVD, so it bails and is no worse off. `--audit`
reports the corpus unchanged (154 timed, 1 untimed, 1 unparsed) before and after.

### Additions to the canon from Dick's Picks Volume 26

Settled by Jason on 2026-08-13, all from the 4/26/69 Charlie Miller soundboard:

- **`What's Become of the Baby`** (8:18, `1969-04-26`) sits between two `Feedback`
  tracks, and it is not a performance in the ordinary sense — the _Aoxomoxoa_
  studio recording was played over the PA during Feedback, which makes this its
  only "live" appearance. Added as a canonical song anyway, deliberately, for the
  weirdness: the wall records what the room heard.
- **`Silver Threads and Golden Needles`** (`1969-04-26`) — a straightforward
  addition, a cover in the 1969 rotation the corpus hadn't reached yet.
- **`I Know It's a Sin`** — the Jimmy Reed cover the DP 26 article itself calls
  rare. The tape abbreviates it to `It's A Sin`, which is aliased rather than
  added, since a dropped `I Know` would be a different colour.

Two taper spellings were aliased at the same time: `It's a Sin` and
`Sittin on Top of the World` (the canon already held the apostrophe'd
`Sittin' on Top of the World`, and alias matching is exact once lowercased).

### Where the tape and the release disagree about boundaries — 1969-04-26

A taper's tracking is a reading of the music, not a fact about it, and so is a
release's. Two of Charlie Miller's calls on the 4/26/69 soundboard went opposite
ways when Jason listened, 2026-08-13:

- **`Dark Star Jam` (1:37) rejected — folded back into `Mountains of the Moon`.**
  Miller tracks a separate jam after Mountains of the Moon. Jason: there are
  similarities in Garcia's phrasing to the Mountains → Dark Star transition on
  _Live/Dead_, but **none of the key phrases or riffs are played**, so it isn't
  Dark Star. Folded, which restores the official release's `Mountains of the
Moon` — 5:08 + 1:37 = the 6:45 _Dick's Picks 26_ carries. Two independent
  readings landing on the same number is the confirmation.
- **`Caution Jam` (8:05) accepted — Miller's tracking kept over the official
  one.** `Viola Lee Blues` from this date was released on _Fallout from the Phil
  Zone_ as a single undivided track. Jason: the performance **does** contain a
  substantial Caution jam, so Miller's three-way split (`Viola Lee Blues` 10:53
  → `Caution Jam` 8:05 → `Viola Lee Blues` 1:35) is the truer reading, and the
  official timing and tracking were disregarded.

- **`Drums` (0:57) gained — Miller's split kept over the release's single track.**
  _Dick's Picks 26_ lists `Cryptical Envelopment – 3:05` and no Drums at all;
  Miller splits it `Cryptical Envelopment` 2:08 → `Drums` 0:57, and 2:08 + 0:57 =
  3:05 exactly. The corpus follows Miller, so the show carries a Drums stripe the
  release doesn't have. This is why `--audit` reports 19690426 at **+0:57 with 1
  row differing** against DP 26 — that is the deliberate departure showing up,
  not drift.

The set is worth keeping together because the calls point in different
directions:
the release is not automatically right, and neither is the taper. Same class of
judgement as the He's Gone / Truckin' and Drums / Space splits — a track listing
is a CD index, not a claim about where the music ends.

### A release that is partial overall but whole for one night

_Dick's Picks Volume 26_ is `completeness: partial`, and for **4/26/69** it
plainly is: the Miller soundboard runs 27 songs and the release carries 9.

**4/27/69 is the opposite case.** archive.org has exactly one tape for the date,
and its 8 tracks are the release's 8 in the release's order — it is a rip of
_Dick's Picks 26_, not an independent soundboard, so it cannot testify about what
else was played. Jason's call, 2026-08-13: **no source specifically indicates the
setlist is incomplete, so treat it as complete.** The show was promoted to
`data/shows/1969/` with `source: "Dick's Picks Volume 26"` alone — the archive.org
identifier was dropped from `source`, since citing a rip of the release as a
second source would be circular.

### The Tighten Up Jam gets no stripe — 1971-10-31

The DP 2 article carries a `==Set list==` section sourced to _DeadBase XI_ that
lists the complete concert, and it names a **`Jam`** between `Dark Star` and
`Sugar Magnolia` — the "Tighten Up Jam", which the article notes the band played
only a handful of times between 1969 and 1971.

It is **not** authored as a stripe. No source separates it: _Dick's Picks Volume
2_ writes its first track as `"Dark Star" – 23:14 → "Jam" →`, one duration
covering both, and the Gans/Eaton/Miller soundboard does the same. Jason's call,
2026-08-13: since neither the official release, DeadBase nor JerryBase explicitly
breaks it out, leave it folded into the 23:14 `Dark Star`.

The distinction from the He's Gone / Truckin' and Drums / Space splits is that
those had a boundary Jason could hear and place. Here nothing supplies one, and
inventing a seam to honour a setlist entry would be a guess wearing the clothes
of a correction. A rare jam the written record knows about is therefore absent
from the art, deliberately.

The `Cold Rain and Snow` tease on the way back into `Not Fade Away`, which the
same article calls out, gets no stripe either — the standing rule for teases.

### Weather Report Suite, named three ways — 1973-11-30

The suite is authored as **three stripes** — `Weather Report Suite Prelude`,
`Weather Report Suite Part 1`, `Let It Grow` — matching how the corpus already
carries it at 1974-10-17 and 1974-10-18. Getting there took a decision, because
on this date the same words mean different music in different sources:

| source                             | what it calls the suite                                                      | duration    |
| ---------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| _Dick's Picks Volume 14_           | `Weather Report Suite`                                                       | 14:44       |
| `mtx.dusborne` (the skeleton tape) | `Weather Report Suite` + `Let It Grow`                                       | 5:27 + 9:16 |
| `sbd.vernon`                       | `Weather Report Suite Prelude-> Weather Report Suite Part 1` + `Let It Grow` | 5:37 + 9:19 |

The release uses the name for **all three parts** (5:27 + 9:16 = 14:43 against
its 14:44), while both tapes use it for the **first two**. Taking the release's
14:44 onto the tape's slot would have double-counted Let It Grow.

No source on this date separates the Prelude from Part 1. Jason's call,
2026-08-13: keep the established three-stripe convention and supply the split by
listening — **Prelude 1:18, Part 1 4:10**, which sums to 5:28 against dusborne's
undivided 5:27. Two nights later on 12/02 the `sbd.clugston` tape splits all
three itself (1:27 / 4:49 / 9:07), so that show needed no judgement at all.

`Weather Report Suite` was **not** added to the canon. It would have been a third
colour beside the Prelude and Part 1, under a name two sources already use for
different spans of music.

### A track listing held in a template — 1978-02-03 and 1978-02-05

_Dick's Picks Volume 18_ returned **zero tracks for both its nights** while
listing 26, because its track listing is a `{{track listing}}` **template**:
tracks are numbered parameters (`title1=`, `length1=`), not list rows, so every
line-based reader was blind to them. Six eligible releases use the template and
four attach dates to it, so `tracksByTrackListing` (`generator/import.ts`) now
reads it, ahead of the heading walk.

The article uses **both** of the template's date mechanisms at once, and both are
supported:

- **`extra_column = Recording date`** with a per-track `extraN`, which is how
  disc one attributes a first set recombined from three different nights;
- a **`headline`** naming one — `Disc 2 (all tracks recorded on February 3)` —
  covering every track in that block.

Per-track wins where both apply. A track resolving to neither is orphaned rather
than handed to a neighbour: a template block has no "show in progress" to fall
back on.

**A shared helper was wrong.** `monthDayIn` tested only the **first**
`Word Number` pair in a string, and in `Disc 2 (all tracks recorded on February
3)` that is `Disc 2` — not a month, so it returned null and never reached the
date. It now scans every pair and skips non-months, which can only turn a null
into a date and never change one the old form already found. `--audit`
confirms: no already-imported show re-bucketed.

The fix had one side effect worth recording — _Dozin' at the Knick_ also uses the
template, and went from `!! no tracks matched` to parsing. That was the corpus's
only `unparsed` release.

**2/4/78 Milwaukee stays out.** _Dick's Picks 18_ carries two songs from it,
which cannot source a show, so it remains an unimported bonus date.

### 1990-03-24 always shows an audit delta, and that is correct

`--audit` reports 19900324 against _Dozin' at the Knick_ at roughly −9:55 across
three durations, and it always will. Two things combine:

- the show is a **legacy reconstruction with no `source`**, authored from Jason's
  2013 art rather than imported, so the audit has to pick a release by date; and
- of the releases carrying the date, _Spring 1990_ holds it as a **bonus** date
  (which `chooseSource` skips, since it filters on `dates`), leaving only
  _Dozin' at the Knick_ — a **selections** set that was never its source.

So the audit compares hand-authored art against a release holding part of the
night. Jason, 2026-08-13: **accept it as a standing exception.** The show is
spread across more releases than any other in the corpus, and a unified release
that would settle it is unlikely. Do not "fix" the delta.

### Two named jams, treated two ways — 1974-09-09 and 1974-09-10

_Dick's Picks Volume 7_ again reads more finely than the tape, and again the
arithmetic confirms it — but the two jams it names got opposite treatment
(Jason, 2026-08-13).

- **`Wood Green Jam` (5:56) → renamed `Jam`.** The release splits 9/9's
  `Truckin'` into `Truckin'` 10:31 → `Wood Green Jam` 5:56 → `Wharf Rat`, against
  Miller's single 16:31 (10:31 + 5:56 = 16:27). The split is kept; the name is
  not. Wood Green is the London district beside Alexandra Palace, so this is a
  compiler's pun on the locale rather than a piece of repertoire — the same
  judgement already applied to `Boston Clam Jam`, `No MSG Jam` and
  `Mock Turtle Jam`, and it joins them as an alias of `Jam`.
- **`Spam Jam` (7:13) → folded into `Dark Star`.** The release splits 9/10's
  `Dark Star` into `Dark Star` 24:08 → `Spam Jam` 7:13 → `Morning Dew`, against
  Miller's single 31:18. Here the split itself is rejected: the show carries one
  `Dark Star` of **31:21**, the release's own two parts summed. The powell matrix
  independently has 31:22, which is the confirmation. `Spam Jam` went into
  `foldIntoPrevious` so a future import absorbs it without asking.

The difference is what the jam is doing. Wood Green sits between two songs and is
its own passage; Spam Jam is inside the Dark Star and belongs to it.

The suite on 9/10 needed a third source once more. Miller and the release both
carry it whole (18:17 / 18:18); the powell matrix splits it
`Prelude and Part 1` 6:08 + `Let It Grow` 12:10, so only the first boundary was
placed by ear — Jason's 1:22 + 4:46 = 6:08 exactly, and the suite totals 18:18.

Two of the three skeletons were on the wrong tape and were rebuilt: 9/10 had used
a matrix while a Miller transfer existed, and 9/11 had used Miller's
`sbd.miller` (2016-05-21) where his `sbd.miller.repatched` (2016-05-30) is newer.

Note that **9/9 was a one-set show due to a late start**, per a dead.net citation
in the article, so its 19 stripes are the whole night rather than a partial record.

### Seastones > Jam > Eyes > Jam — 1974-09-11

Miller's repatched transfer carries this passage as two enormous tracks,
`Seastones` 41:02 and `Eyes Of The World` 31:45. JerryBase reads it as four:
**Seastones > Jam > Eyes > Jam**, and three other tapes agree, with the GEMS-BCE
matrix supplying the boundaries:

| tape             | Seastones     | Jam      | Eyes  | Jam      |
| ---------------- | ------------- | -------- | ----- | -------- |
| Miller repatched | 41:02         | _lumped_ | 31:45 | _lumped_ |
| GEMS-BCE matrix  | 11:29 + 10:39 | 19:56    | 20:39 | 11:03    |
| bertha-ashley    | 26:59         | _lumped_ | 20:27 | 10:30    |
| hamilton         | 27:02         | _lumped_ | 20:21 | 10:36    |

The tell is `Eyes`: three tapes put it near 20:30 where Miller has 31:45, and
GEMS's `20:39 + 11:03 = 31:42` reconciles Miller to within three seconds. So
Miller is running the trailing jam into Eyes.

Jason listened, 2026-08-13, and took **GEMS on both boundaries**: on the first
"Jerry enters earlier, but the drums enter at the GEMS timing", and on the second
"by GEMS time they've pretty clearly departed Eyes for the unknown." The whole
passage is therefore authored from GEMS — `Seastones` 22:08 (GEMS's two Seastones
tracks summed, since the corpus records one), `Jam` 19:56, `Eyes Of The World`
20:39, `Jam` 11:03 — while the rest of the show stays Miller. That makes the show
59 seconds longer than a pure-Miller reading, 73:46 against 72:47.

`bertha-ashley` and `hamilton` are **missing about fifteen minutes** through this
stretch (57:56 and 57:59 against Miller's 72:47), so they were used only to
corroborate the Eyes and trailing-Jam boundaries, never for span.

### A release that splits what the tapes lump — 1974-08-04/05

_Dick's Picks Volume 31_ is the clearest case of the release being the finer
reader, and twice its split reconciles to a tape's single track almost exactly:

- **8/4, the suite.** The seamons matrix has one `Weather Report Suite` of 14:58.
  The release prints Prelude 1:20, Part 1 4:20, Part 2: Let It Grow 9:16 — 14:56.
  Authored as three stripes with the corpus's names, no ear needed.
- **8/5, the Truckin' passage.** Miller's board has one `Truckin'` of 31:04. The
  release prints `Truckin'` 9:46 → `Jam` 8:16 → `The Other One Jam` 2:30 →
  `Space` 10:25 — 30:57. Authored as four stripes. `The Other One Jam` is a
  spelling of the canonical `Other One Jam` and was aliased rather than added.

`Seastones` came from the tape on all three nights (16:33 / 17:32 / 18:07) under
the excerpt rule below — the release carries it on none of them.

Two caveats sit in this volume and neither is a mistake:

- The **8/4 matrix absorbs between-song announcement into the songs**, having no
  separate banter tracks beyond two `Take A Step Back`. Its `Jack Straw` is 7:47
  against the release's 5:27, its `Peggy-O` 8:49 against 6:47. Release-wins
  covers the tracks the release carries; the eleven stripes seamons alone
  supplies may run slightly long, and there is no better tape — the alternatives
  are 24 tracks against its 27.
- The release's **8/6 `Scarlet Begonias` contains a patch from the August 4
  performance**, per a footnote in the article. That 9:25 stripe is therefore
  partly another night's music. Kept, because it is the release's own timing and
  nothing else can separate the patch.

For 8/6 the skeleton's tape was **rejected**: a tobin 5.1 surround transfer with
no banter tracks at all, whose `The Promised Land` runs 5:17 where two other
tapes say ~3:20. Replaced with `sbd.anon.gems` (2024), which separates a 2:00
tuning and lands closest to the release on the one track both carry (`Eyes of the
World`, 19:23 against 19:28). Jason's call, 2026-08-13. Second time a tobin
surround transfer has had to be set aside — see 1974-03-23, where its titles were
shifted two positions against its own durations.

### Sugar Magnolia and its coda — 1974-08-04

The release lists one track called `Sugar Magnolia / Sunshine Daydream` (10:42);
the tape lists one called `Sugar Magnolia` (13:27) and no Daydream. Neither
separates them, so it is authored as a single `Sugar Magnolia` at the release's
10:42.

Jason, 2026-08-13, on why the combined listing is a quirk rather than an error:
**`Sunshine Daydream` is the coda of `Sugar Magnolia`**, and was only
occasionally performed apart from it — on 1990-07-16 the two bookended the second
set. That is why the corpus never has them adjacent: everywhere the Daydream
appears as its own stripe, it returns after other songs.

### When a partial release EXCERPTS a track, the tape wins — 1974-06-26/28

The standing convention is that the release wins where it carries a song. _Dick's
Picks Volume 12_ is the case that needed an exception carved into it.

Its `Seastones` on 6/28 is **4:52**. Miller's soundboard has **24:33**. On 6/26
the release omits Seastones altogether where Miller has **22:17**. This is not
two readings of a boundary — the release is a `partial`, and its duration is what
the CD holds, not what the band played. Taking it would have put a 4:52 stripe on
a twenty-four-minute performance and left the 6/26 one off the wall entirely.

Jason's call, 2026-08-13: **for a partial release, the tape wins wherever the two
plainly differ.** Release-wins still governs everything else, including the many
small disagreements — it is specifically the excerpt case that is carved out.

The distinction from a boundary disagreement is size and shape: `Truckin'` on
6/26 is 11:06 on the release against Miller's 31:01, but the release splits that
span into `Truckin'` + `Other One Jam` + `Spanish Jam` summing to 29:25, so it is
reading the same music differently rather than holding less of it.

Every other `Seastones` in `data/shows` was checked at the same time and none is
affected: 19740918 comes from `30 Trips Around the Sun`, which is `complete`, and
19741016–19741020 are legacy reconstructions with no release source at all. The
rule bites ahead rather than behind — five staged partials (19740804/05/06 from
_Dick's Picks 31_, 19740910/11 from _Dick's Picks 7_) carry a blank `Seastones`
that must be filled from the tape, not the release.

### A release naming jams the tapes don't — 1974-06-26

_Dick's Picks 12_ names two things neither soundboard separates, and Jason took
the release on both (2026-08-13):

- **`Mind Left Body Jam` (1:39)** between `China Cat Sunflower` and
  `I Know You Rider`. Worth flagging against the 1973-02-26 entry below, which
  rejected an interposed track in that same transition on a 59-0 corpus
  precedent: there the claim came from **one taper** against every other source,
  here it comes from the **official release**.
- **`Other One Jam` (3:06)** where the oleynick tape says `The Other One` (4:00).
  This added `Other One Jam` to `data/songs.json` — a deliberate canon entry, and
  a distinct colour from `The Other One`, which is the point: a jam on the theme
  is not the song.

The suite on 6/26 came from a third source again. Miller carries it as one 16:43
block; the oleynick tape splits it 1:18 / 4:24 / 10:59, summing to 16:41 — two
seconds off Miller. So the split is taken from oleynick rather than placed by
ear, the only three stripes on that show not from Miller or the release. On 6/28
no such trouble: _Dick's Picks 12_ prints the split itself (Prelude 1:11, Part 1
4:16, Let It Grow 9:08, against its own 14:35 umbrella) plus a 27:54 `Jam` that
the staged skeleton had dropped entirely, because the umbrella title
`Weather Report Suite` is not in the canon.

### A transition jam that gets no stripe — 1973-02-26

The two soundboards for this date disagree by exactly one track. `sbd.kaplan`
(2004) breaks out a **0:42 `Jam`** between `China Cat Sunflower` and
`I Know You Rider`; `sbd.roman.revision` (2025) folds it into China Cat. No
Miller transfer exists for the date, and _Dick's Picks 28_ carries neither song,
so nothing but the tapes could settle it.

The corpus settled it instead: it holds **59** `China Cat Sunflower` →
`I Know You Rider` pairs and **not one** with anything between them. A 42-second
stripe here would be the sole exception in a transition the band played the same
way for twenty years. Jason's call, 2026-08-13: take the revision, no `Jam`
stripe, 25 songs.

Choosing the revision also decided the other blanks, per the one-tape rule below
— which matters, because the two transfers disagree by 1:41 on `El Paso`
(4:15 against 5:56) and by 0:56 on `Big Railroad Blues`.

### Which tape a staged partial is built from

Three rules, in this order of precedence (Jason, 2026-08-13).

**1. Charlie Miller's transfer wins.** Not merely as a tie-break — outright.
`findRecordings` had always sorted his transfers first, but `bestRecording` then
re-picked on raw score and overruled it, which is how 1973-12-19 came to be
staged from a 26-track patched transfer instead of Miller's 24. The patched one
ran **4:35 long** through the Other One passage, where Miller agreed with
_Dick's Picks 1_ to within 12 seconds, and it had also broken out a `Bass Solo`
and 3:00 of stage announcement to inflate its count.

**2. Among Miller's own copies, the most recent.** He re-transfers, and the
later pass is the better one. 1973-12-19 has two — `sbd.miller.113503` (2011)
and `sbd.miller.97361` (2009) — and the 2011 copy is the one that squares with
the release. `findRecordings` now requests `addeddate` and orders his items
newest first.

**Recognising him at all took two passes.** `isMiller` originally read only the
`transferer` metadata field, and that field is sometimes **empty**:
`gd78-05-11.sbd.miller.16333.sbeok.shnf` names him in the identifier alone, so
one of his soundboards was silently classified as somebody else's. The test now
falls back to `[.-]miller[.-]` in the identifier — narrow on purpose, matching the
etree convention and the collaborations (`eaton-miller`, `gans.eaton.miller`,
`dalton.miller.clugston`) without matching a word that merely contains the
letters. Widening it revealed exactly one previously-invisible Miller on an
already-authored date, 1973-12-02's `s2.sbd.miller` — and the completeness guard
correctly refused it, since it is a **set-two-only** tape scoring 9 against the
fullest candidate's 23. No authored show changed.

**Rank is still not completeness**, so rule 1 is conditional. On 1974-08-05 the
only Miller item is a one-track `jam-segment` excerpt sitting beside three
complete 25-track soundboards; taking it would stage a show of one song. Miller
therefore wins only when his tape reaches `MILLER_MIN_SHARE` (0.8) of the
fullest candidate's usable track count — 24/26 clears it, 1/25 does not.

**3. Blanks are filled from whichever tape the skeleton was built from**, so a
show carries one consistent reading of where songs begin rather than a mix.
Released timings still win where the release carries the song, which is the only
place a show mixes readings at all.

Rule 3 is last, and only decides what rules 1 and 2 leave open. Where Miller has
nothing, the scorer's pick stands: 1973-11-30 uses `mtx.dusborne` over
`sbd.vernon` despite vernon being a pure soundboard, because dusborne tracks
finer — it splits `Bertha` from `Promised Land` where vernon runs them together
as one 9:35 track.

### An `{{ordered list}}` written inline — 1971-08-06

_Road Trips Volume 1 Number 3_ reported **zero** tracks for its Hollywood
Palladium bonus block while plainly listing five. The article writes
`{{ordered list}}` both ways in the same page: an item per line for its 7/31 and
8/4 blocks, and **inline** for 8/6, with the whole list on one line —

```
| start = 1|"Bertha" (Garcia, Hunter) – 7:04|"Mr. Charlie" (McKernan, Hunter) – 3:57|…
```

— and the reader only knew the per-line form. `parseTrackLine`
(`generator/import.ts`) now returns 0..n tracks per line, taking the inline form
when a line holds two or more quoted segments; a genuine single row has exactly
one, and the leading `start = 1` parameter carries no quote and drops out.

A second bug surfaced underneath the first: splitting the line on `|` tore
`"[[Brokedown Palace (song)|Brokedown Palace]]"` into a titleless half and a
quoteless one and **lost the track with no warning** — four of five came through.
`splitTopLevelPipes` now ignores separators inside `[[…]]` and `{{…}}`.

`--audit` covers 159 shows across 52 releases with no already-imported show
changed.

### Timings mixed from three sources — 1971-08-06

Two eligible releases carry 8/6 and neither carries it whole: _Dick's Picks
Volume 35_ has it as bonus tracks (7 songs) and _Road Trips Volume 1 Number 3_ as
a bonus disc (5 songs), together 12 of the 20 played. The remaining 8 come from
`gd1971-08-06.sbd.miller.96541.sbeok.flac16`.

The standing convention held — the release wins where it carries a song — but
this is the case that shows what the convention costs. _Dick's Picks 35_ agrees
with Miller to within seconds, while _Road Trips 1:3_ disagrees by up to **1:53**
and not in a consistent direction: `Bertha` 7:04 against Miller's 8:57,
`Mr. Charlie` 3:57 against 5:13, `Cumberland Blues` 5:50 against 7:08 — yet
`Hard to Handle` is _longer_ on Road Trips, 8:20 against 7:48. So it isn't a
uniform trim, and the finished show mixes two readings of where songs begin.
Jason's call, 2026-08-13: keep the released timings anyway.

The show takes the tag of its **chosen** source only, so it carries `Dick's
Picks` and not `Road Trips` — DP 35 is `complete` and a series volume where Road
Trips 1:3 is `unknown`. All three sources are named in `source`.

This closes _Dick's Picks Volume 35_: 1971-08-07 and 1971-08-06 in
`data/shows/1971/`, and 1971-08-24 in `data/unknown-setlists/`.

### Timings mixed from two sources — 1971-10-31

_Dick's Picks Volume 2_ is a single CD holding the second set only, so it carries
6 of the night's 21 songs. The rest come from the archive.org soundboard
`gd1971-10-31.142426.sbd.gans.eaton.miller.flac1644` — as definitive as an
unofficial transfer gets: David Gans hosted the syndicated _Grateful Dead Hour_
and was loaned vault tapes for it, and Rob Eaton recovered a major batch of Betty
Boards and returned them to the vault.

Where both sources carry a song the **release wins**, which is the standing
convention. They nearly agree anyway — `Dark Star`, `Sugar Magnolia` and
`St. Stephen` are identical to the second; `Not Fade Away` 7:25 vs the board's
7:28, `Goin' Down the Road Feeling Bad` 10:38 vs 10:35, and the `Not Fade Away`
reprise 3:19 vs 3:31. Net effect of preferring the release across those six: the
show is 12 seconds shorter than a pure-board reading. Both sources are named in
`source`, pipe-separated.

### Two parser blind spots the Download Series exposed

Neither was a source error. `generator/import.ts` recognised three heading
shapes — `==Section==`, `'''Bold'''`, `:''Italic:''` — and the Download Series
articles use two more.

**A definition-list term.** _Download Series: Family Dog at the Great Highway_
heads its bonus block `;Bonus tracks`, not `:''Bonus tracks:''`. Unrecognised,
it was not a heading at all, so the three tracks below it — 10/5/70 and 12/31/70
at Winterland — joined the February 4 show, which came back with twelve tracks
instead of nine. The `;` form now ranks with `'''`, which is what it is.

**A date on its own line.** _Download Series Volume 7_ writes `===Disc one===`
and then, unadorned on the next line, `9/3/80 Springfield Civic Center,
Springfield, MA`. No heading names a date, so with two dates on the release
nothing became `main` and all 34 tracks orphaned — the release was unreadable.
A bare line now sets the date, but only when the date **opens** the line, the
line carries no list markup, and it resolves to a date the index already claims.
That narrowness is the point: scanning free text for dates is what drags in
neighbouring releases, which is why the release index deliberately doesn't do it.

Both changes are inert on the existing corpus — `--audit` is byte-identical
before and after.

### `unknown` completeness is the absence of a reading — the Download Series

Nine of the thirteen volumes came back `completeness: 'unknown'`, because the
discography names a principal date for each and the articles rarely say the
words "complete concert". Read one by one, the articles say plenty:

| volume     | date       | what the article actually says                           | verdict         |
| ---------- | ---------- | -------------------------------------------------------- | --------------- |
| 6          | 1968-03-17 | first-set closer plus "the entire second set"            | unknown setlist |
| 12         | 1969-04-17 | "a complete two-disc show"                               | complete        |
| 2          | 1970-01-18 | "a previously uncirculated concert"                      | unknown setlist |
| Family Dog | 1970-02-04 | recorded 2/4/70, plus 10/5 and 12/31 bonus               | unknown setlist |
| 3          | 1971-10-26 | "almost complete … with the exception of" one song       | complete        |
| 10         | 1972-07-21 | "nearly the entire concert"; opener missing              | unknown setlist |
| 8          | 1973-12-10 | "most of the concert"; five songs named as omitted       | unknown setlist |
| 4          | 1976-06-18 | "virtually all of" it; Tennessee Jed lost to tape damage | complete        |
| 7          | 1980-09-03 | discs one and two are the whole 9/3 show                 | complete        |
| 7          | 1980-09-04 | disc three is "the second set from" 9/4                  | shipped         |
| 1          | 1977-04-30 | "the complete show", plus 4/29 bonus                     | complete        |
| 11         | 1991-06-20 | "the complete show", plus 6/19 bonus                     | complete        |

Volume 4's reading is the one that mattered most: **19760618 was already on the
site**, imported while the release read `unknown`, and it was missing Tennessee
Jed the whole time. Charlie Miller's `ds-outtakes` transfer carries the song the
release dropped, at 11:07, and DeadBase and JerryBase both place it after
`Samson and Delilah` — checked in both by Jason, 2026-08-14, and they agree. The
show is now 21 songs.

That agreement is what makes the placement safe to author. A recovered song needs
two answers, and the outtakes transfer only gives one: it is a bonus reel, so it
carries the duration and says nothing about where in the night the song sat.

Volume 3 is the same shape a disc smaller: the release omits `Beat It On Down
the Line`, the article says it "was played after 'Loser'", and the soundboard
`gd71-10-26.sbd.cotsman.9761.sbeok.shnf` times it at 3:12. DeadBase and JerryBase
both put it in that slot, confirmed by Jason 2026-08-14. Both shows name two
sources in `source`, pipe-separated.

That threshold is Jason's call, 2026-08-14, and follows the _Winterland 1973_
precedent already in `HAND_RESOLVED`: a release missing one song whose timing
can be recovered still sources a whole show. A release missing songs nothing can
time does not — which is why Volumes 8 and 10 are held as unknown setlists
rather than shipped.

**One missing song is not one verdict.** Three volumes are short by a single
song and they land in two different places, on the same rule applied to the
evidence rather than the count:

| volume | date       | missing song             | where the timing came from     | outcome         |
| ------ | ---------- | ------------------------ | ------------------------------ | --------------- |
| 3      | 1971-10-26 | Beat It On Down the Line | soundboard, 3:12               | shipped         |
| 4      | 1976-06-18 | Tennessee Jed            | Miller's outtakes, 11:07       | shipped         |
| 10     | 1972-07-21 | Promised Land            | nowhere — the tape opens later | unknown setlist |

### Two nights the sources will not agree on — 1970-01-18 and 1970-02-04

Both are in `data/unknown-setlists/`, and for the same reason in mirror image.

**1/18/70, Springer's Ballroom.** _Download Series Volume 2_ presents nine songs
on one 79:47 disc and never calls it complete. Nothing circulates on archive.org
for the date at all, so the release is the only witness — except that JerryBase
lists songs it does not carry, and the band played a two-set show at the same
venue two nights earlier, which is the shape a full night there took.

**2/4/70, Family Dog at the Great Highway.** Here there are three witnesses and
no two agree. The release has nine songs for the date. Seth Kaplan's soundboard
`gd70-02-04.sbd.kaplan.14188.sbeok.shnf` has eight, including a `Jam` the release
omits and missing five the release has. JerryBase opens the night with `Cold Rain
and Snow`, which appears on no tape. Three readings of one night, disagreeing
about contents and order both.

### A Prelude nobody played — 1972-07-21

Both _Download Series Volume 10_ and the soundboard
`gd72-07-21.sbd.cotsman.9246.sbeok.shnf` carry a `Weather Report Suite Prelude`
after `Casey Jones`, and the article itself flags it as "truncated and contains
errors". JerryBase says what actually happened: it is

> More of a tease, Bob bails on it and says with a chuckle "Well anyway, what
> we're gonna do next is, uh history" and they go straight into Me And My Uncle

1:04 on the tape, and the show does indeed run straight into `Me and My Uncle`.
Jason's call, 2026-08-14: **no stripe**. Two sources naming a track is not two
sources saying it was performed — both are indexing a tape, and the tape has a
minute of Bob changing his mind on it.

Removed from this show only, **not** added to `notASong`. That list is global by
title and the corpus carries real performances of the Prelude at 1973-11-30,
1974-10-17 and 1974-10-18; blacklisting the name would silently delete those.
This is the mirror of `Funiculì, Funiculà`, which is in `notASong` precisely
because the Dead never played it as anything but a tease.

7/21/72 sits in `data/unknown-setlists/` for a separate reason — see the
one-missing-song table above — and its `Jam` between `Drums` and `The Other One`
takes the tape's 3:45, the one song the release lacks that the tape supplies.

### A known setlist that still can't be drawn — 1973-12-10

This one is the clearest statement of what `data/unknown-setlists/` is actually
for, because the setlist is **not** what's unknown. _Download Series Volume 8_
holds "most of the concert" and the article names exactly what it drops: `Jack
Straw`, `Tennessee Jed`, `El Paso` and `Brown-Eyed Women` from the first set,
`Me and My Uncle` from the second. Twenty-six songs, all named.

What can't be recovered is how long five of them were, and a stripe **is** a
duration — so five songs that are certainly known to have been played cannot be
drawn at all. The only recording catalogued for the date,
`gd73-12-10pt.sbd.elliot.11800.sbeok.shnf`, is a two-track fragment: 1:51 of
`Casey Jones` and `One More Saturday Night` 4:58. Nothing else circulates.

The route here went through `data/partial-shows/` first and that was wrong twice
over. `--partial` builds its skeleton from the fullest circulating soundboard, so
on a two-track tape it produced a two-song skeleton that silently dropped twenty
songs the release carries — worse than no skeleton. Rebuilding it by hand, with
the five omissions blank, fixed the file but not the classification: a blank in
`data/partial-shows/` is a work list, and here there is no work anyone can do.

So the file holds what can be timed — the release's 21 tracks in its own order,
plus `One More Saturday Night` from the fragment, which the release lacks and
which closes the night after `Casey Jones`. The five untimed songs are
**deliberately absent rather than blank**, and named in the `note` instead. Their
positions were never known either: the article gives the set each belongs to, not
the running order. Jason's call, 2026-08-14.

3/17/68 failed the other way, and ended up in the same place. No tape is
catalogued for the date at all, so `--partial` had nothing to work from, and the
release alone cannot say what it lacks. It was staged by hand at first, on the
assumption that a setlist source could name the missing first set later — but
JerryBase lists 3/17/68 as a **partial setlist** itself, and two archive.org
searches return nothing for the date. So the missing songs are unnamed at the
source as well as untimed, and there is nothing for a staged file to be waiting
for. Jason's call, 2026-08-14: it moves to `data/unknown-setlists/`, which is
exactly the distinction that directory draws — a partial waits for a timing
somebody can still supply, these wait for nothing.

### A footnote the heading walk can't reach — 1969-04-17

_Download Series Volume 12_ ends its listing with a caption rather than a
heading:

    ;Disc two
    #"That's It for the Other One" - 22:44
    # "Caution (Do Not Stop On Tracks)" - 1:53
    # "The Eleven" - 13:57
    # "Dupree's Diamond Blues" - 5:06
    :''3 and 4 are bonus tracks from Avalon Ballroom, January 23, 1969 rehearsals.''

Two things put that out of reach of the heading walk, and either alone would be
enough. It numbers tracks **within disc two**, so "3 and 4" means the eleventh
and twelfth tracks of the release. And it sits **after** the tracks it describes,
so by the time the walk reads it — and it does read it, resolving January 23,
1969 to a bonus date the index already knows — there is nothing left to
reassign. The show came back with twelve tracks and 2:00:43, two of them a
rehearsal three months earlier at another venue.

Recorded as a `SHOW_OVERRIDES` drop rather than parsed. A caption that
back-references list positions is a shape the walk isn't built for, and teaching
it to read numbers pointing backwards into a list it has already consumed would
be a lot of machinery for one article — but a silent mis-attribution is exactly
what the override table exists to pin, so a re-import can't quietly restore them.

Two things about the remaining ten that look like transcription errors and are
not. `St. Stephen` 2:34 > `I Know It's a Sin` 3:45 > `St. Stephen` 3:01 is how
the night actually went — Jason listened to the release to check, 2026-08-14 —
so the Jimmy Reed blues sits inside St. Stephen rather than either side of it,
and the two St. Stephen stripes are one song interrupted, not a reprise.

And the show **ends mid-`Caution` at 1:53**, which is not a
truncated tape: the plug was pulled, and the banter on the release has the band's
road manager arrested. Jason's call, 2026-08-14, from the _Deadcast_. So the last
stripe being a stub is the record of how the night ended, not a gap in it.

### Timings mixed from two sources — 1980-09-04

The counterexample to all three of those, and the reason the distinction is worth
drawing. _Download Series Volume 7_ gives 9/4/80 a single disc — the second set,
ten songs of the night's twenty-two — which is the same shape of gap that put
12/10/73 and 7/21/72 out of reach. Here somebody could supply the timings, and
did: Charlie Miller's phase-repaired soundboard
`gd1980-09-04.175071.sbd.miller.phase-repair.flac1644` carries the whole show,
and the staged skeleton was built from it, so the twelve blanks were filled in
one pass and the file promoted to `data/shows/1980/`.

Where both sources carry a song the **release wins**, which is the standing
convention, so the second set keeps Volume 7's timings and the first set takes
Miller's. Both are named in `source`, pipe-separated.

1980-09-04 stays in Volume 7's `bonusDates` rather than moving to `dates`: the
release still holds under half the night, and `dates` records what a release can
source whole. Same reading as _Dick's Picks Volume 28_, whose 1973-02-26
selections stay out of `dates` while the show itself is in the corpus.

One disagreement left standing. The article heads disc three "Second set:
(missing 'Samson and Delilah' and 'Ramble On Rose')", placing both in the second
set; Miller's tape has them as tracks 11 and 12, closing the first. The corpus
stores no set boundaries, so this only affects running order, and there the tape
is the better witness — it is the recording of the night, while the article is
describing a disc.

### Additions to the canon from the Download Series

- **`Ballad of a Thin Man`** — Dylan, 7:04, first set of 3/27/88.
- **`So What`** — Miles Davis, 0:57 on 3/27/88, segued between two `Space`s.
  Short enough to read as a tease, which would have put it in `notASong` beside
  `Funiculì, Funiculà`; Jason's call, 2026-08-14, is that it gets a stripe.
- **`Supplication Jam`** — 4:36, opening the second set of 9/4/80. The
  instrumental without the song, so it is not `Supplication` and declares
  `sharesPrefixWith` against it.
- **`Walking Blues`** aliased onto **`Walkin' Blues`**, which the canon already
  had. Wikipedia's display text differs from the DeadBase spelling by one letter
  that `cleanTitle` keeps, so unaliased it would have been a second colour.
- **`Bobby McGee`** aliased onto **`Me and Bobby McGee`** — a taper's shortening
  on the 7/21/72 soundboard, which cost that show's skeleton a song until it was
  mapped.
- **`Drums with Brent`** aliased onto **`Drums`**, and folded into the `Drums`
  that follows it. Volume 7 runs the 9/3/80 passage as three tracks — `Jam` 2:48,
  `Drums with Brent` 2:47, `Rhythm Devils` 8:51 — and the last of those is
  already an alias of `Drums`, so the middle one is the front of the drum
  segment, not a second jam. 9/3/80 therefore carries `Jam` 2:48 then a single
  `Drums` of **11:38**, and the show is 23 tracks against the release's 24.

  The fold is a **hand edit**, not a `foldIntoPrevious` entry, because that list
  folds a track into the one _before_ it and here the drums come _after_. Expect
  9/3/80 to show a permanent `24→23` in `--audit`, the same way the other
  authored departures do.

### A disc order that isn't the show — 1969-05-23 and 1988-04-01

_Road Trips Volume 4 Number 1_ sequences the Big Rock Pow-Wow set as `Hard to
Handle`, then `Dark Star` > `St. Stephen` > `The Eleven` > `Turn On Your
Lovelight`, and finally `Morning Dew` and `Me and My Uncle`. Those last two
opened the show. DeadBase and JerryBase agree on the performance order, and it is
the shape a 1969 set actually takes — the Dark Star suite closes, it doesn't sit
in the middle with two songs trailing after Lovelight. Jason's call, 2026-08-14.

The authored order is therefore:

    Hard to Handle > Morning Dew > Me and My Uncle > Dark Star > St. Stephen >
    The Eleven > Turn On Your Lovelight

This is the clearest case yet of the standing rule that **a release names and
orders tracks for a CD, not for a setlist**. Nothing about the audio is wrong; a
two-disc set has to start somewhere, and starting on `Hard to Handle` reads
better than starting on the Dew. But stripes are a claim about what was played
and in what order, so the disc's convenience is not the record.

Pinned with `keepAuthored` in `SHOW_OVERRIDES`, which is what stops a re-import
from quietly restoring disc order. That flag was added for a different problem —
a release packing several songs into one track — but its mechanism is exactly
what's wanted here: the merge path claims tracks by **title, one-to-one, and
deliberately not in order**, precisely because some releases resequence rather
than excerpt. So durations still retime while the authored sequence stands.

**1988-04-01 is the same artefact in a smaller way.** _Road Trips 4:2_ fills out
disc one with the April 1 encore, so `Brokedown Palace` lands at track 9 of 19,
sitting between the first set and a whole disc of second-set music. It closed the
night. Jason caught it as a missing encore rather than a misplaced one, because
of a **separate parser bug** that hid the track entirely (below); with that fixed
the release yields all 19 songs, in an order that still isn't the show's, so this
date carries `keepAuthored` too.

Both cases are worth stating as one rule: **where a release puts a track is a
fact about the disc, not about the night.** Sequencing decisions — open on the
stronger song, use up the space at the end of a disc — are exactly the kind of
thing a CD index does and a setlist does not.

### An {{ordered list}} row hiding behind its own parameter — 1988-04-01

Road Trips 4:2 writes its April 1 encore as

    {{ordered list
    | start = 11|"Brokedown Palace" (Garcia, Hunter) – 5:21

with the `start` parameter and the first track sharing a line. Every other list
in the article writes `{{ordered list|start=11` and puts the track on the line
below, which is the shape the row-start guard recognises: it accepts `|"` only at
the very beginning of a line. Behind `| start = 11|` the track was invisible, and
4/1/88 came back a song short with nothing to indicate anything was missing.

The line _was_ already being split on top-level pipes — that path exists for
combined rows carrying several quoted titles — so the fix is to take that path
for a single quoted segment as well, when the line starts with a pipe but not
with `|"`. Narrow on purpose: it adds the one shape and leaves every existing
line classified as before. `--audit` is unchanged across the corpus.

### Sub-items are data or decoration depending on the duration

A `#*` row under a `#` row names the movements inside one track. Whether those
rows are tracks turns on whether they carry a time, and three articles show all
three shapes:

| release         | umbrella                               | sub-items                 | what they are    |
| --------------- | -------------------------------------- | ------------------------- | ---------------- |
| Road Trips 2:2  | `"That's It for the Other One" – 9:30` | `"Cryptical Envelopment"` | decoration       |
| Dick's Picks 31 | `"Weather Report Suite" →`             | `"Prelude" – 1:20`        | the only timings |
| Dick's Picks 12 | `"Weather Report Suite" – 14:35`       | `"Prelude" – 1:11`        | the finer split  |

Reading Road Trips 2:2's three movements as tracks gave 2/14/68 three untimed
songs, and the importer refuses any show with an untimed track — correctly, since
stripe widths _are_ the durations. But dropping every `#*` would have thrown away
Dick's Picks 31's only timings for the suite, and Dick's Picks 12's three-stripe
split, which is the form the corpus keeps. So the rule is: **drop an untimed
sub-item, keep a timed one**. `--audit` is byte-identical across the change apart
from 2/14/68 becoming sourceable.

### When the last title is the wrong one — 1975-08-13

A track carrying two titles and one duration takes the **last** of them: _Dick's
Picks 29_ lists `"Lady with a Fan" / "Terrapin Station" – 11:43`, and the second
name is the song while the first is its opening movement. There is one duration,
so splitting would invent a boundary.

_One from the Vault_ inverts that twice. It lists
`"Eyes of the World" / "Drums" – 14:32` and `"Crazy Fingers" / "Drums" – 13:08`,
where the last title is not the song but what the song runs **into**. Taking it
put a **14:32 `Drums`** on the wall where an `Eyes of the World` belongs — and
because a title's word content is its colour, that is not a mislabelled stripe
but a different one. Both songs had vanished from the corpus entirely.

`Drums` and `Space` are now excluded from winning a combined row
(`TRACK_TAIL_TITLES` in `generator/import.ts`); the first title wins instead.
Only six combined tracks exist across the whole catalogue, so this was checked
against all of them rather than assumed.

**All three rows were then split by ear.** The titles are the parser's business;
the boundaries are not. `"Help on the Way" / "Slipknot!"` (7:52) names two real
songs, neither an appendage, and the corpus stores them separately everywhere
else — so it could not simply be renamed. Jason timed all three pairs from the
release itself:

| Release row                            | Authored as                           |
| -------------------------------------- | ------------------------------------- |
| `"Help on the Way" / "Slipknot!"` 7:52 | Help On The Way 3:38 + Slipknot! 4:14 |
| `"Eyes of the World" / "Drums"` 14:32  | Eyes Of The World 12:10 + Drums 2:22  |
| `"Crazy Fingers" / "Drums"` 13:08      | Crazy Fingers 9:14 + Drums 3:54       |

Each pair still sums to the release's figure, so the show total is unchanged at
121:05 — the same discipline as the 1974-10-19 and 1978-05-13 splits.

The FM tape (`gd1975-08-13.fm.cousinit.18512.sbeok.shnf`) was **not** the source
for these. Its timings disagree with the release throughout — Franklin's Tower
7:05 against 6:58, The Music Never Stopped 5:19 against 5:29 — and it carries no
drums track after Crazy Fingers at all, so it could suggest where a seam lies but
never where it lies on this recording.

**`--audit` reports `19750813` as `18→15` at `+0:00` permanently, and that row is
the safeguard.** `keepAuthored` was tried here and removed: it merges the
release's timings onto matching titles, so it would write the undivided 7:52 back
over `Slipknot!` and report a tidy-looking `18→18, +9:54` — a worse signal than
the honest track-count mismatch. Neither mode protects the file from `--write`;
what protects it is that the count differs loudly.

### A night the release deliberately halves — 1987-07-12

_Giants Stadium 1987, 1989, 1991_ holds the Dead's two sets from 7/12/87 and
states in the article's own words that Bob Dylan's third set, played with the
Dead backing him, "is not included". That is thirteen songs, and because the
encore came after Dylan's set it takes `Touch of Grey` and
`Knockin' on Heaven's Door` with it — so the authored show ends on
`Not Fade Away` and runs 122:19 against ~160 for every other show in its batch.

The show is authored as the Dead's own sets, with a `note` recording the
absence. It is **not** marked partial: the release is complete for what it set
out to document, and no published source times the third set at all.

Five more nights on that tour have the same shape, two of them already in the
release index — see `data/DYLAN-AND-THE-DEAD.md`, which also records what
including the Dylan sets would take.

### A show the article can't time and MusicBrainz can — 1966-07-29

_July 29 1966, P.N.E. Garden Aud., Vancouver Canada_ is a vinyl-only Record Store
Day release, and its Wikipedia track listing gives titles, sides and composers
but **not one duration**. The importer therefore refuses it outright, which is
the untimed-track guard doing its job — stripe widths _are_ durations, so there
is nothing to guess with.

MusicBrainz has the release in full
(`f1ea8bd0-b5a0-4a2c-a32b-49147a0e9e45`), with every timing. The importer's
MusicBrainz fallback still cannot use it, and the reason is worth recording
because it looks like a bug and is not: that path attributes tracks by **medium
title**, and these two media are titled `12" Vinyl 1` and `12" Vinyl 2`. They
name a disc, not a night — and this release needs a night named, because the
article says it holds "the complete concert recorded ... on July 29, 1966. It
also includes four songs recorded at the same venue on the following day."
Taking the media whole would file four 7/30/66 songs inside the 7/29 show.

So the two sources were combined by hand, each supplying what only it has: the
**article gives the date split** (Sides A–C are the show, Side D the bonus), and
**MusicBrainz gives the timings**. They agree track-for-track in order — Vinyl 1
is Sides A and B, Vinyl 2's first three tracks are Side C — so the show is the
first 13 MusicBrainz tracks, totalling 61:56.

**`--audit` reports 19660729 as untimed against its release and always will**,
like the two Spectrum shows below. Side D's four songs are recorded in
`data/BONUS-TRACKS.md` as 1966-07-30; they had never been indexed, because the
release's own bonus heading names no date the parser could bucket to.

Two titles entered `data/songs.json` for this show: `Standing on the Corner`, a
1966 original the band stopped playing (the Rolling Stone piece on this release
calls it their last live performance of it), and `Stealin'`, the Gus Cannon jug
tune. Both are era-appropriate one-offs of exactly the kind the canon's long tail
is for.

### Two shows no published source can time — 1979-11-05 and 1979-11-06

Both _Road Trips Full Show_ releases were download-only. Their Wikipedia listings
carry no durations at all, and MusicBrainz has no copy of either, so the release
gives the setlist and its order and nothing else. **`--audit` reports both as
untimed against their release and always will** — that is correct, not a defect.

They were first authored from soundboards, which is the only thing an outside
source can do here, and then **reconciled against the official downloads** by
Jason, whose copies are the only place the real durations exist. Both tapes had
matched the release setlist 1:1 in order, so the setlists needed no change; the
timings did, in two quite different ways.

**11/6/79 ran 8:39 long**, because `gd79-11-06.sbd.miller.29735.flac16` folds
lead-in tuning into each track — Mexicali Blues by 1:57, Tennessee Jed by 1:45,
Jack-A-Roe by 1:15. That was predictable and had been predicted: the GEMS
transfer of the same night breaks tuning out as separate tracks and totals 139:15
against Miller's 154:41.

**11/5/79 was within 12 seconds overall** and still wrong in the middle:
`gd79-11-05.sbd.wier.12177.sbeok.shnf` gave `Franklin's Tower` 13:38 and the `Jam`
after it 5:22, where the release has 16:37 and 2:42. Same music, boundary drawn
nearly three minutes early. A show total agreeing is not the same as the stripes
agreeing, which is the whole reason durations are per-song here.

One transfer was **rejected** along the way, despite the standing "Miller wins
outright" rule: `gd1979-11-06.150953.sbd.newhouse.miller.flac2496` lists a
`Wharf Rat` and a `Casey Jones` encore that neither the release nor two other
tapes have. That rule picks between plausible transfers; it does not oblige
anyone to believe a demonstrably wrong track list.

`source` on both names the release alone — the tapes supplied nothing that
survived, and each show's `note` records what they got wrong.

### The Road Trips full-show downloads are Road Trips, not Download Series

Both are filed under _Download Series_ in Wikipedia's discography, accurately —
they were digital releases continuing that stream. They are indexed here as Road
Trips anyway, because they exist as an answer to it: _Road Trips Volume 1 Number
1_ was a highlights compilation, deadheads are vocal about wanting whole shows,
and these two full-show downloads were the response. The 11/6/79 article says as
much — "a spin-off of the Road Trips series", "a full show from the same tour as
that release".

What moves is the **series**, not just the tag. A series release's tag is its
series, pinned by `tests/data-validity.test.ts`, so overriding the tag alone left
one tag spanning two series and failed the rule that a tag page has a single
owner. `HAND_SERIES` in `generator/hand-readings.ts`, so a re-draft reproduces
it. Jason's call, 2026-08-14.

### A night with one set on tape — 1977-10-07

Road Trips 1:2 draws four tracks from this show, and the skeleton looked nearly
fillable at six blanks. It isn't: **every recording catalogued for the date is
set two only.** All four archive.org identifiers say so — `sbd-set2` twice,
`pset2`, and the fullest transfer, `gd1977-10-07.170389.sbd.miller.flac1644`,
which carries ten tracks and no first set. archive.org's own listing shows set
two opened with `Samson & Delilah` and `Sunrise`, which no tape has either.

So it moved to `data/unknown-setlists/` on the same reading as 1973-12-10: the
missing songs are not waiting for a timing somebody can supply, they are waiting
for a tape that does not circulate. The ten surviving songs are all timed —
four from the release, six from the Miller transfer — because what is here is
known; it is the rest of the night that cannot be claimed.

**The venue was also wrong, and the shape of the release is why.** This is
University Arena — The Pit — at the University of New Mexico, Albuquerque. Road
Trips 1:2 attributes every track individually through a `Recording venue and
date` column, so 10/11/77, 10/14/77 and 10/16/77 take their venues from the
release itself. 10/7/77's tracks sit on the bonus disc, outside that column, and
the venue had been guessed from the lede's list of states — "New Mexico,
Oklahoma, Texas, and Louisiana" — landing on Texas. The tape's own metadata
settled it. Worth remembering that a release naming venues per track names them
only for the tracks in that table.

### An undated disc that continues the bonus — 1978-04-15

_Dave's Picks Volume 37_ heads its bonus block `:''Bonus tracks – April 18,
1978:''`, gives it two tracks, and then opens `'''Disc 3'''` with no date at all.
That whole disc is still April 18. The article's own DeadBase note proves it,
printing the 4/18 setlist and marking each of those eight songs "Included in
_Dave's Picks Volume 37_" — so 4/15/78 came back as a 25-track, 3:43 show with
`Around and Around` and `Drums` appearing twice, which is what Jason caught.

**The markup cannot tell this case from its opposite.** The heading-depth rule
reads a more senior undated heading as a return to the show in progress, and
that is _correct_ for Dave's Picks 50, where a `:''May 4 bonus''` subheading sits
inside a disc and the following `'''Disc 3'''` leaves it behind. Volume 37 has
the identical shape and the opposite meaning. Nothing in the wikitext separates
them, so the eight tracks are dropped by position in `SHOW_OVERRIDES` rather
than by a parser rule that would break the other case.

Contrast _Dave's Picks Volume 57_, which is immune because it dates every block:
its disc two is headed "February 1, 1978 - second set, continued" and its disc
three "Bonus tracks – January 31, 1978". A release that keeps saying which night
it is on cannot be misread. 4/15/78 is 17 songs.

### Five songs the tape has and the show didn't — 1977-11-04

`--gaps` reports 11/4/77 as 25 played against 20 released, which is the usual
signature of a release trimming an encore. It isn't one. Per DeadBase and
JerryBase, checked by Jason 2026-08-18, **none of the five was played that
night**: `Sleigh Ride > Stay > Rip It Up`, `Blue Suede Shoes`, `Peggy-O`,
`Cumberland Blues`, `Thirty Days`. _Dave's Picks Volume 12_ is right to call it
the complete concert, and the corpus keeps its 20 songs.

Worth having on record because the gap looks so much like a real one, and
because three of those titles are not in the canon — restoring them would have
minted new songs for a performance that never happened. archive.org is
crowd-sourced and a tape can carry a soundcheck, another act's set, or simply
somebody else's night under this date. **The gap report is a question, not a
finding**; the setlist databases answer it.
