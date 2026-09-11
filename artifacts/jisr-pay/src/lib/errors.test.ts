import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, classifyError, isUserRejection, toUserMessage } from './errors.ts';

test('wallet and user-intent errors map to their own codes', () => {
  assert.equal(classifyError(new Error('User declined the request')), 'USER_REJECTED');
  assert.equal(classifyError(new Error('request denied by user')), 'USER_REJECTED');
  assert.equal(classifyError(new Error('Wallet is locked')), 'WALLET_LOCKED');
  assert.equal(classifyError(new Error('Freighter is not installed')), 'WALLET_MISSING');
  assert.equal(classifyError(new Error('wrong network selected')), 'WRONG_NETWORK');
  assert.equal(classifyError(new Error('network passphrase mismatch')), 'WRONG_NETWORK');
});

test('funding, recipient and directory failures stay distinct', () => {
  assert.equal(classifyError(new Error('account not found')), 'NOT_FUNDED');
  assert.equal(classifyError(new Error('insufficient balance')), 'INSUFFICIENT_BALANCE');
  assert.equal(classifyError(new Error('not found in the federation')), 'RECIPIENT_NOT_FOUND');
  assert.equal(classifyError(new Error('federation lookup failed')), 'DIRECTORY_UNAVAILABLE');
});

test('transport failures map to network, rate limit or timeout', () => {
  assert.equal(classifyError(new Error('Failed to fetch')), 'NETWORK');
  assert.equal(classifyError(new TypeError('load failed')), 'NETWORK');
  assert.equal(classifyError(new Error('Request failed with 429')), 'RATE_LIMITED');
  assert.equal(classifyError(new Error('too many requests')), 'RATE_LIMITED');
  assert.equal(classifyError(new Error('transaction timed out')), 'TIMEOUT');
  assert.equal(classifyError(new Error('invocation failed on-chain')), 'CONTRACT_FAILED');
  assert.equal(classifyError(new Error('mysterious failure')), 'UNKNOWN');
  assert.equal(classifyError(undefined), 'UNKNOWN');
});

test('AppError keeps its code through classification and drives isUserRejection', () => {
  const err = new AppError('USER_REJECTED', 'You declined the request in Freighter.');
  assert.equal(classifyError(err), 'USER_REJECTED');
  assert.ok(isUserRejection(err));
  assert.equal(isUserRejection(new Error('timed out')), false);
});

test('known codes get friendly copy; unknown errors keep their human-readable message', () => {
  assert.match(toUserMessage(new AppError('WALLET_LOCKED', 'internal detail')), /locked/);
  assert.equal(toUserMessage(new Error('Recipient account does not exist')), 'Recipient account does not exist');
  assert.equal(toUserMessage(undefined), 'Something went wrong. Please try again.');
});
