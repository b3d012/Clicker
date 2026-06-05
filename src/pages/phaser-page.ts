import Phaser from 'phaser';
import '../styles.css';

const host = document.querySelector('#app');

if (!host) {
  throw new Error('Phaser host not found.');
}

host.innerHTML = `
  <main class="demo-shell">
    <div class="demo-top">
      <div>
        <div class="eyebrow">Phaser Playground</div>
        <h1 class="title" style="font-size: clamp(2rem, 4vw, 3.5rem);">
          A Phaser canvas for the clicker starter.
        </h1>
      </div>
      <a class="button secondary" href="./index.html">Back to game</a>
    </div>
    <section class="card demo-stage">
      <p class="lede">
        Phaser is a good option if the project leans more toward a classic game loop and
        scene system later on.
      </p>
      <div id="phaser-root"></div>
    </section>
  </main>
`;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'phaser-root',
  width: 720,
  height: 400,
  backgroundColor: '#08111f',
  scene: {
    create() {
      this.add
        .text(360, 120, 'Phaser Sandbox', {
          fontFamily: 'Inter, sans-serif',
          fontSize: '36px',
          color: '#f4f7ff',
        })
        .setOrigin(0.5);

      const sparks = this.add.text(360, 200, 'Tap count: 0', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '24px',
        color: '#7cf7d4',
      });

      const button = this.add
        .rectangle(360, 286, 240, 70, 0x72ddb8)
        .setStrokeStyle(2, 0xb2fff0)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(360, 286, 'Tap the canvas', {
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          color: '#04120f',
        })
        .setOrigin(0.5);

      let taps = 0;

      button.on('pointerdown', () => {
        taps += 1;
        sparks.setText(`Tap count: ${taps}`);
      });
    },
  },
});
