import './Placeholder.scss';

/**
 * Public holding page for winewithoutbottles.com. Currently the index route
 * ('/'); also reachable at the hidden '/placeholder' route so it stays
 * available once '/' is later repointed to the real app.
 */
export default function Placeholder() {
  return (
    <div className="Placeholder">
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
