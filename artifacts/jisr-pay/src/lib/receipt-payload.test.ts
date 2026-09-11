import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  receiptFilename,
  truncateHash,
  truncateText,
  settlementSecondsLabel,
} from './receipt-payload.ts';

const hash =
  'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12';

test('receipt filename pins the first 8 hash characters', () => {
  assert.equal(receiptFilename(hash), 'jisr-pay-receipt-ab12cd34.pdf');
  // Different hashes must not collide on the first 8 characters here.
  assert.notEqual(
    receiptFilename('ff' + hash.slice(2)),
    receiptFilename(hash),
  );
});

test('hash truncation keeps head and tail and elides the middle', () => {
  assert.equal(truncateHash(hash), `${hash.slice(0, 16)}...${hash.slice(-8)}`);
  assert.match(truncateHash(hash), /\.\.\./);
  assert.equal(truncateHash(hash, 4, 4).length, 4 + 3 + 4);
});

test('recipient truncation never exceeds the cap and keeps short text intact', () => {
  assert.equal(truncateText('GABC', 28), 'GABC');
  // Exactly at the cap: unchanged, no ellipsis.
  assert.equal(truncateText('a'.repeat(28), 28), 'a'.repeat(28));
  // One over the cap: cut to exactly 28 characters ending in ellipsis.
  const long = 'b'.repeat(40);
  assert.equal(truncateText(long, 28).length, 28);
  assert.ok(truncateText(long, 28).endsWith('...'));
});

test('settlement time renders one decimal regardless of precision', () => {
  assert.equal(settlementSecondsLabel(0), '0.0 seconds');
  assert.equal(settlementSecondsLabel(5), '5.0 seconds');
  assert.equal(settlementSecondsLabel(4.849), '4.8 seconds');
  assert.equal(settlementSecondsLabel(1.25), '1.3 seconds');
});
