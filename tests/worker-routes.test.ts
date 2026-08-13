import type { RouteObject } from 'react-router-dom';
import { routes } from '@/router';
import { allShowsGallery, gallerySections } from '@/galleries';
import { isShowId } from '@/wwob';
import { STATIC_PATHS, isKnownPath, knownPathList } from '../worker/routes.ts';

/**
 * The Worker (worker/index.ts) decides which paths get a real 404 at the edge.
 * If it disagrees with the router, live URLs 404 for crawlers or dead ones
 * keep returning 200 — neither shows up in the app's own tests, so pin it here.
 */
describe('worker route matching', () => {
  it('knows every static route', () => {
    for (const path of STATIC_PATHS) {
      expect(isKnownPath(path)).toBe(true);
    }
  });

  it('knows every gallery slug in the registry', () => {
    const slugs = gallerySections.flatMap(({ galleries }) => galleries);
    expect(slugs.length).toBeGreaterThan(0);
    for (const { slug } of slugs) {
      expect(isKnownPath(`/${slug}`)).toBe(true);
    }
  });

  it('knows every show id in the bundled index', () => {
    for (const { id } of allShowsGallery.shows) {
      expect(isKnownPath(`/${id}`)).toBe(true);
    }
  });

  it('rejects paths the app does not serve', () => {
    // Id-shaped but no such show; the retired holding page; plain strays.
    expect(isKnownPath('/19990101')).toBe(false);
    expect(isKnownPath('/placeholder')).toBe(false);
    expect(isKnownPath('/nope')).toBe(false);
    expect(isKnownPath('/no/such/page')).toBe(false);
    expect(isKnownPath('/1977/extra')).toBe(false);
  });

  it('treats a trailing slash as the same page', () => {
    // The router matches '/1977/' and '/1977' alike; a stray slash must not
    // manufacture a 404.
    expect(isKnownPath('/1977/')).toBe(true);
    expect(isKnownPath('/all/')).toBe(true);
    expect(isKnownPath('/')).toBe(true);
    expect(isKnownPath('/nope/')).toBe(false);
  });

  // The guard that matters: a new static route added to src/router.tsx but not
  // to the Worker would silently 404 at the edge while working in dev.
  it('matches the router page-for-page', () => {
    const chromeLayout = routes.find((route) => route.children);
    const routerPaths = new Set<string>();
    for (const child of (chromeLayout?.children ?? []) as RouteObject[]) {
      if (child.index) routerPaths.add('/');
      // Skip the dynamic families: '/:id' is covered by show ids and '*' is
      // the catch-all whose whole job is to be unknown.
      if (!child.path || child.path.includes(':') || child.path === '*') {
        continue;
      }
      routerPaths.add(
        child.path.startsWith('/') ? child.path : `/${child.path}`,
      );
    }

    const workerPaths = new Set(
      knownPathList().filter((path) => !isShowId(path.slice(1))),
    );
    // Guard against the comparison passing vacuously if either side ever stops
    // resolving: '/', '/all', '/about', '/builder' + every gallery slug.
    expect(routerPaths.size).toBeGreaterThan(STATIC_PATHS.length);
    expect([...workerPaths].sort()).toEqual([...routerPaths].sort());
    // And the show family is genuinely in there too.
    expect(knownPathList().length).toBe(
      workerPaths.size + allShowsGallery.shows.length,
    );
  });
});
