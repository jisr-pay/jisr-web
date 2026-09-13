import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HISTORY_KEY, applySettlement, isSavedTransfer, readTransfers, saveTransfer, settlementDurationMs,
  type HistoryStorage, type SavedTransfer } from './transfer-history.ts';

function memoryStorage(): HistoryStorage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}
const pending: SavedTransfer = {
  hash: 'a'.repeat(64), sender: 'G' + 'A'.repeat(55), recipient: 'G' + 'B'.repeat(55),
  network: 'TESTNET', asset: 'XLM', amount: '12.0000001', contractId: 'C' + 'A'.repeat(55),
  submittedAt: '2026-09-11T10:00:00.000Z', status: 'pending',
};
const settlement = { hash: pending.hash, successful: true, feeCharged: '0.0000100 XLM',
  ledger: 42, createdAt: '2026-09-11T10:00:05.000Z' };

test('duplicate transaction hashes cannot silently replace saved payment evidence', () => {
  const storage = memoryStorage();
  const raw = JSON.stringify({ version: 1, transfers: [pending, { ...pending, amount: '999' }] });
  storage.setItem(HISTORY_KEY, raw);
  assert.throws(() => readTransfers(storage), /duplicate/);
  assert.throws(() => saveTransfer(storage, pending), /duplicate/);
  assert.equal(storage.getItem(HISTORY_KEY), raw);
});

test('native XLM registrations carry contractId null and keep identity across retries', () => {
  const storage = memoryStorage();
  const native: SavedTransfer = { ...pending, contractId: null };
  assert.ok(isSavedTransfer(native));
  assert.ok(!isSavedTransfer({ ...native, contractId: 'not-a-contract' }));
  saveTransfer(storage, native);
  // An identical retry is accepted; flipping the contract claim on the same hash is not.
  saveTransfer(storage, { ...native });
  assert.throws(() => saveTransfer(storage, { ...native, contractId: 'C' + 'A'.repeat(55) }), /cannot change/);
});

test('incomplete confirmations and invalid accounting fields are rejected', () => {
  for (const patch of [{ status: 'confirmed' }, { ledger: 1.5 }, { feePaid: 'NaN XLM' }, { confirmedAt: 'invalid' }]) {
    assert.throws(() => saveTransfer(memoryStorage(), { ...pending, ...patch } as SavedTransfer), /Invalid transfer/);
  }
});

test('a fresh reader recovers the exact pending transfer after reload', () => {
  const storage = memoryStorage();
  saveTransfer(storage, pending);
  assert.deepEqual(readTransfers(storage), [pending]);
  assert.equal(JSON.parse(storage.getItem(HISTORY_KEY)!).version, 1);
});
test('confirmation updates the same hash and stale callbacks cannot regress it', () => {
  const storage = memoryStorage();
  saveTransfer(storage, pending);
  const confirmed = applySettlement(pending, settlement);
  saveTransfer(storage, confirmed);
  saveTransfer(storage, pending);
  saveTransfer(storage, { ...pending, status: 'failed' });
  assert.deepEqual(readTransfers(storage), [confirmed]);
  assert.equal(settlementDurationMs(confirmed), 5000);
});
test('a timeout does not become failure; definitive failure stays failed on stale pending writes', () => {
  const storage = memoryStorage();
  saveTransfer(storage, pending);
  // No network response: there is no settlement to apply.
  assert.equal(readTransfers(storage)[0].status, 'pending');
  saveTransfer(storage, applySettlement(pending, { ...settlement, successful: false }));
  saveTransfer(storage, pending);
  assert.equal(readTransfers(storage)[0].status, 'failed');
});
test('rejects mismatched confirmations and changed signed payment details', () => {
  const storage = memoryStorage();
  saveTransfer(storage, pending);
  assert.throws(() => applySettlement(pending, { ...settlement, hash: 'b'.repeat(64) }));
  assert.throws(() => saveTransfer(storage, { ...pending, amount: '100' }));
  assert.deepEqual(readTransfers(storage), [pending]);
});
test('corrupt or unsupported storage is preserved rather than silently overwritten', () => {
  for (const raw of ['not json', '{"version":2,"transfers":[]}', '{"version":1,"transfers":[{}]}']) {
    const storage = memoryStorage();
    storage.setItem(HISTORY_KEY, raw);
    assert.throws(() => saveTransfer(storage, pending));
    assert.equal(storage.getItem(HISTORY_KEY), raw);
  }
});
test('storage failures propagate before a caller can broadcast a payment', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } };
  assert.throws(() => saveTransfer(storage, pending), /Quota exceeded/);
});
test('history preserves pending transfers when newer transfers are saved', () => {
  const storage = memoryStorage();
  saveTransfer(storage, pending);
  saveTransfer(storage, { ...pending, hash: 'b'.repeat(64), submittedAt: '2026-09-11T11:00:00.000Z' });
  assert.equal(readTransfers(storage).length, 2);
  assert.equal(readTransfers(storage)[1].hash, pending.hash);
});
