/**
 * Display formatting for show dates. Shows are authored and stored as ISO
 * `YYYY-MM-DD` (see `ShowMeta.date`) — that form sorts, matches the compact
 * URL id, and is what the data-validity test pins. This is the human-facing
 * rendering of the same value: "1972-08-27" → "August 27, 1972".
 */

import type { Sitting } from '@/wwob';

const monthDayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

/**
 * Split an ISO `YYYY-MM-DD` show date into its display pieces:
 * "1972-08-27" → `{ monthDay: 'August 27', year: '1972' }`.
 *
 * Separate parts because the Show heading links the year on its own (to that
 * year's gallery, whose slug *is* the year) while the rest stays plain text.
 */
export function formatShowDateParts(isoDate: string): {
  monthDay: string;
  year: string;
} {
  const [year, month, day] = isoDate.split('-').map(Number);
  return {
    // Built from local parts rather than `new Date(isoDate)`: the bare ISO
    // string parses as UTC midnight, which formats as the *previous* day for
    // any viewer west of Greenwich.
    monthDay: monthDayFormat.format(new Date(year, month - 1, day)),
    // Sliced, not `String(year)`, so the source digits survive verbatim.
    year: isoDate.slice(0, 4),
  };
}

/** Format an ISO `YYYY-MM-DD` show date as e.g. "August 27, 1972". */
export function formatShowDate(isoDate: string): string {
  const { monthDay, year } = formatShowDateParts(isoDate);
  return `${monthDay}, ${year}`;
}

/**
 * Display text for a show's `sitting`: "early show" / "late show".
 *
 * Lowercase on purpose, including mid-heading after the date — it reads as a
 * quiet qualifier on the date rather than a second proper noun competing with
 * the venue.
 *
 * A label rather than a full formatter because the separator differs by
 * context — the info sheet's heading joins it to the date with a middot, the
 * alt text with a comma — and only the caller knows which it wants.
 */
export function sittingLabel(sitting: Sitting): string {
  return sitting === 'early' ? 'early show' : 'late show';
}
