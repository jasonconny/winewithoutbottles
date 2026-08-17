/**
 * Where a show was played, read out of a release article's infobox.
 *
 * Kept pure and separate so `tests/venue.test.ts` can exercise it without
 * triggering `releases.ts`'s top-level fetch — the same reason `release-tag.ts`
 * and `hand-readings.ts` exist.
 *
 * The importer used to write `venue: ''` and leave it to a human, which is fine
 * for a show or two and is the bulk of the work for a batch of sixty. It is
 * also where the errors live: 19771007 was authored as San Antonio because the
 * release's lede listed four states and Texas was a reasonable guess. The tape
 * said Albuquerque. Reading the venue off the article instead of inferring it
 * is the fix.
 *
 * **This is a default, not an answer.** `tests/data-validity.test.ts` only
 * asserts that `venue` is non-empty, so a *wrong* venue passes every guard —
 * which is exactly why the importer prints what it filled and from where, and
 * why the batch still gets spot-checked.
 */

/** What an infobox can tell us. Everything but `venue` is often absent. */
export interface VenueGuess {
  venue: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * US state names to the two-letter codes the corpus stores. Only the states the
 * Dead actually played are strictly needed, but the whole set costs nothing and
 * removes a class of "why is this one blank?".
 */
const US_STATES: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

const US_CODES = new Set(Object.values(US_STATES));

/** Country names the corpus abbreviates, keyed by what an article might say. */
const COUNTRIES: Record<string, string> = {
  usa: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  england: 'ENG',
  'united kingdom': 'ENG',
  uk: 'ENG',
  canada: 'CAN',
  france: 'FRA',
  germany: 'DEU',
  denmark: 'DNK',
  netherlands: 'HOL',
  holland: 'HOL',
  sweden: 'SWE',
  luxembourg: 'LUX',
};

/**
 * Turn one infobox field into plain segments.
 *
 * The separators are not consistent across the catalogue — `<br>`, `<br />`,
 * `{{break}}` and bare commas all appear, sometimes two of them in one field —
 * so they are all normalised to a single delimiter before splitting.
 *
 * Wikilinks resolve to their **display** text, not their target, and that is
 * load-bearing rather than incidental: `[[Winterland Ballroom|Winterland]]`
 * displays the name the corpus already uses, and `[[Palladium (New York
 * City)|Academy of Music]]` displays what the room was called in 1972, which is
 * the name that belongs on a 1972 show.
 */
function segments(field: string): string[] {
  const flat = field
    // `{{small|(…)}}` wraps a city in some articles; keep the inside.
    .replace(/\{\{\s*small\s*\|/gi, '')
    .replace(/\{\{\s*break\s*\}\}/gi, ',')
    .replace(/<br\s*\/?>/gi, ',')
    // Piped link → display text; plain link → its own text.
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/[{}]/g, '')
    .replace(/''+/g, '');
  return flat
    .split(',')
    .map((piece) => piece.replace(/^[\s(]+|[\s).]+$/g, '').trim())
    .filter(Boolean);
}

/**
 * Read `| venue = …` out of an article's infobox.
 *
 * Returns `null` rather than guessing when the field is absent or empty, which
 * is the case for twelve of the fifty-nine Dave's Picks articles — an empty
 * venue is a fact about the article, and inventing one is the failure this
 * module exists to prevent.
 */
export function venueFromInfobox(wikitext: string): VenueGuess | null {
  // Only the infobox, so a `venue=` inside later prose or a template can't win.
  const head = wikitext.slice(0, 2000);
  const match = head.match(/\n\s*\|\s*venue\s*=([^\n]*)/i);
  if (!match) return null;
  const parts = segments(match[1]);
  if (!parts.length) return null;

  const [venue, ...rest] = parts;
  const guess: VenueGuess = { venue };
  for (const piece of rest) {
    const lower = piece.toLowerCase();
    if (COUNTRIES[lower]) {
      guess.country = COUNTRIES[lower];
    } else if (US_STATES[lower]) {
      guess.state = US_STATES[lower];
      guess.country ??= 'USA';
    } else if (US_CODES.has(piece.toUpperCase()) && piece.length === 2) {
      guess.state = piece.toUpperCase();
      guess.country ??= 'USA';
    } else if (!guess.city) {
      // "Honolulu, Hawaii" arrives as one link and splits to two pieces; the
      // first non-state, non-country piece is the city.
      guess.city = piece;
      continue;
    } else {
      // A second name after a city we already have is a second *address*, not
      // more detail about the first — an infobox lists the bonus date's room
      // too. Volume 26 reads "Albuquerque Civic Auditorium … (Albuquerque, New
      // Mexico) … Hill Auditorium … (Ann Arbor, Michigan)", and walking on past
      // the first address filed an Albuquerque show in Michigan.
      break;
    }
    // The first state or country completes the address; anything after it
    // belongs to a different one.
    if (guess.state || guess.country) break;
  }
  return guess;
}

/**
 * Reconcile a guess against venues the corpus already holds.
 *
 * Two jobs, and the first matters more than it looks. Venue galleries are keyed
 * on the venue string, so a spelling that differs from the corpus silently
 * splits one gallery in two — the same class of error as a near-miss song
 * title, and just as invisible.
 *
 * **It only catches case and punctuation**, because the comparison ignores
 * exactly those and nothing else. `winterland` and `Winterland.` collapse onto
 * the corpus entry; `Winterland Ballroom` does not, and is passed through as a
 * new venue. That is deliberate — a matcher loose enough to fold an extra word
 * would also fold `Capitol Theatre` into `Capitol Theatre Passaic` — but it
 * means a differently-worded name still reaches the data, and only the printed
 * output and the spot-check will catch it.
 *
 * The second job is that a known venue carries its own city and state, which is
 * how a field reading only `[[Winterland Ballroom|Winterland]], [[San
 * Francisco]]` still yields `CA`.
 */
export function reconcileVenue(
  guess: VenueGuess,
  known: readonly VenueGuess[],
): VenueGuess {
  const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matches = known.filter(
    (entry) => key(entry.venue) === key(guess.venue),
  );
  if (!matches.length) return guess;
  // Prefer the entry whose city agrees, so an ambiguous name (Capitol Theatre
  // in Passaic and in Port Chester) resolves to the right one rather than
  // whichever the corpus happens to list first.
  const best =
    matches.find(
      (entry) =>
        guess.city && entry.city && key(entry.city) === key(guess.city),
    ) ?? (matches.length === 1 ? matches[0] : null);
  if (!best) return guess;
  return {
    venue: best.venue,
    city: guess.city ?? best.city,
    state: guess.state ?? best.state,
    country: guess.country ?? best.country,
  };
}
