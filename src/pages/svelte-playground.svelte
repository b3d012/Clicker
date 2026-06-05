<script lang="ts">
  let taps = 0;
</script>

<main class="demo-shell">
  <div class="demo-top">
    <div>
      <div class="eyebrow">Svelte Playground</div>
      <h1 class="title" style="font-size: clamp(2rem, 4vw, 3.5rem);">
        A Svelte surface for compact UI experiments.
      </h1>
    </div>
    <a class="button secondary" href="./index.html">Back to game</a>
  </div>

  <section class="card demo-stage">
    <p class="lede">
      This demo keeps Svelte isolated, which makes it easy to compare the compiled output
      against the other options in the starter.
    </p>
    <button class="button primary" type="button" on:click={() => taps += 1}>
      Svelte tap count: {taps}
    </button>
  </section>
</main>
