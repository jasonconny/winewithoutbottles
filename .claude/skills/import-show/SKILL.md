---
name: import-show
description: Add or retime a Wine Without Bottles show from an official release — the importer, the song-title canon, the release index, staged partials, bonus tracks and release tags. Use when adding or retiming a show, indexing a newly announced release, running `npm run releases`, staging a partial show, deciding whether a date can be built at all, or editing data/songs.json, data/releases.json, data/partial-shows/, data/unknown-setlists/, data/BONUS-TRACKS.md or data/UNBUILT-DATES.md.
---

Adding a show means sourcing its setlist and timings from the official release
that carries it, rather than transcribing by hand. Four data files and one tool
are involved, and `tests/data-validity.test.ts` enforces every rule below — so
when something here is violated the tests say so, usually naming the fix.

## The usual loop

```
tsx generator/import.ts <id>                      # preview: draft, or diff vs the authored show
tsx generator/import.ts <id> --write              # apply → data/shows/<year>/<id>.json
# fill in venue/city/state/country/tags by hand — the importer leaves them blank
npm run generate <id>                             # SVG + detail JSON + rebuild the index
npx vitest run                                    # the guards
npx prettier --write 'data/shows/**/*.json'
```

Then **pause for Jason to spot-check the authored JSON before generating** on a
batch. Unknown song titles stop the run: they are named on stdout and must be
added to the canon deliberately (below), never auto-added.

**Writing a show file by hand? Match its existing layout.** The corpus is
authored two ways — most files put each song across four lines, 25 keep
`{ "title": …, "duration": … }` on one — and **Prettier will not reconcile them**,
because it preserves whether the source had a newline after `{`. Rewriting a file
in the other style turns a one-line timing fix into a whole-file diff. This has
bitten twice, once for 1333 spurious insertions and once for a 50-show batch that
came out ~4000 changed lines instead of 443 and had to be redone.
`serialiseShow(show, compact)` in `generator/import.ts` handles it via
`isCompact(raw)` (`/\{ "title":/`); for a one-off edit prefer line-level string
replacement over parse-and-restringify, and remember that a naive
`json.dump(…, indent=2)` silently produces the expanded style.

## A single new release, as it appears

Bulk importing is done — every officially-released show that can be built exists.
Additions from here are **one release at a time**, as Rhino announces them, and
that shape has its own failure modes. In order:

1. `npm run releases` first. It verifies the index against Wikipedia and exits
   non-zero on drift; a new release shows up as drift.
2. `tsx generator/releases.ts --draft --only "<name>"` to add just that entry,
   then `npx prettier --write data/releases.json`.
3. **Check `| released =` in the article before anything else.** Wikipedia
   catalogues a release when it is _announced_, so the index cheerfully carries
   records that do not exist yet — eligible, `completeness: complete`, a full date
   list, and **no durations anywhere**. The importer then refuses the whole thing,
   which reads exactly like a parser bug. If it is unreleased, record a note-only
   `HAND_RESOLVED` entry (every field but `note` is optional) and stop.
4. **Check the article exists at all.** Eight discography entries have no
   Wikipedia page, so nothing can ever be parsed from them; they live in
   `HAND_CLASSIFIED` (below) as `eligible: false`.
5. Then the usual loop. Expect the date to be one the corpus already holds — most
   new releases are single-show reissues of a night already sourced from a box,
   and `chooseSource` will keep preferring the box.

`data/UNBUILT-DATES.md` lists every date the corpus still lacks and why, and a
test keeps it in sync; check there before concluding a new release adds anything.

After any change to the importer's parsing, re-run `--audit`: it sweeps every
corpus show that resolves to a source, and an already-applied show must come
back **+0:00 with no track-count change**. That sweep is what catches a parser
change that quietly re-buckets somebody else's show.

## When something looks wrong

