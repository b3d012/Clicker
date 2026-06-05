export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Math.abs(value) < 1000) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let scaled = value;
  let unitIndex = -1;

  while (Math.abs(scaled) >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${units[unitIndex]}`;
}

export function formatCurrency(value: number): string {
  return `${formatNumber(value)} sparks`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
