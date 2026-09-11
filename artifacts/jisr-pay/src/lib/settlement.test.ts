import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSettlement } from './settlement.ts';
import { AppError } from './errors.ts';

const hash = 'a'.repeat(64);
const url = 'https://horizon.invalid';
const confirmed = { hash, successful: true, ledger: 42, fee_charged: '100', created_at: '2026-09-11T10:00:05Z' };
const respond = (value: unknown, status = 200): typeof fetch => async () =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

test('lookup only reads the requested hash and attaches a timeout signal', async () => {
  let calls = 0;
  const result = await fetchSettlement(url, hash, async (input, init) => {
    calls++;
    assert.equal(input, `${url}/transactions/${hash}`);
    assert.equal(init?.method, undefined); // GET, never POST
    assert.equal(init?.body, undefined);
    assert.ok(init?.signal instanceof AbortSignal);
    return new Response(JSON.stringify(confirmed));
  });
  assert.equal(calls, 1);
  assert.equal(result?.feeCharged, '0.0000100 XLM');
  assert.equal(result?.successful, true);
});
test('missing transactions remain unknown while explicit network failures remain failures', async () => {
  assert.equal(await fetchSettlement(url, hash, respond({}, 404)), null);
  assert.equal((await fetchSettlement(url, hash, respond({ ...confirmed, successful: false })))?.successful, false);
});
test('connection errors and throttling never become success or an on-chain failure', async () => {
  await assert.rejects(fetchSettlement(url, hash, async () => { throw new Error('offline'); }),
    (error: unknown) => error instanceof AppError && error.code === 'NETWORK');
  await assert.rejects(fetchSettlement(url, hash, respond({}, 429)),
    (error: unknown) => error instanceof AppError && error.code === 'RATE_LIMITED');
  await assert.rejects(fetchSettlement(url, hash, respond({}, 500)));
});
test('malformed, incomplete, and wrong-hash responses cannot confirm a payment', async () => {
  for (const invalid of [null, {}, { ...confirmed, hash: 'b'.repeat(64) },
    { ...confirmed, successful: 'true' }, { ...confirmed, ledger: 0 },
    { ...confirmed, fee_charged: '-1' }, { ...confirmed, created_at: 'invalid' }]) {
    await assert.rejects(fetchSettlement(url, hash, respond(invalid)));
  }
  await assert.rejects(fetchSettlement(url, hash, async () => new Response('invalid json')));
});
test('invalid hashes are rejected before any network access', async () => {
  let called = false;
  await assert.rejects(fetchSettlement(url, '../other', async () => { called = true; return new Response(); }));
  assert.equal(called, false);
});
test('network fee conversion keeps exact stroop precision', async () => {
  const result = await fetchSettlement(url, hash, respond({ ...confirmed, fee_charged: '9007199254740993' }));
  assert.equal(result?.feeCharged, '900719925.4740993 XLM');
});
