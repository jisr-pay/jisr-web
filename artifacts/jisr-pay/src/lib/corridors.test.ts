import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORRIDORS, formatSpeed } from './corridors.ts';
import { calculateTotal, getBestCorridor } from './fees.ts';

test('corridor catalogue stays inside its advertised envelope', () => {
  assert.ok(CORRIDORS.length >= 4, 'the comparison needs at least the four advertised methods');
  const ids = CORRIDORS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'corridor ids must be unique');
  assert.equal(CORRIDORS.filter((c) => c.isJisr).length, 1, 'exactly one Jisr route');
  for (const c of CORRIDORS) {
    assert.ok(c.feePercent >= 0 && c.feeFixed >= 0 && c.speedMinutes >= 0, `${c.id} needs non-negative pricing`);
    assert.ok(c.feePercent <= 20 && c.feeFixed <= 100, `${c.id} fee looks implausible — update deliberately`);
  }
});

test('the Jisr route is the cheapest for realistic remittance amounts', () => {
  for (const amount of [10, 50, 200, 500, 1000, 5000]) {
    const best = getBestCorridor(CORRIDORS, amount);
    assert.equal(best.isJisr, true, `at $${amount}, best corridor should be Jisr, got ${best.id}`);
  }
});

test('Jisr dominates every competitor on both fee dimensions', () => {
  const jisr = CORRIDORS.find((c) => c.isJisr)!;
  for (const c of CORRIDORS.filter((x) => !x.isJisr)) {
    assert.ok(
      jisr.feePercent <= c.feePercent && jisr.feeFixed <= c.feeFixed,
      `${c.id} must not undercut Jisr on either fee dimension`,
    );
  }
});

test('illustrative savings copy matches the actual fee math', () => {
  const jisr = CORRIDORS.find((c) => c.isJisr)!;
  const bankWire = CORRIDORS.find((c) => c.nameKey === 'bankWire')!;
  assert.equal(jisr.feePercent, 0.4);
  assert.equal(bankWire.feePercent, 6.5);
  assert.equal(bankWire.feeFixed, 15);
  // 6.5% + $15 vs 0.4% flat on $500: 47.5 vs 2 — the advertised saving.
  assert.equal(calculateTotal(bankWire, 500), 47.5);
  assert.equal(calculateTotal(jisr, 500), 2);
});

test('speeds render human-readable and Jisr stays the fastest route', () => {
  assert.equal(formatSpeed(0.083), '~5s');
  assert.equal(formatSpeed(15), '15min');
  assert.equal(formatSpeed(90), '2hr');
  assert.equal(formatSpeed(2880), '2d');
  const jisr = CORRIDORS.find((c) => c.isJisr)!;
  for (const c of CORRIDORS) assert.ok(c.speedMinutes >= jisr.speedMinutes, `${c.id} cannot be faster than Jisr`);
});
