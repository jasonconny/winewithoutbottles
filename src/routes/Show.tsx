import { useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import { Link } from 'react-router-dom';
import { useUiState } from '@/hooks/useUiState';
import { usePageMeta } from '@/hooks/usePageMeta';
import { findRunForShow, findTagGallery } from '@/galleries';
import { formatShowDate, formatShowDateParts } from '@/date';
import { SHOW_GROUND } from '@/theme';
import './Show.scss';

/**
 * Show reader: the piece fills the viewport edge-to-edge (the SVG's
 * `preserveAspectRatio="none"` stretches the stripes full-bleed) inside the
 * global AppChrome (nav drawer + chip bar). The page contributes the "i"
 * chip, which fades in the info sheet; both live in shared UI state so the
 * chrome can light-dismiss/Esc-close them and pin sleep while the sheet is
 * open. Direction set by Jason's original prototype; the setlist is
 * deliberately unsurfaced for now (the loader still fetches it for future
 * use, e.g. stripe interaction).
 */
export default function Show() {
  // Full detail (incl. songs) is fetched per-show by the route loader; see
  // `showLoader` in src/router.tsx. A missing show 404s there, so the data is
  // guaranteed here (the route's errorElement renders NotFound instead).
  const show = useLoaderData() as ShowDetail;
  const { infoOpen, setInfoOpen, setSleepy } = useUiState();

  usePageMeta(`Wine Without Bottles: ${show.id}`, SHOW_GROUND);

  // Art page: the chrome sleeps after idle.
  useEffect(() => {
    setSleepy(true);
    return () => setSleepy(false);
  }, [setSleepy]);

  const location = [show.venue, show.city, show.state]
    .filter(Boolean)
    .join(', ');
  const date = formatShowDate(show.date);
  // The year gallery's slug *is* the year, and years partition the whole
  // corpus, so `/<year>` always resolves for any show.
  const { monthDay, year } = formatShowDateParts(show.date);
  // Derived, not stored: runs depend on neighbouring shows, so they're computed
  // from the complete bundled index rather than baked into per-show JSON that a
  // filtered `npm run generate <id>` could leave stale.
  const run = findRunForShow(show.id);

  return (
    // No click handler here: light-dismiss lives on the AppChrome root — a
    // click on the art bubbles up and closes the sheet and/or drawer.
    <main className="Show">
      <h1 className="Show-srOnly">
        {date} — {location}
      </h1>

      <img
        className="Show-art"
        src={show.svg}
        alt={`${date} setlist rendered as stripes`}
      />

      <button
        type="button"
        className="AppChrome-chip Show-infoChip"
        aria-expanded={infoOpen}
        aria-controls="show-info"
        onClick={(event) => {
          event.stopPropagation();
          setInfoOpen(!infoOpen);
        }}
      >
        i
      </button>

      <section
        id="show-info"
        className="Show-info"
        data-open={infoOpen || undefined}
        aria-label="Show information"
      >
        <h2>
          {monthDay}, <Link to={`/${year}`}>{year}</Link>
        </h2>
        <h3 className="Show-location">{location}</h3>
        {run && (
          // The run page is not in the drawer (40 of them would swamp it), so
          // this link is how a run is reached. Deliberately not stopping
          // propagation: the click bubbles to AppChrome's light-dismiss, which
          // is what should happen when navigating away — same as drawer links.
          <p className="Show-run">
            <Link to={`/${run.slug}`}>{run.title}</Link>
          </p>
        )}
        {show.tags && show.tags.length > 0 && (
          <ul className="Show-tags">
            {show.tags.map((tag) => {
              // Every authored tag has an index page (they're derived from the
              // corpus), but fall back to plain text rather than linking
              // nowhere if one ever doesn't. The pipe separator is a CSS
              // ::after on the <li>, so it stays outside the link.
              const gallery = findTagGallery(tag);
              return (
                <li key={tag}>
                  {gallery ? <Link to={`/${gallery.slug}`}>{tag}</Link> : tag}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
