import { Link, useLoaderData } from 'react-router-dom';
import type { GalleryDef } from '@/galleries';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Gallery.scss';

/**
 * Gallery reader: one component serves every gallery page — /all plus the
 * per-year/tour/venue slugs (see galleryRoutes in src/router.tsx; each route's
 * loader hands over its GalleryDef). Minimal and abstract by design: no
 * visible text, no whitespace. Each show is a bare stripe-row at fixed
 * height whose width is proportional to the show's length — the longest show
 * on the page spans the full pane, the rest sit flush left with a ragged
 * right edge — and links to its show page.
 */
export default function Gallery() {
  const gallery = useLoaderData() as GalleryDef;
  usePageMeta(`Wine Without Bottles: ${gallery.title}`, '#ffffff');

  const maxSeconds = Math.max(
    ...gallery.shows.map((show) => show.durationSeconds),
  );

  return (
    <main className="Gallery">
      <h1 className="Gallery-srOnly">{gallery.title}</h1>
      <ul className="Gallery-rows">
        {gallery.shows.map((show) => (
          <li key={show.id}>
            <Link
              to={`/${show.id}`}
              // Width relative to the pane (not the viewport) so the
              // proportions hold when the open drawer compresses the page.
              style={{
                width: `${(show.durationSeconds / maxSeconds) * 100}%`,
              }}
            >
              <img
                src={show.svg}
                alt={`${show.date} — ${show.venue}, ${show.city}`}
                loading="lazy"
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
