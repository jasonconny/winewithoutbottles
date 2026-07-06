import { useEffect } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import { useUiState } from '@/hooks/useUiState';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Show.scss';

/** The page ground (see .Show in Show.scss) — the theme color matches it. */
const SHOW_GROUND = '#a6abb1';

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
  // `showLoader` in src/router.tsx. Missing id → null → "not found".
  const show = useLoaderData() as ShowDetail | null;
  const { infoOpen, setInfoOpen, setSleepy } = useUiState();

  usePageMeta(
    show
      ? `${show.date} — Wine Without Bottles`
      : 'Show not found — Wine Without Bottles',
    SHOW_GROUND,
  );

  // Art page: the chrome sleeps after idle (not on the not-found branch).
  useEffect(() => {
    setSleepy(!!show);
    return () => setSleepy(false);
  }, [show, setSleepy]);

  if (!show) {
    return (
      <main className="Show">
        <div className="Show-notFound">
          <p>Show not found.</p>
          <Link to="/gallery">← Back to the gallery</Link>
        </div>
      </main>
    );
  }

  const location = [show.venue, show.city, show.state]
    .filter(Boolean)
    .join(', ');

  return (
    // No click handler here: light-dismiss lives on the AppChrome root — a
    // click on the art bubbles up and closes the sheet and/or drawer.
    <main className="Show">
      <h1 className="Show-srOnly">
        {show.date} — {location}
      </h1>

      <img
        className="Show-art"
        src={show.svg}
        alt={`${show.date} setlist rendered as stripes`}
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
        <h2>{show.date}</h2>
        <h3 className="Show-location">{location}</h3>
        {show.collection && (
          <p className="Show-collection">{show.collection}</p>
        )}
        {show.tags && show.tags.length > 0 && (
          <ul className="Show-tags">
            {show.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
