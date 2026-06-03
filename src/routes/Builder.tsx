import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  buildStripes,
  isValidDuration,
  parseDuration,
  svgMarkup,
  totalWidth,
} from '@/wwob';
import type { Song } from '@/wwob';
import './Builder.scss';

const DEFAULT_HEIGHT = 100;

export default function Builder() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');

  const stripes = useMemo(() => buildStripes(songs), [songs]);
  const width = totalWidth(stripes);

  const addNode = () => {
    if (!title.trim() || !isValidDuration(duration)) {
      setError('Enter a song title and a duration as m:ss.');
      return;
    }
    setError('');
    setSongs((prev) => [
      ...prev,
      { title: title.trim(), durationSeconds: parseDuration(duration) },
    ]);
    setTitle('');
    setDuration('');
    setSource('');
  };

  const removeLast = () => {
    setSongs((prev) => prev.slice(0, -1));
    setSource('');
  };

  const reset = () => {
    setSongs([]);
    setTitle('');
    setDuration('');
    setHeight(DEFAULT_HEIGHT);
    setError('');
    setSource('');
  };

  const render = () => setSource(svgMarkup(stripes, height));

  const download = () => {
    const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup(stripes, height)}`;
    const blob = new Blob([markup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wwob.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addNode();
  };

  const hasSongs = songs.length > 0;

  return (
    <main className="Builder">
      <h1>WWOB SVG Builder</h1>
      <p className="Builder-tagline">
        Grateful Dead setlist → striped SVG. One song at a time.
      </p>

      <section className="Builder-controls">
        <div className="Builder-field">
          <label htmlFor="song-title">Song title</label>
          <input
            id="song-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div className="Builder-field">
          <label htmlFor="song-duration">Duration (m:ss)</label>
          <input
            id="song-duration"
            type="text"
            inputMode="numeric"
            placeholder="7:42"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div className="Builder-buttons">
          <button type="button" onClick={addNode}>
            Add song
          </button>
          <button type="button" onClick={removeLast} disabled={!hasSongs}>
            Remove last
          </button>
        </div>
      </section>

      {error && (
        <p className="Builder-error" role="alert">
          {error}
        </p>
      )}

      {hasSongs && (
        <section className="Builder-preview" aria-label="Preview">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            {stripes.map((stripe, i) => (
              <rect
                key={i}
                x={stripe.x}
                y={0}
                width={stripe.width}
                height={height}
                fill={`rgb(${stripe.rgb.r},${stripe.rgb.g},${stripe.rgb.b})`}
              >
                <title>{stripe.title}</title>
              </rect>
            ))}
          </svg>
        </section>
      )}

      <section className="Builder-render">
        <div className="Builder-field">
          <label htmlFor="image-height">Image height (px)</label>
          <input
            id="image-height"
            type="number"
            min={1}
            value={height}
            onChange={(e) =>
              setHeight(Number(e.target.value) || DEFAULT_HEIGHT)
            }
          />
        </div>
        <div className="Builder-buttons">
          <button type="button" onClick={render} disabled={!hasSongs}>
            Render SVG
          </button>
          <button type="button" onClick={download} disabled={!hasSongs}>
            Download .svg
          </button>
          <button type="button" onClick={reset} disabled={!hasSongs}>
            Reset
          </button>
        </div>
      </section>

      {source && (
        <section className="Builder-source">
          <label htmlFor="svg-source">SVG source</label>
          <textarea id="svg-source" readOnly value={source} rows={6} />
          <p className="Builder-hint">
            Copy into a file with a <code>.svg</code> extension to open in
            Illustrator, or use “Download .svg”.
          </p>
        </section>
      )}
    </main>
  );
}
