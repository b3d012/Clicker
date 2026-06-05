import { Howl } from 'howler';
import './styles.css';
import { formatCurrency, formatNumber } from './shared/format';
import { createChiptuneLoopUrl, createToneUrl } from './shared/audio';

type ShopId = 'cursor' | 'drone' | 'mine' | 'factory';

interface ShopItem {
  id: ShopId;
  name: string;
  description: string;
  baseCost: number;
  growth: number;
  effect: string;
}

interface GameState {
  coins: number;
  totalClicks: number;
  clickPower: number;
  coinsPerSecond: number;
  levels: Record<ShopId, number>;
  muted: boolean;
  musicStarted: boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'cursor',
    name: 'Mouse Cursor',
    description: 'A tiny helper that adds more punch to every click.',
    baseCost: 15,
    growth: 1.3,
    effect: '+1 coin per click',
  },
  {
    id: 'drone',
    name: 'Coin Drone',
    description: 'A small helper bot that brings in coins over time.',
    baseCost: 50,
    growth: 1.35,
    effect: '+0.5 coins/sec',
  },
  {
    id: 'mine',
    name: 'Tiny Mine',
    description: 'A classic idle-game mine that boosts your click value.',
    baseCost: 125,
    growth: 1.38,
    effect: '+3 coins per click',
  },
  {
    id: 'factory',
    name: 'Coin Factory',
    description: 'The first real automation step for steady income.',
    baseCost: 300,
    growth: 1.42,
    effect: '+2.5 coins/sec',
  },
];

const state: GameState = {
  coins: 0,
  totalClicks: 0,
  clickPower: 1,
  coinsPerSecond: 0,
  levels: {
    cursor: 0,
    drone: 0,
    mine: 0,
    factory: 0,
  },
  muted: false,
  musicStarted: false,
};

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found.');
}

const heroDesktopUrl = new URL('./assets/pixel-scene/hero-desktop.png', import.meta.url).href;
const heroMobileUrl = new URL('./assets/pixel-scene/hero-mobile.png', import.meta.url).href;
const heroAmbientUrl = new URL('./assets/pixel-scene/hero-ambient.png', import.meta.url).href;
const rootStyle = document.documentElement.style;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

rootStyle.setProperty('--scene-hero-desktop', `url("${heroDesktopUrl}")`);
rootStyle.setProperty('--scene-hero-mobile', `url("${heroMobileUrl}")`);
rootStyle.setProperty('--scene-hero-ambient', `url("${heroAmbientUrl}")`);

const music = new Howl({
  src: [createChiptuneLoopUrl()],
  loop: true,
  volume: 0.32,
  preload: true,
});

const clickSound = new Howl({
  src: [createToneUrl({ frequency: 880, durationMs: 70, volume: 0.22 })],
  volume: 1,
  preload: true,
});

const buySound = new Howl({
  src: [createToneUrl({ frequency: 523.25, durationMs: 90, volume: 0.18 })],
  volume: 1,
  preload: true,
});

let lastTick = performance.now();

app.innerHTML = `
  <main class="shell">
    <section class="hero card">
      <div class="hero__scene" aria-hidden="true">
        <picture class="hero__picture">
          <source srcset="${heroMobileUrl}" media="(max-width: 720px)">
          <img src="${heroDesktopUrl}" alt="" loading="eager" decoding="async">
        </picture>
        <img class="hero__ambient" src="${heroAmbientUrl}" alt="" loading="eager" decoding="async">
      </div>

      <div class="hero__content">
        <div class="title-block">
          <p class="eyebrow">Pixel Clicker</p>
          <h1>Make coins. Buy helpers. Keep it simple.</h1>
          <p class="lede">
            Tap the big coin on mobile or desktop, spend coins in the shop, and keep the
            whole thing browser-based for GitHub Pages.
          </p>
        </div>

        <div class="topbar-actions">
          <button id="mute-button" class="button ghost" type="button" aria-pressed="false">
            Music: On
          </button>
          <div class="stat-pill">
            <span>Coins</span>
            <strong id="coins-stat">0</strong>
          </div>
          <div class="stat-pill">
            <span>Per click</span>
            <strong id="click-stat">1</strong>
          </div>
          <div class="stat-pill">
            <span>Per sec</span>
            <strong id="cps-stat">0.0</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="game-grid">
      <div class="card clicker-panel">
        <p class="panel-label">Tap the coin</p>
        <button id="coin-button" class="coin-button" type="button" aria-label="Tap coin">
          <span class="coin-button__shine"></span>
          <span class="coin-button__title">COIN</span>
          <span class="coin-button__subtitle">Tap me</span>
        </button>

        <div class="tap-stats">
          <div>
            <span class="tap-stats__label">Total clicks</span>
            <strong id="clicks-stat">0</strong>
          </div>
          <div>
            <span class="tap-stats__label">Next goal</span>
            <strong id="goal-stat">15</strong>
          </div>
        </div>
      </div>

      <aside class="card shop-panel">
        <p class="panel-label">Shop</p>
        <div id="shop-list" class="shop-list"></div>
      </aside>
    </section>

    <section class="card footer-card">
      <p>
        No saves yet. Refreshing the page resets the run for now.
      </p>
      <p>
        The button can later become a sprite without changing the rest of the game.
      </p>
    </section>
  </main>
`;

