import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';

function ReactPlayground(): React.JSX.Element {
  const [taps, setTaps] = React.useState(0);

  return (
    <main className="demo-shell">
      <div className="demo-top">
        <div>
          <div className="eyebrow">React Playground</div>
          <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            A tiny React surface for the clicker starter.
          </h1>
        </div>
        <a className="button secondary" href="./index.html">
          Back to game
        </a>
      </div>

      <section className="card demo-stage">
        <p className="lede">
          This page exists so the starter can compare frameworks without forcing the main
          landing page to become one big hybrid bundle.
        </p>
        <button className="button primary" type="button" onClick={() => setTaps((value) => value + 1)}>
          React tap count: {taps}
        </button>
      </section>
    </main>
  );
}

createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <ReactPlayground />
  </React.StrictMode>,
);
