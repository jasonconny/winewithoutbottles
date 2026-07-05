import { useEffect } from 'react';

/**
 * Per-route document metadata: the tab/window title and the `theme-color`
 * the browser paints its own chrome with (iOS Safari toolbar, Android status
 * bar). The theme color should match the route's page ground so the browser
 * chrome reads as part of the page rather than a frame around it.
 *
 * Static defaults live in index.html (pre-hydration); every route calls this
 * hook with its own values on mount. There is no unmount restore — routes own
 * their metadata, so a route that skips the hook inherits the previous
 * route's values.
 */
export function usePageMeta(title: string, themeColor: string) {
  useEffect(() => {
    document.title = title;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor);
  }, [title, themeColor]);
}
