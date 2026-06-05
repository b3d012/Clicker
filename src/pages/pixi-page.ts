import { Application, Assets, Container, Graphics, Text } from 'pixi.js';
import '../styles.css';

const host = document.querySelector('#app');

if (!host) {
  throw new Error('Pixi host not found.');
}

host.innerHTML = `
  <main class="demo-shell">
    <div class="demo-top">
      <div>
        <div class="eyebrow">PixiJS Playground</div>
        <h1 class="title" style="font-size: clamp(2rem, 4vw, 3.5rem);">
          A Pixi canvas for fast visuals and effects.
        </h1>
      </div>
      <a class="button secondary" href="./index.html">Back to game</a>
    </div>
    <section class="card demo-stage">
      <p class="lede">
        PixiJS is a strong middle ground if we want richer visuals without committing the
        main game to a full scene engine right away.
      </p>
      <div id="pixi-root"></div>
    </section>
  </main>
`;

const root = document.querySelector<HTMLDivElement>('#pixi-root');

if (!root) {
  throw new Error('Pixi root not found.');
}

const app = new Application();

await app.init({
  width: 720,
  height: 400,
  background: '#08111f',
  antialias: true,
});

root.appendChild(app.canvas);

await Assets.load([]);

const stage = new Container();
app.stage.addChild(stage);

const glow = new Graphics()
  .circle(360, 190, 86)
  .fill({ color: 0x7cf7d4, alpha: 0.22 });
stage.addChild(glow);

const ring = new Graphics()
  .roundRect(200, 130, 320, 140, 28)
  .stroke({ color: 0xb2fff0, width: 2, alpha: 0.85 });
stage.addChild(ring);

const label = new Text({
  text: 'PixiJS Sandbox',
  style: {
    fill: '#f4f7ff',
    fontFamily: 'Inter, sans-serif',
    fontSize: 34,
  },
});
label.anchor.set(0.5);
label.position.set(360, 170);
stage.addChild(label);

const counter = new Text({
  text: 'Tap count: 0',
  style: {
    fill: '#7cf7d4',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 22,
  },
});
counter.anchor.set(0.5);
counter.position.set(360, 220);
stage.addChild(counter);

const tapZone = new Graphics()
  .roundRect(260, 255, 200, 54, 18)
  .fill({ color: 0x72ddb8 });
tapZone.eventMode = 'static';
tapZone.cursor = 'pointer';
stage.addChild(tapZone);

const zoneLabel = new Text({
  text: 'Tap the canvas',
  style: {
    fill: '#04120f',
    fontFamily: 'Inter, sans-serif',
    fontSize: 18,
  },
});
zoneLabel.anchor.set(0.5);
zoneLabel.position.set(360, 282);
stage.addChild(zoneLabel);

let taps = 0;

tapZone.on('pointerdown', () => {
  taps += 1;
  counter.text = `Tap count: ${taps}`;
  glow.scale.set(1.06);

  app.ticker.addOnce(() => {
    glow.scale.set(1);
  });
});
