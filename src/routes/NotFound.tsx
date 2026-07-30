import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import './NotFound.scss';

/**
 * Global 404 page, rendered two ways: as the `*` catch-all route element for
 * paths that match nothing, and as the `/:id` route's errorElement when the
 * show loader throws its 404 Response (non-id-shaped segment or unknown show).
 * Chromed like every reader page, so the nav drawer offers a way out.
 */
export default function NotFound() {
  usePageMeta('Wine Without Bottles: Not Found', '#ffffff');

  return (
    <main className="NotFound">
      <p>Page not found.</p>
      <Link to="/">← Back home</Link>
    </main>
  );
}
