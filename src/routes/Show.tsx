import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import './Show.scss';

/** Idle time before the chrome fades out and leaves the artwork alone. */
const CHROME_SLEEP_MS = 5000;

/**
 * Show reader: the piece fills the viewport edge-to-edge (the SVG's
 * `preserveAspectRatio="none"` stretches the stripes full-bleed) and the
 * chrome stays out of its way — two faint chips in the upper left (brand link
 * back to the gallery + an "i" button that fades in the info panel). Direction
 * set by Jason's original prototype; the setlist is deliberately unsurfaced
 * for now (the loader still fetches it for future use, e.g. stripe
 * interaction).
 */
export default function Show() {
  // Full detail (incl. songs) is fetched per-show by the route loader; see
  // `showLoader` in src/router.tsx. Missing id → null → "not found".
  const show = useLoaderData() as ShowDetail | null;
  const [infoOpen, setInfoOpen] = useState(false);
  const [chromeAwake, setChromeAwake] = useState(true);

  // Chrome sleep: after CHROME_SLEEP_MS of inactivity the chips fade out;
  // any pointer or keyboard activity wakes them and restarts the timer. An
  // open info sheet pins the chrome awake (reading isn't idleness) — the
  // effect tears down while it's open and re-arms on close.
  useEffect(() => {
    if (!show || infoOpen) return;
    let timer = setTimeout(() => setChromeAwake(false), CHROME_SLEEP_MS);
    const wake = () => {
      setChromeAwake(true);
      clearTimeout(timer);
      timer = setTimeout(() => setChromeAwake(false), CHROME_SLEEP_MS);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [show, infoOpen]);

  // Esc closes the info sheet — the keyboard companion to light-dismiss.
  useEffect(() => {
    if (!infoOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInfoOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [infoOpen]);

  if (!show) {
    return (
      <main className="Show">
        <div className="Show-notFound">
          <p>Show not found.</p>
          <Link to="/shows">← Back to the gallery</Link>
        </div>
      </main>
    );
  }

  const location = [show.venue, show.city, show.state]
    .filter(Boolean)
    .join(', ');

  return (
    // Light-dismiss: with the info sheet open, a click/tap anywhere else on
    // the page closes it. The "i" toggle stops propagation so its own toggle
    // isn't immediately undone; the WWOB link is left alone (it navigates
    // away regardless).
    <main
      className="Show"
      data-chrome-asleep={!chromeAwake || undefined}
      onClick={() => {
        if (infoOpen) setInfoOpen(false);
      }}
    >
      <h1 className="Show-srOnly">
        {show.date} — {location}
      </h1>

      <img
        className="Show-art"
        src={show.svg}
        alt={`${show.date} setlist rendered as stripes`}
      />

      <nav className="Show-chips" aria-label="Show">
        <Link className="Show-chip" to="/shows">
          WWOB
        </Link>
        <button
          type="button"
          className="Show-chip"
          aria-expanded={infoOpen}
          aria-controls="show-info"
          onClick={(event) => {
            event.stopPropagation();
            setInfoOpen((open) => !open);
          }}
        >
          i
        </button>
      </nav>

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