**Suspect the parser before the source.** Across four import batches in 2026,
_every_ anomaly that looked like a defective release turned out to be a bug in
`generator/import.ts` — `<li value="7">` with a quoted attribute, a set label
before the title, an unquoted title, an unterminated quote, `{{ordered list}}`
rows, `{{'"}}` punctuation templates, a disambiguator splitting a title in half,
flush-left set headings, undated headings resurrecting a finished show. A
"missing" song is far likelier to be one line the parser skipped than a box
billed as complete concerts genuinely omitting it, and framing it as a source
problem sends the investigation the wrong way. Fetch the raw wikitext for that
show's section and read the track lines _before_ theorising.

**A track-count match is not a correctness check.** 19750813 imported with the
right number of tracks and the right total duration, and two stripes were the
wrong colour — the combined-row rule had taken `"Eyes of the World" / "Drums"` as
`Drums`. Only reading the titles against the article caught it. The `+0:00`
invariant proves arithmetic, not identity.

**But the sources are genuinely noisy too**, and the tell is that a source-side
explanation survives a careful look at the raw input. Wikipedia is hand-entered
per article, so conventions differ volume to volume and the prose can simply be
wrong. archive.org is crowd-sourced, so every uploader brings their own naming —
abbreviations, footnote markers, filename-style titles, duplicated derivatives,
and sometimes **another artist's set on the same tape** (the NRPS set on
19700502 inflated that show's "played" count by 13 songs, four of which are
canonical Dead titles and so matched silently).

**And a gap report is a question, not a finding.** 11/4/77's tape carries five
songs DeadBase and JerryBase both say were never played; three aren't in the
canon, so "restoring" them would have minted songs for a performance that never
happened.

## Where the tooling stops

**Jason is the authority on the catalogue** — what a release contains, what
counts as a song, how a medley splits, whether a guest set belongs to the show.
Surface the evidence and ask; do not encode a guess and move on. He offers
testable hypotheses and wants the real answer rather than agreement, so
disagreeing with evidence is useful and quietly accommodating him is not.

This is not deference for its own sake: several of these calls are unresolvable
from the data alone. Two tapes can disagree about a setlist; a release can split
a track where the music did not; a canon addition changes a stripe's colour
permanently. **Batch cadence exists for this** — author the data, then pause for
his spot-check _before_ `npm run generate`, and pause again for the commit. That
pause has caught a real error in every batch it has been used on.

Don't over-build against source noise either. The registry (`aliases`,
`notASong`) absorbs naming variance cheaply; trying to auto-detect something like
a support act's set is where the tooling should stop and his knowledge starts.

## Song-title canon (`data/songs.json`)

The closed vocabulary every setlist draws from — every canonical title, each
optionally carrying `aliases` (external spellings that map onto it) and
`sharesPrefixWith`. It exists because of how `titleToRgb` works: `cleanTitle`
uppercases and strips non-letters, so **case and punctuation are free but word
content is not** — `Lazy River` and `Lazy River Road` are different colours,
i.e. different songs on the wall, and every entry in `data/CORRECTIONS.md` is an
instance of that.

