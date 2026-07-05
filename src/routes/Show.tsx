import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import Footer from '@/components/Footer';
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
  const [navOpen, setNavOpen] = useState(false);
  const [chromeAwake, setChromeAwake] = useState(true);

  // Chrome sleep: after CHROME_SLEEP_MS of inactivity the chips fade out;
  // any pointer or keyboard activity wakes them and restarts the timer. An
  // open info sheet or nav drawer pins the chrome awake (reading/navigating
  // isn't idleness) — the effect tears down while either is open and re-arms
  // on close.
  useEffect(() => {
    if (!show || infoOpen || navOpen) return;
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
  }, [show, infoOpen, navOpen]);

  // Esc closes the info sheet and/or nav drawer — the keyboard companion to
  // light-dismiss.
  useEffect(() => {
    if (!infoOpen && !navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInfoOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [infoOpen, navOpen]);

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
    // Light-dismiss: a click/tap anywhere else on the page (effectively, on
    // the art) closes whatever is open — info sheet, nav drawer, or both.
    // Each chip stops propagation so its own toggle isn't immediately undone.
    <main
      className="Show"
      data-chrome-asleep={!chromeAwake || undefined}
      data-nav-open={navOpen || undefined}
      onClick={() => {
        if (infoOpen) setInfoOpen(false);
        if (navOpen) setNavOpen(false);
      }}
    >
      <h1 className="Show-srOnly">
        {show.date} — {location}
      </h1>

      {/*
        Nav drawer: sits behind the artwork (earlier in the DOM, no z-index
        needed) and is revealed when the art slides right. `inert` while
        closed keeps its links out of the tab order and the a11y tree.
      */}
      <nav
        id="show-nav"
        className="Show-drawer"
        aria-label="Main"
        inert={!navOpen || undefined}
      >
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/shows">Gallery</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
        <Footer />
      </nav>

      <img
        className="Show-art"
        src={show.svg}
        alt={`${show.date} setlist rendered as stripes`}
      />

      <nav className="Show-chips" aria-label="Show">
        <button
          type="button"
          className="Show-chip"
          aria-expanded={navOpen}
          aria-controls="show-nav"
          onClick={(event) => {
            event.stopPropagation();
            setNavOpen((open) => !open);
          }}
        >
          WWOB
        </button>
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
