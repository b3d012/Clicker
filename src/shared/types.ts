export type UpgradeId = 'gloves' | 'bot' | 'relay';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  effectLabel: string;
}

export interface GameState {
  version: 1;
  sparks: number;
  totalClicks: number;
  clickPower: number;
  autoPerSecond: number;
  upgradeLevels: Record<UpgradeId, number>;
  lastPlayedAt: number;
}

export interface SavePayload extends GameState {
  savedAt: number;
}
