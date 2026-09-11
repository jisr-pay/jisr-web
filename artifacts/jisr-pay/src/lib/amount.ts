/** Convert a decimal XLM amount without floating-point rounding. */
export function parseAmountToStroops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(?:\.\d{1,7})?$/.test(trimmed)) {
    throw new Error('Enter a positive decimal amount with at most 7 decimal places.');
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const stroops = BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, '0'));
  if (stroops <= 0n) throw new Error('Amount must be greater than zero.');
  if (stroops > 900_000_000_000_000_000n) throw new Error('Amount is too large.');
  return stroops;
}
