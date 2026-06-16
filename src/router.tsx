import { Navigate } from 'react-router-dom';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import Placeholder from './routes/Placeholder';
import Builder from './routes/Builder';
import Gallery from './routes/Gallery';
import Show from './routes/Show';
import About from './routes/About';

// Per-show detail (incl. the full setlist) is fetched on demand from
// public/shows/<id>.json — it's intentionally NOT in the bundled index, so the
// bundle stays small as the show count grows. A missing id resolves to null,
// which the Show component renders as "not found".
async function showLoader({
  params,
}: LoaderFunctionArgs): Promise<ShowDetail | null> {
  const res = await fetch(`/shows/${params.id}.json`);
  return res.ok ? ((await res.json()) as ShowDetail) : null;
}

export const routes: RouteObject[] = [
  // Public holding page. When the real app is ready, repoint '/' to it; the
  // placeholder stays reachable at '/placeholder'.
  { path: '/', element: <Placeholder /> },
  { path: '/placeholder', element: <Placeholder /> },
  // Reader app (hidden for now — home flip is a later step).
  { path: '/shows', element: <Gallery /> },
  { path: '/shows/:id', element: <Show />, loader: showLoader },
  { path: '/about', element: <About /> },
  // Unlinked easter egg — discoverable only by visiting the URL directly.
  { path: '/builder', element: <Builder /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
