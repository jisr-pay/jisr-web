import { AppError } from './errors.ts';
import type { TransferSettlement } from './transfer-history.ts';

/** Read-only lookup; 404 means unknown, not failed. Never broadcasts a transaction. */
export async function fetchSettlement(
  horizonUrl: string,
  hash: string,
  fetcher: typeof fetch = fetch,
): Promise<TransferSettlement | null> {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new AppError('UNKNOWN', 'Invalid transaction hash.');
  let response: Response;
  try {
    response = await fetcher(`${horizonUrl}/transactions/${hash}`, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new AppError('NETWORK', 'Could not check the transfer.');
  }
  if (response.status === 404) return null;
  if (response.status === 429) throw new AppError('RATE_LIMITED', 'Too many confirmation requests.');
  if (!response.ok) throw new AppError('NETWORK', `Confirmation lookup failed (HTTP ${response.status}).`);
  let tx;
  try { tx = await response.json(); } catch {
    throw new AppError('NETWORK', 'The network returned an unreadable confirmation.');
  }
  if (!tx || typeof tx !== 'object' || tx.hash !== hash || typeof tx.successful !== 'boolean' ||
      !Number.isSafeInteger(tx.ledger) || tx.ledger <= 0 ||
      typeof tx.fee_charged !== 'string' || !/^\d+$/.test(tx.fee_charged) ||
      typeof tx.created_at !== 'string' || !Number.isFinite(Date.parse(tx.created_at))) {
    throw new AppError('NETWORK', 'The network returned an invalid confirmation.');
  }
  // A confirmation dated far in the future is malformed, not evidence of
  // settlement. Small clock skew is normal, so allow a few minutes.
  if (Date.parse(tx.created_at) > Date.now() + 5 * 60_000) {
    throw new AppError('NETWORK', 'The network returned an invalid confirmation.');
  }
  const fee = BigInt(tx.fee_charged);
  return { hash, successful: tx.successful, ledger: tx.ledger,
    createdAt: tx.created_at,
    feeCharged: `${fee / 10_000_000n}.${(fee % 10_000_000n).toString().padStart(7, '0')} XLM`,
  };
}
