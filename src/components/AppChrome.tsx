import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';
import { ChromeContext, useChromeApi } from '@/hooks/usePageChrome';
import type { ChromeApi } from '@/hooks/usePageChrome';
import './AppChrome.scss';

/** Idle time before the chrome fades out and leaves the page alone. */
const CHROME_SLEEP_MS = 5000;

/**
 * Render page-specific chips into the AppChrome chip bar. A portal, so the
 * page keeps full ownership of its chips (state, handlers) while they sit in
 * the layout's fixed bar next to the WWOB toggle.
 */
export function PageChips({ children }: { children: ReactNode }) {
  const { chipSlot } = useChromeApi('PageChips');
  return chipSlot ? createPortal(children, chipSlot) : null;
}

/**
 * Global page template, used as a layout route (see src/router.tsx): the nav
 * drawer + chip bar around a compressing page pane rendered via <Outlet/>.
 * The pane fills the viewport width; toggling the drawer (WWOB chip) shrinks
 * it rightward, revealing the nav gutter on the ground — the prototype's
 * "page steps aside" mechanic, shared by every chromed page. Living at the
 * layout level, chrome state (drawer open, sleep timer) survives navigation
 * between child routes.
 *
 * Owns: drawer state, light-dismiss (a click on the page closes the drawer),
 * Esc, and chrome sleep. Pages own their content, opt into sleep via
 * `usePageChrome`, and add chips via `PageChips` (stopping propagation on
 * their own toggles).
 */
export default function AppChrome() {
  const [navOpen, setNavOpen] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const [pinAwake, setPinAwake] = useState(false);
  const [chromeAwake, setChromeAwake] = useState(true);
  const [chipSlot, setChipSlot] = useState<HTMLElement | null>(null);

  // Chrome sleep: after CHROME_SLEEP_MS of inactivity the chips fade out;
  // any pointer or keyboard activity wakes them and restarts the timer. An
  // open drawer — or the page's pinAwake signal — pins the chrome awake; the
  // effect tears down while pinned and re-arms after. (The rendered asleep
  // state is derived as `sleepy && !chromeAwake`, so a stale flag can't
  // strand the chrome invisible on a page that doesn't sleep.)
  useEffect(() => {
    if (!sleepy || navOpen || pinAwake) return;
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
  }, [sleepy, navOpen, pinAwake]);

  // Esc closes the drawer — the keyboard companion to light-dismiss.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const api = useMemo<ChromeApi>(
    () => ({ chipSlot, setSleepy, setPinAwake }),
    [chipSlot],
  );

  return (
    <ChromeContext.Provider value={api}>
      {/*
        Light-dismiss: a click/tap anywhere on the page closes the drawer.
        Chips stop propagation so their own toggles aren't immediately undone.
      */}
      <div
        className="AppChrome"
        data-nav-open={navOpen || undefined}
        data-chrome-asleep={(sleepy && !chromeAwake) || undefined}
        onClick={() => {
          if (navOpen) setNavOpen(false);
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
              setNavOpen((open) => !open);
            }}
          >
            WWOB
          </button>
          {/* Page chips land here via the PageChips portal. */}
          <div className="AppChrome-pageChips" ref={setChipSlot} />
        </nav>
      </div>
    </ChromeContext.Provider>
  );
}
