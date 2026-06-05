import gsap from 'gsap';
import { Howl } from 'howler';
import './styles.css';
import { clamp, formatCurrency, formatNumber } from './shared/format';
import {
  createDefaultState,
  createShareUrl,
  decodeSave,
  loadFromLocalStorage,
  loadStateFromLocation,
  restoreGameState,
  saveToLocalStorage,
} from './shared/save';
import { createToneUrl } from './shared/audio';
import { getUpgradeCost, UPGRADE_DEFINITIONS } from './shared/upgrades';
import type { GameState, UpgradeId } from './shared/types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found.');
}

let state: GameState = createDefaultState();

const clickTone = new Howl({
  src: [createToneUrl({ frequency: 640, durationMs: 80, volume: 0.16 })],
  volume: 1,
});

const upgradeTone = new Howl({
  src: [createToneUrl({ frequency: 360, durationMs: 120, volume: 0.14 })],
  volume: 1,
});

let lastFrame = performance.now();
let lastSavedAt = 0;

interface UiRefs {
  tapButton: HTMLButtonElement | null;
  sparksValue: HTMLElement | null;
  totalClicksValue: HTMLElement | null;
  autoPerSecondValue: HTMLElement | null;
  clickPowerValue: HTMLElement | null;
  upgradeTotalValue: HTMLElement | null;
  upgradeList: HTMLElement | null;
  saveField: HTMLTextAreaElement | null;
  saveStatus: HTMLElement | null;
  exportButton: HTMLButtonElement | null;
  copyButton: HTMLButtonElement | null;
  importButton: HTMLButtonElement | null;
}

const ui: UiRefs = {
  tapButton: null,
  sparksValue: null,
  totalClicksValue: null,
  autoPerSecondValue: null,
  clickPowerValue: null,
  upgradeTotalValue: null,
  upgradeList: null,
  saveField: null,
  saveStatus: null,
  exportButton: null,
  copyButton: null,
  importButton: null,
};

state = loadInitialState();
renderShell();
cacheUi();
bindEvents();
syncAllUi();
animateIntro();
requestAnimationFrame(tick);