const ui = {
  coinButton: document.querySelector<HTMLButtonElement>('#coin-button'),
  muteButton: document.querySelector<HTMLButtonElement>('#mute-button'),
  coinsStat: document.querySelector<HTMLElement>('#coins-stat'),
  clickStat: document.querySelector<HTMLElement>('#click-stat'),
  cpsStat: document.querySelector<HTMLElement>('#cps-stat'),
  clicksStat: document.querySelector<HTMLElement>('#clicks-stat'),
  goalStat: document.querySelector<HTMLElement>('#goal-stat'),
  shopList: document.querySelector<HTMLElement>('#shop-list'),
};

if (!ui.coinButton || !ui.muteButton || !ui.shopList) {
  throw new Error('Game UI failed to mount.');
}

ui.coinButton.addEventListener('click', () => {
  unlockAudio();
  state.coins += state.clickPower;
  state.totalClicks += 1;
  clickSound.play();
  flashCoin();
  syncUi();
});

ui.muteButton.addEventListener('click', () => {
  state.muted = !state.muted;
  unlockAudio();
  applyMute();
  syncMuteButton();
});

ui.shopList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>('[data-buy]');

  if (!button) {
    return;
  }

  const id = button.dataset.buy as ShopId | undefined;

  if (!id) {
    return;
  }

  buyItem(id);
});

syncUi();
applyMute();
requestAnimationFrame(tick);

if (!prefersReducedMotion) {
  window.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 100;
    const y = (event.clientY / window.innerHeight - 0.5) * 100;

    rootStyle.setProperty('--scene-pointer-x', `${x.toFixed(3)}%`);
    rootStyle.setProperty('--scene-pointer-y', `${y.toFixed(3)}%`);
  });

  window.addEventListener('pointerleave', () => {
    rootStyle.setProperty('--scene-pointer-x', '0%');
    rootStyle.setProperty('--scene-pointer-y', '0%');
  });
}

function tick(now: number): void {
  const deltaSeconds = Math.min(0.2, (now - lastTick) / 1000);
  lastTick = now;

  if (state.coinsPerSecond > 0) {
    state.coins += state.coinsPerSecond * deltaSeconds;
    syncStatsOnly();
    syncShop();
  }

  requestAnimationFrame(tick);
}

function buyItem(id: ShopId): void {
  const item = SHOP_ITEMS.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  const level = state.levels[id];
  const cost = getCost(item, level);

  if (state.coins < cost) {
    return;
  }

  unlockAudio();
  state.coins -= cost;
  state.levels[id] += 1;

  if (id === 'cursor') {
    state.clickPower += 1;
  } else if (id === 'drone') {
    state.coinsPerSecond += 0.5;
  } else if (id === 'mine') {
    state.clickPower += 3;
  } else if (id === 'factory') {
    state.coinsPerSecond += 2.5;
  }

  buySound.play();
  syncUi();
}

function getCost(item: ShopItem, level: number): number {
  return Math.ceil(item.baseCost * item.growth ** level);
}

function syncUi(): void {
  syncStatsOnly();
  syncShop();
  syncMuteButton();
}

function syncStatsOnly(): void {
  if (ui.coinsStat) ui.coinsStat.textContent = formatCurrency(state.coins);
  if (ui.clickStat) ui.clickStat.textContent = formatNumber(state.clickPower);
  if (ui.cpsStat) ui.cpsStat.textContent = state.coinsPerSecond.toFixed(1);
  if (ui.clicksStat) ui.clicksStat.textContent = formatNumber(state.totalClicks);
  if (ui.goalStat) {
    const nextGoal = SHOP_ITEMS[0];
    ui.goalStat.textContent = formatCurrency(getCost(nextGoal, state.levels.cursor));
  }
}

function syncMuteButton(): void {
  const label = state.muted ? 'Music: Off' : 'Music: On';
  ui.muteButton.textContent = label;
  ui.muteButton.setAttribute('aria-pressed', String(state.muted));
}

function syncShop(): void {
  if (!ui.shopList) {
    return;
  }

  ui.shopList.innerHTML = SHOP_ITEMS.map((item) => {
    const level = state.levels[item.id];
    const cost = getCost(item, level);
    const canBuy = state.coins >= cost;

    return `
      <article class="shop-item">
        <div class="shop-item__copy">
          <div class="shop-item__header">
            <h2>${item.name}</h2>
            <span class="mono">Lv ${level}</span>
          </div>
          <p>${item.description}</p>
          <p class="shop-item__effect">${item.effect}</p>
          <p class="shop-item__cost">${formatCurrency(cost)}</p>
        </div>
        <button
          class="button ${canBuy ? 'primary' : 'secondary'} shop-item__buy"
          type="button"
          data-buy="${item.id}"
          ${canBuy ? '' : 'disabled'}
        >
          ${canBuy ? 'Buy' : 'Need more'}
        </button>
      </article>
    `;
  }).join('');
}

function unlockAudio(): void {
  if (!state.musicStarted) {
    music.play();
    state.musicStarted = true;
  }

  applyMute();
}

function applyMute(): void {
  music.mute(state.muted);
  clickSound.mute(state.muted);
  buySound.mute(state.muted);
}

function flashCoin(): void {
  ui.coinButton.classList.remove('coin-button--flash');
  void ui.coinButton.offsetWidth;
  ui.coinButton.classList.add('coin-button--flash');
}
