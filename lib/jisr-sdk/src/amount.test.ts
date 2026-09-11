import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmountToStroops } from './amount.ts';

test('preserves the exact stroop amount, including large decimal values', () => {
  assert.equal(parseAmountToStroops('0.0000001'), 1n);
  assert.equal(parseAmountToStroops(' 12.3456789 '), 123456789n);
  assert.equal(parseAmountToStroops('89999999999.9999999'), 899999999999999999n);
  assert.equal(parseAmountToStroops('90000000000'), 900000000000000000n);
});

test('rejects invalid or ambiguous values before opening a wallet', () => {
  for (const amount of ['', '0', '-1', 'NaN', 'Infinity', '1e-8', '1e3', '.5', '1.00000001', '90000000000.0000001']) {
    assert.throws(() => parseAmountToStroops(amount), undefined, amount);
  }
});
