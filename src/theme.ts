/**
 * The two ground colors, shared by the SCSS that paints them and the routes
 * that pass them to usePageMeta as the browser theme-color. Kept here so a
 * ground can't be changed in one place and drift in the other — the values
 * must match `.AppChrome-page` and `.AppChrome` in AppChrome.scss.
 *
 * One copy lives outside this file's reach: `public/manifest.json` repeats
 * PAGE_GROUND as its `background_color` (the PWA splash). Static JSON can't
 * import, and can't even carry a comment — so if a ground changes here, change
 * it there too.
 */

/**
 * The page pane behind document pages (About, Builder, NotFound) and the
 * negative space beside gallery rows. Sits midway between white and
 * PAGE_GROUND's darker sibling below, keeping the same cool cast (B ≥ G ≥ R).
 */
export const PAGE_GROUND = '#d2d5d8';

/**
 * The nav gutter, and the ground art pages rest on. A cool neutral at ~#AAA
 * value, chosen to sit inside the stripe palette's family but outside its
 * reach — see the note on `.AppChrome` in AppChrome.scss.
 */
export const SHOW_GROUND = '#a6abb1';