Shows are imported from external sources (official release track listings via
Wikipedia/MusicBrainz, archive.org soundboards), each with its own title
conventions, so an unguarded import silently mints near-miss variants that are
invisible until two shows sit side by side. Four guards enforce it: every title
used in show data is canonical (aliases never appear there); no two canonical
titles clean to the same string, or to the same letters ignoring word boundaries
(`Turn On Your Lovelight` vs `Turn On Your Love Light` — same song, different
colours); and a title that is a word-prefix of another must declare
`sharesPrefixWith`, because real pairs exist (`Hey Jude` / `Hey Jude Reprise`;
Womack's `It's All Over Now` / Dylan's `It's All Over Now, Baby Blue`) but a
dropped word looks identical.

**Adding a song means adding it to the registry deliberately** — that friction
is the point. But **expect the canon to keep growing, and don't read that as a
smell**: beyond the core repertoire the band played over and over there is a
long tail of one-offs and songs played a handful of times — a guest set, a cover
never repeated, a Pigpen-era blues that left the rotation early. A batch
reaching into a year the corpus doesn't cover yet will legitimately want a
fistful of new titles. The friction exists to make each addition _considered_,
not to make additions rare.

A fifth guard rejects two canonical titles that are letter-for-letter
rearrangements: `Mississippi Half-Step Uptown Toodeloo` and the misspelled
`…Toodleoo` sat in the corpus for years rendering the _identical_ colour
`131,120,128`, because a channel is the **mean** of its slice and averaging
ignores order — the one variant class no amount of looking at the wall can
reveal.

Two sibling lists sit beside `songs`: **`foldIntoPrevious`** for track names
that continue the preceding track rather than being songs (Terrapin Station
(Ltd) spells the drums segment `Drums` / `And` / `Space`, so `And`'s 3:43
belongs to Drums — 6:16 + 3:43 = the 9:59 the corpus already had), and
**`notASong`** for tracks that get no stripe — both things that aren't music
(tuning, banter, crowd noise) and music that isn't a canonical performance (the
Dead teased `Funiculì, Funiculà` for 28 seconds; neither DeadBase nor JerryBase
counts it). Both lists are applied by the importer to **every** source, not just
Wikipedia: they're facts about the repertoire, and skipping them on the
MusicBrainz path let an already-excluded tease back into a show.

## Official-release index (`data/releases.json`)

Which official release contains which show, built by `npm run releases`
(`generator/releases.ts`) from the MediaWiki API. It's what lets a show be
sourced from a release's track listing instead of a soundboard transfer.

**Authored data, like `data/shows/`** — `--draft` bootstraps the file,
hand-corrections are the source of truth, and the default (no-flag) run
_verifies_ against Wikipedia and exits non-zero on drift rather than
overwriting. Durable corrections belong in `HAND_RESOLVED` / `HAND_SHORTENED`
**in the tool, not hand-edited into the JSON**, so a re-draft reproduces the
reading instead of reverting.

That rule is now **enforced rather than advised**, because it had already been
broken 27 times and nothing said so. A note ending `; confirmed <completeness> by
hand` marks a settled reading — appended automatically to anything in
`HAND_RESOLVED` — and `--draft` **refuses to write** if it can't reproduce one,
naming every field it would change (`--force` overrides deliberately). The
verify pass reports the same set as maintenance debt without failing on it, and
`--draft --only` merges into the index instead of replacing it with the subset it
just built.

The invariant: **a draft over an up-to-date index is a no-op.** If it isn't,
something in the JSON is a judgement the tool can't rederive.

`HAND_RESOLVED` entries pin **only the fields a human settled** — every field but
`note` is optional. Pin `dates` and the parser's date resolution is bypassed
(an empty array is a reading: the release sources no show whole); leave `dates`
off and the parser keeps deriving them, staying under drift detection, while
`bonusDates` / `completeness` / `note` are overlaid. Don't pin dates the parser
already gets right — that freezes them and turns "verify against Wikipedia" into
"verify against ourselves".

> `--draft` writes raw `JSON.stringify`, but the committed file is
> Prettier-formatted. Run `npx prettier --write data/releases.json` after, or a
> one-release change shows up as a ~1000-line diff.

**`HAND_CLASSIFIED` in `generator/hand-readings.ts` is the third hand map**, beside
`HAND_RESOLVED` and `HAND_SHORTENED`. A title listed in the discography's date
section but linked from no classification table gives `verdict()` nothing to judge
it by, so it lands as `unlinked in the discography — classify by hand` — honest
once, an unresolved TODO forever after. The eight that existed were read in
August 2026 and all proved ineligible for the same reason: **no Wikipedia article,
so no track listing to source from**. Seven were also redundant reissues, and each
note names the box that already covers the date. Anything landing in that branch
now is new and wants reading; put the verdict in the map rather than leaving it to
reappear.

