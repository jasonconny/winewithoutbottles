import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import type { ShowDetail } from '@/wwob';
import { allShowsGallery, gallerySections } from '@/galleries';
import AppChrome from './components/AppChrome';
import Placeholder from './routes/Placeholder';
import Builder from './routes/Builder';
import Gallery from './routes/Gallery';
import Show from './routes/Show';
import About from './routes/About';
import NotFound from './routes/NotFound';

// Per-show detail (incl. the full setlist) is fetched on demand from
// public/shows/<id>.json — it's intentionally NOT in the bundled index, so the
// bundle stays small as the show count grows.
//
// Show ids are compact dates (19720827) and live at the root (`/:id`), so
// this route matches ANY single path segment. Anything not id-shaped, and any
// id-shaped segment with no show behind it, throws a 404 Response that the
// route's errorElement renders as the global NotFound page.
async function showLoader({ params }: LoaderFunctionArgs): Promise<ShowDetail> {
  if (!/^\d{8}$/.test(params.id ?? '')) {
    throw new Response('Not Found', { status: 404 });
  }
  const res = await fetch(`/shows/${params.id}.json`);
  if (!res.ok) throw new Response('Not Found', { status: 404 });
  return (await res.json()) as ShowDetail;
}

// Gallery pages: /all plus one static route per registry slug (/1977,
// /spring-1977, /madison-square-garden, …). The registry is build-time static
// data, so generating routes from it at module scope is safe, and its slug
// guards (uniqueness, reserved words, never show-id-shaped) keep this root
// namespace collision-free — see src/galleries.ts. Each loader hands the
// route's GalleryDef straight to the Gallery component; it cannot fail, so no
// errorElement is needed.
const galleryRoutes: RouteObject[] = [
  { path: '/all', element: <Gallery />, loader: () => allShowsGallery },
  ...gallerySections.flatMap(({ galleries }) =>
    galleries.map(
      (gallery): RouteObject => ({
        path: `/${gallery.slug}`,
        element: <Gallery />,
        loader: () => gallery,
      }),
    ),
  ),
];

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
      ...galleryRoutes,
      // Shows live at the root by compact-date id, e.g. /19720827. Static
      // routes (/all, gallery slugs, /about, …) outrank the dynamic segment.
      {
        path: '/:id',
        element: <Show />,
        loader: showLoader,
        errorElement: <NotFound />,
      },
      { path: '/about', element: <About /> },
      // Unlinked easter egg — not in the drawer nav, discoverable only by
      // visiting the URL directly, but it gets the chrome like every page.
      { path: '/builder', element: <Builder /> },
      // Global 404 for everything else (only multi-segment paths reach this —
      // single strays match `/:id` above and 404 via its loader).
      { path: '*', element: <NotFound /> },
    ],
  },
];
