import { createApp } from 'vue';
import '../styles.css';

createApp({
  data() {
    return {
      taps: 0,
    };
  },
  template: `
    <main class="demo-shell">
      <div class="demo-top">
        <div>
          <div class="eyebrow">Vue Playground</div>
          <h1 class="title" style="font-size: clamp(2rem, 4vw, 3.5rem);">
            A Vue surface for reactive clicker experiments.
          </h1>
        </div>
        <a class="button secondary" href="./index.html">Back to game</a>
      </div>

      <section class="card demo-stage">
        <p class="lede">
          Vue is wired in as an isolated playground so we can compare patterns without
          changing the main browser-only runtime.
        </p>
        <button class="button primary" type="button" @click="taps += 1">
          Vue tap count: {{ taps }}
        </button>
      </section>
    </main>
  `,
}).mount('#app');
