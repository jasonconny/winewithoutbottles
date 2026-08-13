import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import { isShowId, type ShowDetail } from '@/wwob';
import { allShowsGallery, allSubGalleries } from '@/galleries';
import AppChrome from './components/AppChrome';
import Home from './routes/Home';
import Builder from './routes/Builder';
import Gallery from './routes/Gallery';
import Show from './routes/Show';
import About from './routes/About';
import NotFound from './routes/NotFound';

// Per-show detail (incl. the full setlist) is fetched on demand from
// public/shows/<id>.json — it's intentionally NOT in the bundled index, so the
// bundle stays small as the show count grows.
//
// Show ids are compact dates (19720827), with a two-digit ordinal on the dates
// that carry two shows (1970021301), and live at the root (`/:id`), so this
// route matches ANY single path segment. Anything not id-shaped, and any
// id-shaped segment with no show behind it, throws a 404 Response that the
// route's errorElement renders as the global NotFound page.
async function showLoader({ params }: LoaderFunctionArgs): Promise<ShowDetail> {
  if (!isShowId(params.id ?? '')) {
    throw new Response('Not Found', { status: 404 });
  }
  const res = await fetch(`/shows/${params.id}.json`);
  if (!res.ok) throw new Response('Not Found', { status: 404 });
  return (await res.json()) as ShowDetail;
}

// Gallery pages: /all plus one static route per registry slug (/1977,
// /spring-1977, /madison-square-garden, /winterland-arena-october-1974, …).
// The registry is build-time static data, so generating routes from it at
// module scope is safe, and its slug guards (uniqueness, reserved words, never
// show-id-shaped) keep this root namespace collision-free — see
// src/galleries.ts. Each loader hands the route's GalleryDef straight to the
// Gallery component; it cannot fail, so no errorElement is needed.
//
// Built from `allSubGalleries`, not `gallerySections`: run pages are routed but
// intentionally absent from the drawer, so the two lists are not the same.
const galleryRoutes: RouteObject[] = [
  { path: '/all', element: <Gallery />, loader: () => allShowsGallery },
  ...allSubGalleries.map(
    (gallery): RouteObject => ({
      path: `/${gallery.slug}`,
      element: <Gallery />,
      loader: () => gallery,
    }),
  ),
];

export const routes: RouteObject[] = [
  // AppChrome is a layout route: the nav drawer + chip bar wrap each child
  // page, and chrome state (drawer open, sleep timer) survives navigation
  // between them. Every route lives inside it, homepage included.
  {
    element: <AppChrome />,
    children: [
      // The homepage: a random striped piece under the logotype, with the
      // chrome's nav as its way into the rest of the project. As the pathless
      // layout's index route this resolves to '/', which is what the drawer's
      // `NavLink to="/" end` expects. A bare slash isn't a path segment, so it
      // never competes with '/:id' below.
      { index: true, element: <Home /> },
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
