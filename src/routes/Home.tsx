import { useEffect, type CSSProperties } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useRotatingArt } from '@/hooks/useRotatingArt';
import { useUiState } from '@/hooks/useUiState';
import './Home.scss';

/**
 * The homepage for winewithoutbottles.com: a random striped piece under the
 * brand logotype, plus the global chrome's nav (it's the AppChrome layout
 * route's index child, so the WWOB chip and drawer come for free).
 *
 * The piece isn't fixed for the life of the page load: useRotatingArt rerolls
 * it every HOME_ROTATE_MS, alternating the two CSS layers Home.scss stacks so
 * the new piece crossfades in. A full reload still picks a fresh opener.
 */
export default function Home() {
  const { setSleepy } = useUiState();
  const { layers, live } = useRotatingArt();
  usePageMeta('Wine Without Bottles', '#000000');

  // Like Show: this is an art page, so the chips fade after an idle beat and
  // leave the piece alone. The cleanup matters — without it the next page
  // would inherit sleep.
  useEffect(() => {
    setSleepy(true);
    return () => setSleepy(false);
  }, [setSleepy]);

  const style = {
    '--home-art-a': layers[0] && `url(${layers[0]})`,
    '--home-art-b': layers[1] && `url(${layers[1]})`,
  } as CSSProperties;

  return (
    <main className="Home" style={style} data-live-layer={live}>
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
