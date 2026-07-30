import { useEffect, type CSSProperties } from 'react';
import { shows } from '@/data/shows.generated';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useUiState } from '@/hooks/useUiState';
import './Home.scss';

// Pick a striped piece once per page load (at module eval — not during render,
// which must stay pure). A full reload picks a fresh one.
const randomArt = shows[Math.floor(Math.random() * shows.length)]?.svg;

/**
 * The homepage for winewithoutbottles.com: a random striped piece under the
 * brand logotype, plus the global chrome's nav (it's the AppChrome layout
 * route's index child, so the WWOB chip and drawer come for free).
 */
export default function Home() {
  const { setSleepy } = useUiState();
  usePageMeta('Wine Without Bottles', '#000000');

  // Like Show: this is an art page, so the chips fade after an idle beat and
  // leave the piece alone. The cleanup matters — without it the next page
  // would inherit sleep.
  useEffect(() => {
    setSleepy(true);
    return () => setSleepy(false);
  }, [setSleepy]);

  const style = randomArt
    ? ({ '--home-art': `url(${randomArt})` } as CSSProperties)
    : undefined;

  return (
    <main className="Home" style={style}>
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
    </main>
  );
}
