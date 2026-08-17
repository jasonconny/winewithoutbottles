import { describe, expect, it } from 'vitest';
import { reconcileVenue, venueFromInfobox } from '../generator/venue';

/**
 * Every fixture here is a real `| venue =` field, copied from the Dave's Picks
 * article it came from. That matters more than usual: this parser's output is
 * written straight into show data, and `tests/data-validity.test.ts` only
 * checks that `venue` is non-empty — a wrong venue passes every other guard in
 * the project. These cases are the guard.
 */
const box = (field: string) =>
  `{{Infobox album\n| name = x\n| venue =${field}\n| label = y\n}}`;

describe('venueFromInfobox', () => {
  it('returns null when the field is missing', () => {
    expect(venueFromInfobox('{{Infobox album\n| name = x\n}}')).toBeNull();
  });

  it('returns null when the field is empty — twelve of the 59 articles', () => {
    expect(venueFromInfobox(box(''))).toBeNull();
    expect(venueFromInfobox(box('   '))).toBeNull();
  });

  it('takes a bare venue with no city', () => {
    // Volume 23.
    expect(venueFromInfobox(box(' [[McArthur Court]]'))).toEqual({
      venue: 'McArthur Court',
    });
  });

  it('takes plain text with no link at all', () => {
    // Volume 51.
    expect(venueFromInfobox(box(' Scranton Catholic Youth Center'))).toEqual({
      venue: 'Scranton Catholic Youth Center',
    });
  });

  it('splits a {{break}} into venue and city, and resolves the state', () => {
    // Volume 44.
    expect(
      venueFromInfobox(box(' [[Autzen Stadium]]{{break}}[[Eugene, Oregon]]')),
    ).toEqual({
      venue: 'Autzen Stadium',
      city: 'Eugene',
      state: 'OR',
      country: 'USA',
    });
  });

  it('handles <br> and <br /> the same way', () => {
    // Volumes 21 and 24.
    expect(
      venueFromInfobox(
        box(' [[Boston Garden]]<br>[[Boston|Boston, Massachusetts]]'),
      ),
    ).toEqual({
      venue: 'Boston Garden',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
    });
    expect(
      venueFromInfobox(
        box(' [[Berkeley Community Theatre]]<br />[[Berkeley, California]]'),
      ),
    ).toEqual({
      venue: 'Berkeley Community Theatre',
      city: 'Berkeley',
      state: 'CA',
      country: 'USA',
    });
  });

  it('reads a fully-specified field carried inside one piped link', () => {
    // Volume 17 — the whole address is the link's display text.
    expect(
      venueFromInfobox(
        box(' [[Selland Arena|Selland Arena, Fresno, California, USA]]'),
      ),
    ).toEqual({
      venue: 'Selland Arena',
      city: 'Fresno',
      state: 'CA',
      country: 'USA',
    });
  });

  it('prefers a piped link’s display text over its target', () => {
    // Volume 14: the room was the Academy of Music in 1972 and became the
    // Palladium later. The show is from 1972.
    expect(
      venueFromInfobox(
        box(' [[Palladium (New York City)|Academy of Music]]<br>New York City'),
      ),
    ).toEqual({ venue: 'Academy of Music', city: 'New York City' });
  });

  it('accepts a state already abbreviated', () => {
    // Volume 46.
    expect(
      venueFromInfobox(
        box(
          ' [[Hollywood Palladium]]{{break}}[[Los Angeles]], [[California|CA]]',
        ),
      ),
    ).toEqual({
      venue: 'Hollywood Palladium',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
    });
  });

  it('unwraps {{small|(...)}} around a city', () => {
    // Volume 26.
    expect(
      venueFromInfobox(
        box(
          ' [[Albuquerque Civic Auditorium]]{{break}}{{small|([[Albuquerque, New Mexico]])}}',
        ),
      ),
    ).toEqual({
      venue: 'Albuquerque Civic Auditorium',
      city: 'Albuquerque',
      state: 'NM',
      country: 'USA',
    });
  });

  it('stops at the first address when the field names two venues', () => {
    // Volume 26, verbatim. The second room belongs to the release's *bonus*
    // date, so the single-date safety rule does not catch it — and walking past
    // the first address filed an Albuquerque show in Michigan.
    expect(
      venueFromInfobox(
        box(
          ' [[Albuquerque Civic Auditorium]]{{break}}{{small|([[Albuquerque, New Mexico]])}}{{break}}[[Hill Auditorium]]{{break}}{{small|([[Ann Arbor, Michigan]])}}',
        ),
      ),
    ).toEqual({
      venue: 'Albuquerque Civic Auditorium',
      city: 'Albuquerque',
      state: 'NM',
      country: 'USA',
    });
  });

  it('cannot tell a second venue from a city when neither has a state', () => {
    // Volume 43's shape: two rooms, no city or state on either, and nothing in
    // the text marks which is which — so `McFarlin Auditorium` lands in the
    // city slot. Recorded because it is the limit of what this parser can do,
    // not because it is right. Volume 43 covers two dates, so the single-date
    // rule keeps this out of the data; a one-date release written this way
    // would need the spot-check to catch it.
    expect(
      venueFromInfobox(box(' Family Dog{{break}}[[McFarlin Auditorium]]')),
    ).toEqual({ venue: 'Family Dog', city: 'McFarlin Auditorium' });
  });

  it('does not assume the United States', () => {
    // Volume 56 is the Rainbow Theatre, London — the batch is not all American.
    expect(venueFromInfobox(box(' [[Rainbow Theatre]]'))).toEqual({
      venue: 'Rainbow Theatre',
    });
    expect(
      venueFromInfobox(box(' [[Apollo Theatre]], London, England')),
    ).toEqual({ venue: 'Apollo Theatre', city: 'London', country: 'ENG' });
  });

  it('reads only the infobox, not a later mention', () => {
    const article = `${box(' [[Boston Garden]]')}\n\n==Notes==\n| venue = Wrong Place\n`;
    expect(venueFromInfobox(article)?.venue).toBe('Boston Garden');
  });
});