Eligibility comes from Wikipedia's own sectioning (contemporary live albums,
compilations, unauthorized releases and album box sets can't source a show) plus
a `NOT_CONCERTS` list for the highlights collections that sit in otherwise-
eligible sections; note `30 Trips Around the Sun` (30 complete shows, eligible)
vs `30 Trips Around the Sun: The Definitive Live Story` (4-CD sampler,
excluded).

**Three parsing traps, all load-bearing**: (1) take the wikilink _target_, not
the display text — a number of entries are piped, and `May 1977` as displayed is
`May 1977 (album)` as an article, so the display text lands on Wikipedia's page
about the month; (2) the discography's date text gives _principal_ recording
dates, explicitly excluding bonus material, so when it names specific days those
are the whole shows and anything else the article mentions is bonus (this is
what keeps Dave's Picks 28 from resolving to its 6/23 and 6/28 bonus tracks
instead of its 6/17 show); (3) a date _range_ is not a show list —
`June 10 – 19, 1976` spans ten days but the box holds five concerts — so ranges
resolve from the article's per-show headings, with the range used only to fence
out stray dates from prose about other releases.

**The index holds every distinct release, not just the usable ones** — an entry
carries `eligible: false` and a `note` saying why (`contemporary release`,
`compilation / highlights collection`, `unauthorized release`, `unlinked in the
discography — classify by hand`) so the file records what was rejected and on
what grounds, instead of that reasoning living only in the builder's constants.
Ineligible entries stay inert: no dates, no tag, enforced by test.

Eligible releases are resolved to their show dates. A handful were unreadable by any
structural rule because their shows are stated only in article prose, which the
parser deliberately doesn't mine (free-text date scanning drags in neighbouring
releases and chart trivia); those live in `HAND_RESOLVED` with the article's own
wording quoted in the note.

`completeness: 'partial'` earns its keep there: a set with _selections_ from
several nights (`Dozin' at the Knick`, `Go to Nassau`, `Ladies and Gentlemen…`)
can gap-fill a show but never source one whole, and takes no tag.

**A release can be mixed, and the parser will not notice.** _Enjoying the Ride_
says "17 complete concerts / 3 recordings each compiled from two or three
concerts / 1 bonus cassette of a partial concert", and the parser read that as a
blanket "complete concerts" claim, marking all 24 dates complete. Seven were
selections — their track lines read `– selections:` where the others read
`– first set:` / `– second set:` / `– encore:` — and taking them whole produced
4- and 3-track "concerts". When a release's own prose enumerates its contents,
read the enumeration.

Section lookups are **case-insensitive** — the discography's own sections
disagree (`One From the Vault` in the date list vs `One from the Vault` in the
traditional-releases table), and a case-sensitive miss files a real release as
uncatalogued.

jerrybase is deliberately never fetched — its robots.txt disallows automated
agents (`ClaudeBot`, `GPTBot`, `CCBot`), so it stays a manual reference.

## The importer (`generator/import.ts`)

Drafts a show's setlist and timings from the release that carries it.
`tsx generator/import.ts <id>` diffs against the authored show (so it doubles as
the retime preview), `--write` applies, `--audit` sweeps every corpus show with
a source, `--gaps` names what a release omits, `--partial` stages an
unsourceable show (below), and `--release "<name>"` overrides the choice and
**is repeatable** for shows issued complete only across several releases. It
never writes without `--write`.

