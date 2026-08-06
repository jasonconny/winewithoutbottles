/**
 * Display formatting for show dates. Shows are authored and stored as ISO
 * `YYYY-MM-DD` (see `ShowMeta.date`) — that form sorts, matches the compact
 * URL id, and is what the data-validity test pins. This is the human-facing
 * rendering of the same value: "1972-08-27" → "August 27, 1972".
 */

const showDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

/** Format an ISO `YYYY-MM-DD` show date as e.g. "August 27, 1972". */
export function formatShowDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  // Built from local parts rather than `new Date(isoDate)`: the bare ISO
  // string parses as UTC midnight, which formats as the *previous* day for
  // any viewer west of Greenwich.
  return showDateFormat.format(new Date(year, month - 1, day));
}