function renderShell(): void {
  app.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="card hero-card">
          <div class="eyebrow">Indie clicker starter for GitHub Pages</div>
          <h1 class="title">A browser-native clicker with a multi-framework sandbox.</h1>
          <p class="lede">
            This starter is designed to stay static, ship through GitHub Pages, and keep
            the save system entirely client-side. Export the current run as a shareable
            URL, import it back in, or keep a local backup as you iterate.
          </p>

          <div class="hero-actions">
            <a class="button primary" href="#game">Play the build</a>
            <a class="button secondary" href="#save">Save tools</a>
            <a class="button ghost" href="#frameworks">Framework labs</a>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-value" data-stat="sparks">0 sparks</span>
              <span class="stat-caption">Current sparks</span>
            </div>
            <div class="stat">
              <span class="stat-value" data-stat="clicks">0</span>
              <span class="stat-caption">Total taps</span>
            </div>
            <div class="stat">
              <span class="stat-value" data-stat="auto">0.0</span>
              <span class="stat-caption">Auto sparks / sec</span>
            </div>
          </div>
        </div>

        <div class="stack-grid">
          <div class="card micro-card">
            <span class="micro-label">What is included</span>
            <p class="lede">
              TypeScript, Vite, React, Vue, Svelte, Phaser, PixiJS, GSAP, and Howler are
              all wired into the starter as separate surfaces so we can pick the best one
              later without a rewrite.
            </p>
          </div>
          <div class="card micro-card">
            <span class="micro-label">Deployment shape</span>
            <p class="lede">
              The site is built as a static multi-page app with a relative base path, which
              keeps it friendly for GitHub Pages hosting.
            </p>
          </div>
        </div>
      </section>

      <section id="game" class="game-layout">
        <div class="card panel">
          <h2>Core Clicker</h2>
          <p>
            Tap the core, buy upgrades, and watch the idle production layer in. The game
            state is saved locally and can be exported into a shareable URL.
          </p>

          <div class="clicker-core">
            <div class="core-orb">
              <button id="tap-core" class="core-button" type="button">
                Tap the Core
              </button>
            </div>
            <div class="counter">
              <strong data-stat="currency">0 sparks</strong>
              <span data-stat="click-power">Click power: 1 per tap</span>
            </div>
          </div>
        </div>

        <div class="card panel">
          <h2>Upgrades</h2>
          <p>These are intentionally simple starter systems so the architecture stays easy to extend.</p>
          <div class="upgrade-list" id="upgrade-list"></div>
        </div>
      </section>

      <section id="save" class="game-layout">
        <div class="card panel">
          <h2>Export / Import Saves</h2>
          <p>
            Export creates a full share URL. Import accepts either the full URL or the raw
            encoded save payload.
          </p>

          <div class="save-grid">
            <textarea
              id="save-field"
              spellcheck="false"
              placeholder="Your save URL or encoded payload will appear here..."
            ></textarea>
            <div class="save-row">
              <button id="export-save" class="button primary" type="button">Export save</button>
              <button id="copy-save" class="button secondary" type="button">Copy</button>
              <button id="import-save" class="button ghost" type="button">Import</button>
            </div>
            <p id="save-status" class="mono">Local save active.</p>
          </div>
        </div>

        <div class="card panel">
          <h2>Local Progress</h2>
          <p>
            This starter keeps a backup in localStorage, so your test runs survive refreshes
            even before the share URL comes into play.
          </p>
          <div class="stat-row">
            <div class="stat">
              <span class="stat-value" data-stat="tap-strength">1</span>
              <span class="stat-caption">Tap strength</span>
            </div>
            <div class="stat">
              <span class="stat-value" data-stat="auto-income">0</span>
              <span class="stat-caption">Auto income</span>
            </div>
            <div class="stat">
              <span class="stat-value" data-stat="upgrades">0</span>
              <span class="stat-caption">Purchased upgrades</span>
            </div>
          </div>
        </div>
      </section>

      <section id="frameworks" class="game-layout">
        <div class="card panel">
          <h2>Framework Labs</h2>
          <p>
            Each library gets its own page so the starter can experiment without coupling
            all the runtimes together.
          </p>
          <div class="link-grid">
            ${renderLink('./react.html', 'React', 'Component playground')}
            ${renderLink('./vue.html', 'Vue', 'Reactive UI playground')}
            ${renderLink('./svelte.html', 'Svelte', 'Compiled UI playground')}
            ${renderLink('./phaser.html', 'Phaser', 'Game scene playground')}
            ${renderLink('./pixi.html', 'PixiJS', 'Canvas effects playground')}
          </div>
          <p class="footer-note">
            GSAP and Howler are already active in the main build so we can keep the landing
            page feeling alive while the engine choice settles.
          </p>
        </div>

        <div class="card panel">
          <h2>Starter Notes</h2>
          <p>
            The live build is intentionally plain TypeScript at the center, because that keeps
            the GitHub Pages path simple. When we pick a long-term runtime, the game shell can
            adopt it gradually.
          </p>
        </div>
      </section>
    </main>
  `;
}

function cacheUi(): void {
  ui.tapButton = app.querySelector<HTMLButtonElement>('#tap-core');
  ui.sparksValue = app.querySelector<HTMLElement>('[data-stat="sparks"]');
  ui.totalClicksValue = app.querySelector<HTMLElement>('[data-stat="clicks"]');
  ui.autoPerSecondValue = app.querySelector<HTMLElement>('[data-stat="auto"]');
  ui.clickPowerValue = app.querySelector<HTMLElement>('[data-stat="click-power"]');
  ui.upgradeTotalValue = app.querySelector<HTMLElement>('[data-stat="upgrades"]');
  ui.upgradeList = app.querySelector<HTMLElement>('#upgrade-list');
  ui.saveField = app.querySelector<HTMLTextAreaElement>('#save-field');
  ui.saveStatus = app.querySelector<HTMLElement>('#save-status');
  ui.exportButton = app.querySelector<HTMLButtonElement>('#export-save');
  ui.copyButton = app.querySelector<HTMLButtonElement>('#copy-save');
  ui.importButton = app.querySelector<HTMLButtonElement>('#import-save');
}

function bindEvents(): void {
  ui.tapButton?.addEventListener('click', handleTap);
  ui.exportButton?.addEventListener('click', handleExport);
  ui.copyButton?.addEventListener('click', handleCopy);
  ui.importButton?.addEventListener('click', handleImport);
}

function syncAllUi(): void {
  syncStats();
  syncUpgradePanel();
  syncSaveField();
}

function syncStats(): void {
  if (ui.sparksValue) ui.sparksValue.textContent = formatCurrency(state.sparks);
  if (ui.totalClicksValue) ui.totalClicksValue.textContent = formatNumber(state.totalClicks);
  if (ui.autoPerSecondValue) ui.autoPerSecondValue.textContent = state.autoPerSecond.toFixed(1);
  if (ui.clickPowerValue) {
    ui.clickPowerValue.textContent = `Click power: ${formatNumber(state.clickPower)} per tap`;
  }
  if (ui.upgradeTotalValue) {
    const totalUpgrades =
      state.upgradeLevels.gloves + state.upgradeLevels.bot + state.upgradeLevels.relay;
    ui.upgradeTotalValue.textContent = formatNumber(totalUpgrades);
  }
}

function syncUpgradePanel(): void {
  if (!ui.upgradeList) {
    return;
  }

  if (!ui.upgradeList.hasChildNodes()) {
    ui.upgradeList.innerHTML = UPGRADE_DEFINITIONS.map(renderUpgradeCard).join('');
    ui.upgradeList.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.upgrade as UpgradeId | undefined;

        if (id) {
          handleBuyUpgrade(id);
        }
      });
    });
    return;
  }

  for (const upgrade of UPGRADE_DEFINITIONS) {
    const level = state.upgradeLevels[upgrade.id];
    const cost = getUpgradeCost(upgrade.id, level);
    const canBuy = state.sparks >= cost;

    const levelNode = ui.upgradeList.querySelector<HTMLElement>(`[data-upgrade-level="${upgrade.id}"]`);
    const costNode = ui.upgradeList.querySelector<HTMLElement>(`[data-upgrade-cost="${upgrade.id}"]`);
    const button = ui.upgradeList.querySelector<HTMLButtonElement>(
      `[data-upgrade-button="${upgrade.id}"]`,
    );

    if (levelNode) levelNode.textContent = `Lv ${level}`;
    if (costNode) costNode.textContent = `Cost ${formatCurrency(cost)}`;
    if (button) {
      button.disabled = !canBuy;
      button.className = `button ${canBuy ? 'primary' : 'secondary'}`;
      button.textContent = canBuy ? 'Buy' : 'Need more sparks';
    }
  }
}

function syncSaveField(): void {
  if (ui.saveField) {
    ui.saveField.value = createShareUrl(state);
  }
}

function handleTap(): void {
  state.sparks += state.clickPower;
  state.totalClicks += 1;
  clickTone.play();
  pulse(ui.tapButton);
  persistState();
  syncAllUi();
}

function handleBuyUpgrade(id: UpgradeId): void {
  const level = state.upgradeLevels[id];
  const cost = getUpgradeCost(id, level);

  if (state.sparks < cost) {
    return;
  }

  state.sparks -= cost;
  state.upgradeLevels[id] = level + 1;

  if (id === 'gloves') {
    state.clickPower += 1;
  } else if (id === 'bot') {
    state.autoPerSecond += 0.5;
  } else if (id === 'relay') {
    state.clickPower += 3;
  }

  upgradeTone.play();
  persistState();
  syncAllUi();
}

async function handleExport(): Promise<void> {
  const shareUrl = createShareUrl(state);

  if (ui.saveField) {
    ui.saveField.value = shareUrl;
  }

  setSaveStatus('Save exported to a shareable URL.');

  try {
    await navigator.clipboard.writeText(shareUrl);
    setSaveStatus('Save exported and copied to clipboard.');
  } catch {
    setSaveStatus('Save exported. Clipboard access was not available.');
  }
}

async function handleCopy(): Promise<void> {
  const value = ui.saveField?.value.trim();

  if (!value) {
    setSaveStatus('Nothing to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setSaveStatus('Copied save payload.');
  } catch {
    setSaveStatus('Clipboard access was blocked.');
  }
}

function handleImport(): void {
  const rawInput = ui.saveField?.value.trim() ?? '';

  if (!rawInput) {
    setSaveStatus('Paste a save URL or payload first.');
    return;
  }

  try {
    state = parseImportInput(rawInput);
    persistState();
    syncAllUi();
    setSaveStatus('Save imported successfully.');
  } catch (error) {
    setSaveStatus(error instanceof Error ? error.message : 'That save could not be imported.');
  }
}

function tick(now: number): void {
  const deltaSeconds = Math.min(0.2, (now - lastFrame) / 1000);
  lastFrame = now;

  if (state.autoPerSecond > 0) {
    state.sparks += state.autoPerSecond * deltaSeconds;
    syncStats();
    syncUpgradePanel();
  }

  if (now - lastSavedAt > 1000) {
    persistState();
    lastSavedAt = now;
  }

  requestAnimationFrame(tick);
}

function persistState(): void {
  state.sparks = clamp(state.sparks, 0, Number.POSITIVE_INFINITY);
  saveToLocalStorage(state);
}

function loadInitialState(): GameState {
  try {
    const locationState = loadStateFromLocation();

    if (locationState) {
      return locationState;
    }
  } catch {
    // Ignore malformed URL saves and fall through to local storage.
  }

  try {
    const storedState = loadFromLocalStorage();

    if (storedState) {
      return storedState;
    }
  } catch {
    // Ignore malformed local storage data and fall through to a fresh save.
  }

  return createDefaultState();
}

function parseImportInput(rawInput: string): GameState {
  let encoded = rawInput;

  try {
    const url = new URL(rawInput);
    const urlSave = url.searchParams.get('save');

    if (!urlSave) {
      throw new Error('That URL does not contain a save payload.');
    }

    encoded = urlSave;
  } catch {
    // The input is already the raw encoded save payload.
  }

  return restoreGameState(decodeSave(encoded));
}

function renderUpgradeCard(upgrade: (typeof UPGRADE_DEFINITIONS)[number]): string {
  const level = state.upgradeLevels[upgrade.id];
  const cost = getUpgradeCost(upgrade.id, level);
  const canBuy = state.sparks >= cost;

  return `
    <div class="upgrade">
      <div>
        <h3>${upgrade.name} <span class="mono" data-upgrade-level="${upgrade.id}">Lv ${level}</span></h3>
        <small>${upgrade.description}</small>
        <small data-upgrade-cost="${upgrade.id}">Cost ${formatCurrency(cost)}</small>
      </div>
      <button
        class="button ${canBuy ? 'primary' : 'secondary'}"
        type="button"
        data-upgrade-button="${upgrade.id}"
        data-upgrade="${upgrade.id}"
        ${canBuy ? '' : 'disabled'}
      >
        ${canBuy ? 'Buy' : 'Need more sparks'}
      </button>
    </div>
  `;
}

function renderLink(href: string, title: string, caption: string): string {
  return `
    <a class="link-chip" href="${href}">
      <strong>${title}</strong>
      <span>${caption}</span>
    </a>
  `;
}

function pulse(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  gsap.fromTo(
    element,
    { scale: 1 },
    { scale: 1.03, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' },
  );
}

function animateIntro(): void {
  gsap.from('.hero-card, .panel', {
    opacity: 0,
    y: 24,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out',
  });
}

function setSaveStatus(message: string): void {
  if (ui.saveStatus) {
    ui.saveStatus.textContent = message;
  }
}