**All three fetch through `generator/http.ts`.** `fetchRetry` is the only place
the generator touches the network, and it retries **two** failure modes, not one:
a retryable status (429/5xx by default; MusicBrainz's 503 means "slow down") and
a rejected `fetch`. The second is the one that matters — a dropped socket
surfaces as `TypeError: fetch failed` wrapping `ECONNRESET` or
`SocketError: other side closed`, never as a status code, so status-only handling
misses it entirely. It cost a whole `--audit` run in August 2026: the sweep read
all 319 shows, printed every row, then died summarising one MusicBrainz lookup
while MusicBrainz answered curl fine either side of it. `--audit` now also
isolates each show, so a lookup that still fails after its retries costs one row
(reported as `!! lookup failed`, and the run exits non-zero) rather than the
sweep. `tests/http.test.ts` fakes the network to pin all of this.

**Three sources, each for what it alone can do.** _Wikipedia_ is preferred: its
track listings carry `m:ss` durations (the exact form the corpus stores —
MusicBrainz's millisecond precision would be discarded) plus the per-show
sectioning that says which night a track belongs to. _MusicBrainz_ is the
fallback for the two cases Wikipedia can't cover — articles that list a show
untimed, and articles organised by disc (`===Disc 1===`…`===Disc 9===`) so
nothing buckets to a date at all; it titles each medium with the night it holds
(`Madison Square Garden, 3/9/1981, Set One`), so it does the attribution itself.
_archive.org_ answers what an official release never can: **what was actually
played**, which is the only way to turn "this show is short" into "these eight
songs are missing".

Wikitext parsing has to survive more variety than it looks: punctuation
templates (`{{'"}}`, `{{-"}}`, `{{' "}}` — the source for `"Truckin'"`),
`{{ordered list}}` rows instead of `#` lists, combined tracks
(`"Lady with a Fan" / "Terrapin Station"` — take the last title, since there's
one duration and splitting would invent a boundary), segue markers in three
flavours (`>`, `→`, and archive.org's ASCII `->`), and outright broken markup —
`#"The Other One: > (Weir…` never closes its quote, so the unquoted fallback
kept the colon and minted `The Other One:` as a song (now stripped in
`cleanWikiTitle`).

**Three bucketing rules are load-bearing and were all learned by getting them
wrong.** An _undated_ heading (`Disc 3`, `Second set, continued:`) belongs to
the show in progress, or a mid-listing bonus block swallows every track after it
— Dave's Picks 50 filed its whole third disc under a May 4 bonus heading. But an
undated _bonus_ heading (`Bonus tracks:`) must orphan instead, or Download
Series 4 hands nine extra tracks to the show. And a heading naming a date the
index **doesn't claim** must end the show in progress outright — clearing
`main`, not just `current` — or the next undated `'''Disc N'''` resurrects it:
19710224 grew from 22 tracks to 49, absorbing two other venues across eighteen
months.

A `partial` source **merges** rather than replaces: its tracks claim the first
_unclaimed_ matching title in the authored setlist and only those durations
change, everything else standing as authored. Claiming is one-to-one so repeats
pair correctly, but deliberately **not** order-dependent — some partials
resequence rather than excerpt, and Road Trips 2:1 does, where a forward-only
cursor matched one track of eight and failed the rest.

The importer **refuses a show with any untimed track**: stripe widths _are_ the
durations, so a guess would be silently wrong. That is correct behaviour, not a
bug. Such a show is authored by hand with the missing timing supplied from the
release itself (see 1978-05-13 in `data/CORRECTIONS.md`).

## Staged partials (`data/partial-shows/`)

Shows no release can source whole, held out of `data/shows/` until they're
finished. `tsx generator/import.ts <id> --partial --release "<name>"` writes
one. The skeleton is the **archive.org soundboard's** track list — every song
actually played, in performance order, since a release's own listing can say
what it has but never what it lacks — with the release's timings merged onto it
and everything else left `"duration": ""`. **The blanks are the work list**;
Jason fills them from whichever source he judges right, then promotion is a
plain `mv` into `data/shows/<year>/`.

A separate directory rather than a `draft: true` flag, because a flag can reach
the site by accident and a sibling directory cannot: `generate.ts` reads
`data/shows` recursively and never sees it.

Two things the tool must get right, both learned by getting them wrong: a staged
date is deliberately **absent from its release's `dates`** (that absence is what
records it as unsourceable), so `--partial` injects the one date being staged
before bucketing or the parse orphans everything; and `canonicalise` keeps
unknown titles in `mapped` for the diff view, so the skeleton has to **filter
them out** or the file carries songs the registry never agreed to.

Taper titles need that filter far more than release listings do — abbreviations
(`GDTRFB`, `Big RxR Blues`), variant spellings (`Playin' In The Band`),
non-songs (`Set II crowd`) and footnote markers (`Turn On Your Lovelight *`,
keyed to a note naming a guest — stripped in `archive.ts`, since left on it
hides a song the registry already knows). Unmapped titles are named on stdout
and left out, so adding them to the canon stays deliberate; add or alias, then
re-run for a complete skeleton.

**Some releases attribute tracks somewhere other than the listing, and the
importer cannot follow.** Three shapes seen so far: a per-track **extra column**
(`|extra_column = Recording date`, as _Ladies and Gentlemen…_ uses — this one the
importer _does_ read), and a separate **`==Recording dates==` section** naming disc
and track numbers, which it does not. That section appears with the date last
(_Rocking the Cradle_: `*Disc 1 tracks 1 & 6 …: September 15, 1978`) and with the
date first (_Go to Nassau_: `*May 15, 1980: Disc 1 tracks 1-2 & 5-8, …`), so a
parser for it would have to read both orders. Until one exists those shows are
authored by hand and `--audit` reports them as `unparsed` — which is why the
expected audit line carries a non-zero unparsed count rather than zero.

**A date range is not a show list, and neither is a `recorded` field.** _Ladies
and Gentlemen…_ carried five dates for months because its infobox reads
`recorded = April 25, 1971 - April 29, 1971`; the per-track column names only four
nights, and the 26th appears nowhere on the release.

**Which tape is chosen is itself load-bearing, and took two tries.**
archive.org's search sets no sort, so the old "first soundboard, Charlie
Miller's if he did one" pick was _not reproducible_ — two runs minutes apart
chose different tapes and the same show staged with 11 songs then 8, and 23 then 7. `findRecordings` now sorts the pool explicitly, and `--partial` opens up to
`MAX_CANDIDATES` (6) of them and keeps the best. "Best" is **recognised titles,
not raw track count**: the 31-track 4/27/71 reel names every track as a filename
(`gd71-04-27 t01 Intro`), so on raw count it beat four properly-titled 27-track
tapes and produced a skeleton of nothing. Scoring `tracks − unmapped` measures
what the skeleton is worth; ranking order breaks ties, so a Miller transfer
still wins an even match.

`tests/data-validity.test.ts` guards the staged files' **format only** — id
matches filename, id doesn't collide with a real show, titles canonical (aliases
rejected), durations either `""` or valid `m:ss` — because completeness is the
whole point of the directory, and the show-data guards catch that the moment a
file is promoted.

**The scorer can prefer an edited tape, and `MILLER_MIN_SHARE` will not catch
it.** Ranking is `tracks - unmapped`, so a transfer that indexes five tuning
ditties as separate tracks outscores a complete one that groups them. On
1969-11-07 that put Kaplan's _spliced_ tape above Charlie Miller's uncut one by a
single point, and the staged skeleton came out three songs short of the night. The
guard against a Miller _fragment_ losing does not also guard a complete Miller
losing to a padded rival.

**So read the candidates' notes, not just their track counts.** Taper notes
routinely say outright that a tape is edited — Kaplan's says "There are splices
before and after Mama Tried, Next Time, and Good Lovin, and songs are probably
missing in these gaps" — and often cite DeadBase for exactly what is missing and
where it went. Two tapes disagreeing about a _setlist_ usually means one is
incomplete, not that the sources conflict.

**And a description is not a track list.** The 2020 Miller/Bear transfer of
1972-07-21 lists `Promised Land` as the set-one opener in its description; the
audio starts mid-song and the first track is literally `//Sug//aree`.

## Nights the band played twice (early/late)

`generator/import.ts` still takes the **bare 8-digit date**: releases are indexed
by date, and the importer drafts the whole night's tracks in one go. Splitting
that draft into an early and a late show is a **hand step afterwards** — decide
where the first performance ends, cut the file in two, add `"sitting"` to each,
and renumber the ids with a two-digit ordinal (`1970021301`, `1970021302`). The
importer needs no flag and knows nothing about it. See the Early/late shows
bullet in CLAUDE.md for the contract the data-validity test enforces.

## Shows whose setlist can't be known (`data/unknown-setlists/`)

The other holding pen, and the difference from a staged partial is **intent, not
format**: a partial is waiting for a timing somebody can still supply, these are
waiting for nothing. The tape doesn't circulate, the sources disagree about what
was played, and no amount of listening will settle it.

They stay out of `data/shows/` because stripes are a claim about what was played
and in what order, and here that claim can't be made. Same sibling-directory
mechanism as partials — `generate.ts` never sees it — and the same `mv` if a
tape ever surfaces.

Written by hand, not by a flag: import the show, read what the sources actually
say, then move the file across and add a **`note`** (on `ShowFile`, like
`source`, so it never reaches the UI) recording what survived and why the rest
can't be recovered. The release's index entry keeps the date **out of `dates`**,
the same convention staged partials use.

The guards mirror the staged-partial ones with two differences: the `note` is
**required** — a file whose whole reason for existing is doubt has to carry the
reason — and every duration must be a real `m:ss`, since what survives is
released material with timings. A blank would mean the file is waiting for
something, which is exactly what this directory is not for.

**`data/UNBUILT-DATES.md` lists every date the corpus still lacks** — these, plus the release dates that were never staged — and, unlike the per-file notes, records how many recordings archive.org held and when somebody last looked. Check it before re-surveying; `tests/data-validity.test.ts` keeps it in sync in both directions.

The founding case is `19710824` (Auditorium Theatre, Chicago). _Dick's Picks
Volume 35_ calls it one of two complete shows; per JerryBase the tape came from
Keith Godchaux's houseboat and only the salvageable part was released, DeadBase
50 lists mostly the same songs in a different order, and archive.org catalogues
no tape for the date at all. See `data/CORRECTIONS.md`.

## Bonus tracks (`data/BONUS-TRACKS.md`)

Dates the corpus holds no show for, carried by a release only as **bonus
tracks** — 49 dates / 302 tracks. This is where a fractured, one-release-at-a-time
future actually pays out, so two rules matter more than the list:

**A large count is a night the release nearly carries, not a pile of scraps.**
The two biggest rows were 22 and 26 tracks and both were within a few songs of
complete; both are now shows.

**A date can be complete across releases while incomplete on every one of them**,
and no single row can show that, because each row names what one release holds.
19771102 sat as 7 tracks from _Dick's Picks 34_; _Dave's Picks 12_ carried ten
more behind a different show, and a soundboard supplied the last four — 21 songs,
complete, from two bonus blocks and a tape. **So re-derive a date's carriers
across the whole index, never the volume that first surfaced it.**

**A themed bonus disc hides dates the parser cannot bucket.** _The Closing of
Winterland_'s "New Year's Eves at Winterland" and _Live at the Cow Palace_'s
"Spirit of '76" each name their dates _inline on the track line_, so those dates
go unrecorded entirely — seven were found that way. A release with a themed bonus
disc is worth opening by hand even when the index shows no `bonusDates`.

Assembly is by hand: bonus blocks are often headed by **venue rather than date**
(`:''Seneca College Field House bonus tracks:''`), so their tracks orphan on
import and no `--release` will bucket them. That orphaning is correct — handing
them to the release's main date is what once made 19780415 a 25-track show.

## Release tags (`generator/release-tag.ts`)

A pure module so `tests/data-validity.test.ts` can share the rule without
triggering `releases.ts`'s top-level fetch.

A release earns a tag only when it has whole shows to gather into an index —
**series volume → the series** (`Dick's Picks`, never `Dick's Picks` _and_
`Dick's Picks 29`; many volumes hold 2+ complete shows and are still tagged by
series alone), **2+ complete concerts → a shortened release name**, **anything
else → nothing**. That last case covers single-show one-offs and multi-show
compilations holding no full concert, whose tag would index an empty page.

Shortening keeps what precedes the colon (`In and Out of the Garden`, `Listen to
the River`) unless that prefix is itself another release — `May 1977: Get Shown
the Light` must keep its subtitle or it collides with the `May 1977` box — and
parentheticals always survive, since they're what separates `Spring 1990` from
`Spring 1990 (The Other One)`.

**A show takes the tag of its chosen source only, never of every release
containing it.** Most multi-show boxes also spawn a standalone breakout of one
night, so a show is routinely on two or three releases — 19770508 is on `Get
Shown the Light` and `Cornell 5/8/77`; 19770425 is on the 4/25/77 standalone and
`30 Trips`. Europe '72 is the extreme: prior partial releases, later breakouts,
and the `Lyceum '72` box on top of the complete box. Tagging from all of them
would give one show a pile of tags describing its release history rather than
grouping it usefully, so precedence picks one source and that source's tag is
the one that sticks.

**But a stitched `source` grants every one of its tags.** That rule is about
releases a show merely _appears_ on; when `source` names several releases, each
one **supplied timings** — it is part of how the art was made, not a coincidence
of the catalogue. So a show built across series carries a tag from each. The
case that prompted it, Jason 2026-08-14: **19710806** is stitched from _Dick's
Picks 35_ and _Road Trips 1:3_, and carried only `Dick's Picks`, so it was
missing from the `Road Trips` index it belongs in.

`source` is what keeps this narrow — it names only what was used, so merely
appearing on a release still grants nothing. Only 5 shows in the corpus are
stitched from two releases, and only this one spans two series; the other four
pair _Dick's Picks 4_ with `Bear's Choice`, which grants no tag at all.

Enforced one-directionally by `tests/data-validity.test.ts` — source-granted
tags must be **present**, never that nothing else is, since editorial tags like
`Dark Star` are granted by no release. It carries the one carve-out below: a
release covering exactly a tour's date set grants nothing, derived from the
corpus rather than hard-coded, so it keeps up if a tour or a release changes
shape.

The test re-derives every tag from the file's own `completeness`/`dates` and
pins **presence, not spelling**: `tag` is drafted from fields a human then
edits, so resolving a release to complete shows must also give it a tag, while a
name like the comma-separated RFK Stadium set still needs a hand-picked short
form no rule produces (`RFK 1989`, declared in `HAND_SHORTENED` rather than
hand-edited into the JSON, so re-drafting reproduces it).

Tags are also skipped when a release covers **exactly** a tour's date set —
`Europe '72` covers all 22 shows of the `Europe 1972` tour, so its index would
duplicate the tour gallery. See the show-metadata taxonomy in CLAUDE.md for how
tags relate to facets.

## `source` on `ShowFile`

Where a show's timings came from — a release name exactly as `data/releases.json`
spells it, several **pipe-separated** when a show was stitched from more than one
(pipe, not comma: release names routinely contain commas, and `In and Out of the Garden:
Madison Square Garden '81, '82, '83` would split into three releases that don't
exist), or `archive.org:<identifier>` for an unreleased show.

Deliberately on `ShowFile` and **not** `ShowMeta`, so it never reaches
`ShowSummary`, the bundled index, or the UI — `toSummary` in
`generator/generate.ts` builds its fields explicitly, which is what keeps it
out. It exists to answer "should this be re-timed?" and to make a source swap
auditable. A data-validity test rejects a `source` naming anything the index
doesn't contain.

## Logging departures

`data/CORRECTIONS.md` is the log of deliberate departures, each confirmed by
Jason. The **Import departures** section covers where authored data differs from
the release's own track listing — a release names tracks for a CD index, not for
a setlist, so its splits and spellings are not always the performance. Record
umbrella-name folds (`That's It for the Other One`, `King Solomon's Marbles`),
split tracks, dropped non-songs, source typos aliased in the canon, and venue
names where sources disagree.