describe('reconcileVenue', () => {
  const known = [
    { venue: 'Winterland', city: 'San Francisco', state: 'CA', country: 'USA' },
    { venue: 'Capitol Theatre', city: 'Passaic', state: 'NJ', country: 'USA' },
    {
      venue: 'Capitol Theatre',
      city: 'Port Chester',
      state: 'NY',
      country: 'USA',
    },
  ];

  it('adopts the corpus spelling for a case or punctuation variant', () => {
    expect(reconcileVenue({ venue: 'winterland' }, known).venue).toBe(
      'Winterland',
    );
    expect(reconcileVenue({ venue: 'Winterland.' }, known).venue).toBe(
      'Winterland',
    );
  });

  it('does NOT fold a differently-worded name, and that is deliberate', () => {
    // A matcher loose enough to fold "Winterland Ballroom" into "Winterland"
    // would also fold "Capitol Theatre" into "Capitol Theatre Passaic". So this
    // one reaches the data as a new venue, and only the importer's printed
    // output and the spot-check stand between it and a split gallery.
    expect(reconcileVenue({ venue: 'Winterland Ballroom' }, known).venue).toBe(
      'Winterland Ballroom',
    );
  });

  it('supplies city and state a sparse infobox left out', () => {
    expect(reconcileVenue({ venue: 'Winterland' }, known)).toEqual({
      venue: 'Winterland',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    });
  });

  it('keeps what the article did say', () => {
    const out = reconcileVenue(
      { venue: 'Winterland', city: 'San Francisco' },
      known,
    );
    expect(out.city).toBe('San Francisco');
    expect(out.state).toBe('CA');
  });

  it('uses the city to pick between two venues sharing a name', () => {
    expect(
      reconcileVenue({ venue: 'Capitol Theatre', city: 'Port Chester' }, known)
        .state,
    ).toBe('NY');
    expect(
      reconcileVenue({ venue: 'Capitol Theatre', city: 'Passaic' }, known)
        .state,
    ).toBe('NJ');
  });

  it('refuses to choose when the name is ambiguous and no city says which', () => {
    // Better a bare venue for a human to finish than a coin-flip state.
    expect(reconcileVenue({ venue: 'Capitol Theatre' }, known)).toEqual({
      venue: 'Capitol Theatre',
    });
  });

  it('passes an unknown venue through untouched', () => {
    expect(
      reconcileVenue({ venue: 'Autzen Stadium', city: 'Eugene' }, known),
    ).toEqual({ venue: 'Autzen Stadium', city: 'Eugene' });
  });
});
