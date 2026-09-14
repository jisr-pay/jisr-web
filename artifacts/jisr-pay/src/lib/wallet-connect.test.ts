import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectCopy, interpretConnectResponse, isDeclineError } from './wallet-connect.ts';
import { strings } from './i18n.ts';

const DECLINE = { code: -4, message: 'The user rejected this request.' };

test('decline errors are recognized by code -4 regardless of message', () => {
  assert.equal(isDeclineError(DECLINE), true);
  assert.equal(isDeclineError({ code: -4, message: '' }), true);
  assert.equal(isDeclineError({ code: -1, message: 'The wallet encountered an internal error.' }), false);
  assert.equal(isDeclineError(undefined), false);
  assert.equal(isDeclineError(null), false);
  assert.equal(isDeclineError('The user rejected this request.'), false);
});

test('requestAccess results map to the right outcome', () => {
  assert.deepEqual(interpretConnectResponse({ address: 'GABC' }), {
    outcome: 'connected',
    address: 'GABC',
  });
  assert.deepEqual(interpretConnectResponse({ address: '', error: DECLINE }), {
    outcome: 'declined',
  });
  assert.deepEqual(interpretConnectResponse({ address: 'GABC', error: DECLINE }), {
    outcome: 'connected',
    address: 'GABC',
  });
  assert.deepEqual(interpretConnectResponse({ address: '', error: { code: -1, message: 'x' } }), {
    outcome: 'unavailable',
  });
  assert.deepEqual(interpretConnectResponse(undefined), { outcome: 'unavailable' });
  assert.deepEqual(interpretConnectResponse(null), { outcome: 'unavailable' });
});

test('a decline gets its own copy, never the install prompt', () => {
  assert.equal(connectCopy('declined'), 'freighterDeclined');
  assert.equal(connectCopy('unavailable'), 'installFreighter');
});

test('decline copy exists in both languages and differs from the install copy', () => {
  for (const lang of ['en', 'ar'] as const) {
    assert.ok(strings[lang].freighterDeclined.trim().length > 0);
    assert.notEqual(strings[lang].freighterDeclined, strings[lang].installFreighter);
  }
});
