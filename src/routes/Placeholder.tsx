import type { CSSProperties } from 'react';
import { shows } from '@/data/shows.generated';
import './Placeholder.scss';

// Pick a striped piece once per page load (at module eval — not during render,
// which must stay pure). A full reload picks a fresh one.
const randomArt = shows[Math.floor(Math.random() * shows.length)]?.svg;

/**
 * Public holding page for winewithoutbottles.com. Currently the index route
 * ('/'); also reachable at the hidden '/placeholder' route so it stays
 * available once '/' is later repointed to the real app. The only planned
 * difference between this and the future homepage is added navigation.
 */
export default function Placeholder() {
  const style = randomArt
    ? ({ '--placeholder-art': `url(${randomArt})` } as CSSProperties)
    : undefined;

  return (
    <div className="Placeholder" style={style}>
      <header>
        {/*
          Brand logotype. Intentionally a faint, low-contrast watermark over the
          artwork — treated as a logotype, which WCAG 1.4.3 exempts from the
          contrast minimum. The accessible name is preserved as real <h1> text
          (and the document <title>), so screen readers get the full title
          regardless of the visual treatment. Don't "fix" its contrast.
        */}
        <h1>Wine Without Bottles</h1>
      </header>
    </div>
  );
}
