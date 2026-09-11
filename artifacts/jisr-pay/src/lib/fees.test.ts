import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal, getBestCorridor, type Corridor } from './fees.ts';

const fixed: Corridor = { id: 'fixed', nameKey: 'bankWire', feePercent: 0, feeFixed: 10, speedMinutes: 60, method: 'example', isJisr: false };
const percentage: Corridor = { ...fixed, id: 'percentage', feePercent: 2, feeFixed: 0 };

test('lowest total fee changes with the amount, even when percentage ranking does not', () => {
  assert.equal(getBestCorridor([fixed, percentage], 100).id, 'percentage');
  assert.equal(getBestCorridor([fixed, percentage], 1000).id, 'fixed');
  assert.equal(calculateTotal({ ...fixed, feePercent: 2 }, 100), 12);
});

test('empty routes and invalid comparison amounts cannot produce misleading quotes', () => {
  assert.throws(() => getBestCorridor([], 100), /corridor/);
  for (const amount of [-1, NaN, Infinity]) assert.throws(() => calculateTotal(fixed, amount));
  assert.throws(() => calculateTotal({ ...fixed, feeFixed: -1 }, 100));
});

test('equal fees preserve the existing corridor order', () => {
  assert.equal(getBestCorridor([fixed, percentage], 500).id, 'fixed');
});
