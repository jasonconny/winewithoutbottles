import './App.scss';

function App() {
  return (
    <div className="App">
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

export default App;
