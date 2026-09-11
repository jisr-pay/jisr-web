import { parseAmountToStroops } from './amount.ts';

export const HISTORY_KEY = 'jisr-pay:transfers:v1';
export type TransferStatus = 'pending' | 'confirmed' | 'failed';

export interface SavedTransfer {
  hash: string;
  network: 'TESTNET';
  asset: 'XLM';
  sender: string;
  recipient: string;
  amount: string;
  contractId: string;
  submittedAt: string;
  status: TransferStatus;
  confirmedAt?: string;
  feePaid?: string;
  ledger?: number;
}

export interface HistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const accountPattern = /^G[A-Z2-7]{55}$/;
const contractPattern = /^C[A-Z2-7]{55}$/;
const dateIsValid = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

export function isSavedTransfer(value: unknown): value is SavedTransfer {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<SavedTransfer>;
  if (typeof record.hash !== 'string' || !/^[a-f0-9]{64}$/.test(record.hash) ||
      record.network !== 'TESTNET' || record.asset !== 'XLM' ||
      typeof record.sender !== 'string' || !accountPattern.test(record.sender) ||
      typeof record.recipient !== 'string' || !accountPattern.test(record.recipient) ||
      typeof record.contractId !== 'string' || !contractPattern.test(record.contractId) ||
      !dateIsValid(record.submittedAt) || typeof record.amount !== 'string' ||
      !['pending', 'confirmed', 'failed'].includes(record.status ?? '')) return false;
  try { parseAmountToStroops(record.amount); } catch { return false; }
  if (record.feePaid !== undefined && !/^\d+\.\d{7} XLM$/.test(record.feePaid)) return false;
  if (record.ledger !== undefined && (!Number.isSafeInteger(record.ledger) || record.ledger <= 0)) return false;
  if (record.confirmedAt !== undefined && !dateIsValid(record.confirmedAt)) return false;
  return record.status !== 'confirmed' ||
    (record.confirmedAt !== undefined && record.feePaid !== undefined && record.ledger !== undefined);
}

export function readTransfers(storage: HistoryStorage): SavedTransfer[] {
  const raw = storage.getItem(HISTORY_KEY);
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' ||
      (data as { version?: unknown }).version !== 1 ||
      !Array.isArray((data as { transfers?: unknown }).transfers)) {
    throw new Error('Saved transfer history cannot be read.');
  }
  const records = (data as { transfers: unknown[] }).transfers;
  // Do not overwrite a damaged/unsupported journal with an empty history.
  if (!records.every(isSavedTransfer)) throw new Error('Saved transfer history contains invalid records.');
  if (new Set(records.map(record => record.hash)).size !== records.length) {
    throw new Error('Saved transfer history contains duplicate transaction hashes.');
  }
  return records.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

export function saveTransfer(storage: HistoryStorage, record: SavedTransfer): SavedTransfer[] {
  if (!isSavedTransfer(record)) throw new Error('Invalid transfer record.');
  const records = readTransfers(storage);
  const existing = records.find(item => item.hash === record.hash);
  if (existing && ['sender', 'recipient', 'amount', 'contractId', 'network', 'asset', 'submittedAt']
      .some(key => existing[key as keyof SavedTransfer] !== record[key as keyof SavedTransfer])) {
    throw new Error('Transfer details cannot change after signing.');
  }
  // A delayed callback must not replace a confirmed result with pending/failed.
  // A later network confirmation can correct a previously recorded failure.
  const next = existing && (existing.status === 'confirmed' ||
    (existing.status === 'failed' && record.status === 'pending')) ? existing : record;
  const updated = [next, ...records.filter(item => item.hash !== record.hash)]
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  storage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, transfers: updated }));
  return updated;
}

export interface TransferSettlement {
  hash: string;
  successful: boolean;
  feeCharged: string;
  ledger: number;
  createdAt: string;
}

export function applySettlement(record: SavedTransfer, settlement: TransferSettlement): SavedTransfer {
  if (record.hash !== settlement.hash) throw new Error('Confirmation belongs to a different transfer.');
  const updated: SavedTransfer = { ...record,
    status: settlement.successful ? 'confirmed' : 'failed',
    feePaid: settlement.feeCharged,
    ledger: settlement.ledger,
    confirmedAt: settlement.createdAt,
  };
  if (!isSavedTransfer(updated)) throw new Error('Invalid transfer confirmation.');
  return updated;
}

/** Receipt duration is based on recorded network confirmation, not the time of a retry. */
export function settlementDurationMs(record: SavedTransfer): number {
  return record.confirmedAt
    ? Math.max(0, Date.parse(record.confirmedAt) - Date.parse(record.submittedAt)) : 0;
}
