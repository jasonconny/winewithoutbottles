import { allShowsGallery, gallerySections } from '../src/galleries.ts';

/**
 * Which URLs the SPA actually serves — the Worker's half of the 404 story.
 *
 * Kept apart from the fetch handler (worker/index.ts) so it stays pure and
 * testable: no Workers globals, no bindings, just string matching. The route
 * families come straight from the same registry src/router.tsx builds its
 * routes from, so gallery slugs and show ids cannot drift between the edge
 * and the client. Only STATIC_PATHS is written twice, and
 * tests/worker-routes.test.ts pins it against the router.
 */

/** Static routes from src/router.tsx, outside the gallery and show families. */
export const STATIC_PATHS = ['/', '/all', '/about', '/builder'];

/**
 * Every path the app renders as a real page. Show ids come from the bundled
 * index rather than probing for `/shows/<id>.json`: with SPA `not_found_handling`
 * a missing asset answers with the shell and a 200, so probing could not tell a
 * real show from a made-up one anyway.
 */
const knownPaths = new Set<string>([
  ...STATIC_PATHS,
  ...gallerySections
    .flatMap(({ galleries }) => galleries)
    .map(({ slug }) => `/${slug}`),
  ...allShowsGallery.shows.map(({ id }) => `/${id}`),
]);

/** Exposed for the parity test; the Worker itself only needs isKnownPath. */
export function knownPathList(): string[] {
  return [...knownPaths];
}

export function isKnownPath(pathname: string): boolean {
  // '/1977/' and '/1977' are the same page to the router; treat them alike so
  // a trailing slash doesn't manufacture a 404.
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return knownPaths.has(normalized);
}
