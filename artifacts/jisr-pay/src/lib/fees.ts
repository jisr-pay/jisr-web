export interface Corridor {
  id: string;
  nameKey: 'bankWire' | 'cashPickup' | 'mobileMoney' | 'jisrStellar';
  feePercent: number;
  feeFixed: number;
  speedMinutes: number;
  method: string;
  isJisr: boolean;
}

/** Illustrative USD fees, not an exchange rate or executable network quote. */
export function calculateTotal(corridor: Corridor, amount: number): number {
  if (![amount, corridor.feePercent, corridor.feeFixed].every(value => Number.isFinite(value) && value >= 0)) {
    throw new Error('Comparison amounts and fees must be finite and non-negative.');
  }
  const total = amount * (corridor.feePercent / 100) + corridor.feeFixed;
  if (!Number.isFinite(total)) throw new Error('Comparison fee exceeds the supported range.');
  return total;
}

export function getBestCorridor(corridors: readonly Corridor[], amount: number): Corridor {
  if (!corridors.length) throw new Error('At least one corridor is required.');
  return corridors.reduce((best, candidate) =>
    calculateTotal(candidate, amount) < calculateTotal(best, amount) ? candidate : best);
}
