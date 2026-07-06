import { Link } from 'react-router-dom';
import { shows } from '@/data/shows.generated';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Gallery.scss';

export default function Gallery() {
  usePageMeta('Gallery — Wine Without Bottles', '#ffffff');

  return (
    <main className="Gallery">
      <h1>Gallery</h1>
      <ul className="Gallery-grid">
        {shows.map((show) => (
          <li key={show.id} className="Gallery-item">
            <Link to={`/${show.id}`}>
              <img
                className="Gallery-art"
                src={show.svg}
                alt={`${show.date} — ${show.songCount} songs as stripes`}
                loading="lazy"
              />
              <span className="Gallery-meta">
                <strong>{show.date}</strong>
                <span>
                  {show.venue}, {show.city}
                </span>
                {show.collection && (
                  <span className="Gallery-collection">{show.collection}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
