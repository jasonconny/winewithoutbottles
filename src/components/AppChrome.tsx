import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Footer from '@/components/Footer';
import { gallerySections } from '@/galleries';
import UiStateProvider from '@/components/UiStateProvider';
import { useUiState } from '@/hooks/useUiState';
import './AppChrome.scss';

/** Idle time before the chrome fades out and leaves the page alone. */
const CHROME_SLEEP_MS = 5000;

/**
 * The chrome itself: nav drawer + chip bar around a compressing page pane
 * rendered via <Outlet/>. The pane fills the viewport width; toggling the
 * drawer (WWOB chip) shrinks it rightward, revealing the nav gutter on the
 * ground — the prototype's "page steps aside" mechanic, shared by every
 * chromed page.
 *
 * Owns via useUiState: light-dismiss (a click on the page closes all
 * overlays, including page-owned ones like Show's info sheet), Esc, and
 * chrome sleep. Pages own their content, opt into sleep with `setSleepy`,
 * and render their own chips (stopping propagation on their toggles).
 */
function ChromeShell() {
  const {
    navOpen,
    setNavOpen,
    infoOpen,
    setInfoOpen,
    sleepy,
    chromeAwake,
    setChromeAwake,
    closeOverlays,
  } = useUiState();
  const { pathname } = useLocation();

  // Which gallery groups (Years/Tours/Venues) are expanded. Local state, not
  // useUiState: nothing outside the drawer reads it, and ChromeShell doesn't
  // unmount across route changes, so it persists like the rest of the chrome.
  // A list, not a single label — open sections are deliberately not exclusive.
  const [openSections, setOpenSections] = useState<string[]>([]);
  const toggleSection = (label: string) =>
    setOpenSections((open) =>
      open.includes(label)
        ? open.filter((item) => item !== label)
        : [...open, label],
    );

  // The info sheet is page-owned UI: it shouldn't survive navigating to a
  // different page. (The drawer intentionally does — chrome state persists
  // across chromed routes.)
  useEffect(() => {
    setInfoOpen(false);
  }, [pathname, setInfoOpen]);

  // Chrome sleep: after CHROME_SLEEP_MS of inactivity the chips fade out;
  // any pointer or keyboard activity wakes them and restarts the timer. An
  // open overlay (drawer or info sheet) pins the chrome awake; the effect
  // tears down while pinned and re-arms after. (The rendered asleep state is
  // derived as `sleepy && !chromeAwake`, so a stale flag can't strand the
  // chrome invisible on a page that doesn't sleep.)
  useEffect(() => {
    if (!sleepy || navOpen || infoOpen) return;
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
  }, [sleepy, navOpen, infoOpen, setChromeAwake]);

  // Esc closes every overlay — the keyboard companion to light-dismiss.
  useEffect(() => {
    if (!navOpen && !infoOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen, infoOpen, closeOverlays]);

  return (
    // Light-dismiss: a click/tap anywhere on the page closes every overlay.
    // Chips stop propagation so their own toggles aren't immediately undone.
    <div
      className="AppChrome"
      data-nav-open={navOpen || undefined}
      data-chrome-asleep={(sleepy && !chromeAwake) || undefined}
      onClick={() => {
        if (navOpen || infoOpen) closeOverlays();
      }}
    >
      {/*
        Nav drawer: sits behind the page pane (the pane is positioned and
        later in the DOM, so it paints on top) and is revealed when the
        pane compresses right. `inert` while closed keeps its links out of
        the tab order and the a11y tree.
      */}
      <nav
        id="app-nav"
        className="AppChrome-drawer"
        aria-label="Main"
        inert={!navOpen || undefined}
      >
        {/* One list: the top-level pages and the collapsible sub-gallery
            groups are peers, so About reads as the last nav item rather than
            trailing an unrelated second list. Groups come straight from the
            registry (src/galleries.ts) and start collapsed. */}
        <ul>
          {/* NavLink marks the current page with an `active` class. Home needs
              `end`: without it `/` prefix-matches every route and would always
              read as current. */}
          <li>
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/all">All Shows</NavLink>
          </li>
          {gallerySections.map(({ label, galleries }) => {
            const open = openSections.includes(label);
            const panelId = `nav-section-${label.toLowerCase()}`;
            return (
              <li
                key={label}
                className="AppChrome-drawerSection"
                data-open={open || undefined}
              >
                {/* The button's own text is the group's accessible name, so
                    there's no labelled region here — that would double-announce. */}
                <button
                  type="button"
                  className="AppChrome-drawerToggle"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={(event) => {
                    // Without this the drawer's light-dismiss closes the whole
                    // drawer the moment a group is expanded.
                    event.stopPropagation();
                    toggleSection(label);
                  }}
                >
                  {label}
                  <svg
                    className="AppChrome-drawerChevron"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {/* `inert` while collapsed keeps the links out of the tab order
                    and the a11y tree, but leaves them in the DOM so the height
                    transition can run (display:none would kill it). */}
                <div
                  className="AppChrome-drawerPanel"
                  id={panelId}
                  inert={!open || undefined}
                >
                  <ul>
                    {galleries.map((gallery) => (
                      <li key={gallery.slug}>
                        <NavLink to={`/${gallery.slug}`}>
                          {gallery.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
        </ul>
        <Footer />
      </nav>

      <div className="AppChrome-page">
        <Outlet />
      </div>

      <nav className="AppChrome-chips" aria-label="Site">
        <button
          type="button"
          className="AppChrome-chip"
          aria-expanded={navOpen}
          aria-controls="app-nav"
          onClick={(event) => {
            event.stopPropagation();
            setNavOpen(!navOpen);
          }}
        >
          WWOB
        </button>
      </nav>
    </div>
  );
}

/**
 * Global page template, used as a layout route (see src/router.tsx). The
 * UiStateProvider lives here — at the layout level — so chrome state (drawer
 * open, sleep timer) survives navigation between child routes, and any page
 * below can read/drive it with useUiState().
 */
export default function AppChrome() {
  return (
    <UiStateProvider>
      <ChromeShell />
    </UiStateProvider>
  );
}
