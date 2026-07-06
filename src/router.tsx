import { Navigate, redirect } from 'react-router-dom';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import AppChrome from './components/AppChrome';
import Placeholder from './routes/Placeholder';
import Builder from './routes/Builder';
import Gallery from './routes/Gallery';
import Show from './routes/Show';
import About from './routes/About';

// Per-show detail (incl. the full setlist) is fetched on demand from
// public/shows/<id>.json — it's intentionally NOT in the bundled index, so the
// bundle stays small as the show count grows. A missing id resolves to null,
// which the Show component renders as "not found".
//
// Show ids are compact dates (19720827) and live at the root (`/:id`), so
// this route matches ANY single path segment. Anything not id-shaped
// redirects home — preserving the old catch-all behavior for stray paths —
// while an id-shaped-but-unknown show gets the "not found" page.
async function showLoader({
  params,
}: LoaderFunctionArgs): Promise<ShowDetail | null | Response> {
  if (!/^\d{8}$/.test(params.id ?? '')) return redirect('/');
  const res = await fetch(`/shows/${params.id}.json`);
  return res.ok ? ((await res.json()) as ShowDetail) : null;
}

export const routes: RouteObject[] = [
  // Public holding page. When the real app is ready, repoint '/' to it; the
  // placeholder stays reachable at '/placeholder'.
  { path: '/', element: <Placeholder /> },
  { path: '/placeholder', element: <Placeholder /> },
  // Reader app (hidden for now — home flip is a later step). AppChrome is a
  // layout route: the nav drawer + chip bar wrap each child page, and chrome
  // state (drawer open, sleep timer) survives navigation between them.
  {
    element: <AppChrome />,
    children: [
      { path: '/gallery', element: <Gallery /> },
      // Shows live at the root by compact-date id, e.g. /19720827. Static
      // routes (/gallery, /about, …) outrank the dynamic segment.
      { path: '/:id', element: <Show />, loader: showLoader },
      { path: '/about', element: <About /> },
      // Unlinked easter egg — not in the drawer nav, discoverable only by
      // visiting the URL directly, but it gets the chrome like every page.
      { path: '/builder', element: <Builder /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
