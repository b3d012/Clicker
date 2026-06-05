import type { GameState, SavePayload } from './types';

const STORAGE_KEY = 'clicker-starter-save';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(encoded: string): string {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createDefaultState(): GameState {
  return {
    version: 1,
    sparks: 0,
    totalClicks: 0,
    clickPower: 1,
    autoPerSecond: 0,
    upgradeLevels: {
      gloves: 0,
      bot: 0,
      relay: 0,
    },
    lastPlayedAt: Date.now(),
  };
}

export function encodeSave(state: GameState): string {
  const payload: SavePayload = {
    ...state,
    savedAt: Date.now(),
  };

  return toBase64Url(JSON.stringify(payload));
}

export function decodeSave(encoded: string): SavePayload {
  const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<SavePayload>;

  if (parsed.version !== 1) {
    throw new Error('Unsupported save version.');
  }

  return {
    version: 1,
    sparks: Number(parsed.sparks ?? 0),
    totalClicks: Number(parsed.totalClicks ?? 0),
    clickPower: Number(parsed.clickPower ?? 1),
    autoPerSecond: Number(parsed.autoPerSecond ?? 0),
    upgradeLevels: {
      gloves: Number(parsed.upgradeLevels?.gloves ?? 0),
      bot: Number(parsed.upgradeLevels?.bot ?? 0),
      relay: Number(parsed.upgradeLevels?.relay ?? 0),
    },
    lastPlayedAt: Number(parsed.lastPlayedAt ?? Date.now()),
    savedAt: Number(parsed.savedAt ?? Date.now()),
  };
}

export function saveToLocalStorage(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, encodeSave(state));
}

export function loadFromLocalStorage(): GameState | null {
  const encoded = localStorage.getItem(STORAGE_KEY);

  if (!encoded) {
    return null;
  }

  return restoreGameState(decodeSave(encoded));
}

export function loadStateFromLocation(): GameState | null {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('save');

  if (!encoded) {
    return null;
  }

  return restoreGameState(decodeSave(encoded));
}

export function createShareUrl(state: GameState): string {
  const url = new URL(window.location.href);
  url.searchParams.set('save', encodeSave(state));
  return url.toString();
}

export function restoreGameState(payload: SavePayload): GameState {
  return {
    version: 1,
    sparks: Math.max(0, Number(payload.sparks ?? 0)),
    totalClicks: Math.max(0, Number(payload.totalClicks ?? 0)),
    clickPower: Math.max(1, Number(payload.clickPower ?? 1)),
    autoPerSecond: Math.max(0, Number(payload.autoPerSecond ?? 0)),
    upgradeLevels: {
      gloves: Math.max(0, Number(payload.upgradeLevels?.gloves ?? 0)),
      bot: Math.max(0, Number(payload.upgradeLevels?.bot ?? 0)),
      relay: Math.max(0, Number(payload.upgradeLevels?.relay ?? 0)),
    },
    lastPlayedAt: Number.isFinite(payload.lastPlayedAt)
      ? payload.lastPlayedAt
      : Date.now(),
  };
}

export function mergeSavedState(primary: GameState, fallback: GameState): GameState {
  return {
    ...fallback,
    ...primary,
    upgradeLevels: {
      ...fallback.upgradeLevels,
      ...primary.upgradeLevels,
    },
  };
}
