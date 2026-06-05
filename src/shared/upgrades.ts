import type { UpgradeDefinition, UpgradeId } from './types';

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'gloves',
    name: 'Fingerless Gloves',
    description: 'Add a little extra grip and gain +1 spark per click.',
    baseCost: 15,
    costGrowth: 1.28,
    effectLabel: '+1 click power',
  },
  {
    id: 'bot',
    name: 'Pocket Click Bot',
    description: 'A tiny automaton that produces sparks on its own.',
    baseCost: 60,
    costGrowth: 1.34,
    effectLabel: '+0.5 sparks/sec',
  },
  {
    id: 'relay',
    name: 'Neon Relay',
    description: 'Turns every tap into a brighter burst of momentum.',
    baseCost: 160,
    costGrowth: 1.4,
    effectLabel: '+3 click power',
  },
];

export function getUpgradeCost(id: UpgradeId, level: number): number {
  const upgrade = UPGRADE_DEFINITIONS.find((entry) => entry.id === id);

  if (!upgrade) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil(upgrade.baseCost * upgrade.costGrowth ** level);
}
