import { Link, useLoaderData } from 'react-router-dom';
import { formatDuration } from '@/wwob';
import type { ShowDetail } from '@/wwob';
import Footer from '@/components/Footer';
import './Show.scss';

export default function Show() {
  // Full detail (incl. songs) is fetched per-show by the route loader; see
  // `showLoader` in src/router.tsx. Missing id → null → "not found".
  const show = useLoaderData() as ShowDetail | null;

  if (!show) {
    return (
      <main className="Show">
        <p>Show not found.</p>
        <Link to="/shows">← Back to the gallery</Link>
      </main>
    );
  }

  const location = [show.venue, show.city, show.state]
    .filter(Boolean)
    .join(', ');

  return (
    <main className="Show">
      <Link className="Show-back" to="/shows">
        ← Gallery
      </Link>

      <figure className="Show-piece">
        <img src={show.svg} alt={`${show.date} setlist rendered as stripes`} />
      </figure>

      <div className="Show-info">
        <h1>{show.date}</h1>
        <p className="Show-location">{location}</p>
        {show.collection && (
          <p className="Show-collection">{show.collection}</p>
        )}
        {show.tags && show.tags.length > 0 && (
          <ul className="Show-tags">
            {show.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        <ol className="Show-setlist">
          {show.songs.map((song, i) => (
            <li key={i}>
              <span className="Show-song">{song.title}</span>
              <span className="Show-dur">
                {formatDuration(song.durationSeconds)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Footer />
    </main>
  );
}
