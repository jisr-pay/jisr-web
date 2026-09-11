import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { enforce, record, retryAfter, RULES, setClock } from './rateLimit.ts';

let now: number;
beforeEach(() => {
  now = 0;
  setClock(() => now);
});

test('first action is allowed; immediate repeats hit the minimum gap', () => {
  assert.equal(retryAfter('scan', RULES.findRoute), 0);
  record('scan');
  assert.equal(retryAfter('scan', RULES.findRoute), RULES.findRoute.minGapMs);
  now = RULES.findRoute.minGapMs;
  assert.equal(retryAfter('scan', RULES.findRoute), 0);
});

test('rolling window cuts off actions beyond maxInWindow', () => {
  const rule = { minGapMs: 0, maxInWindow: 3, windowMs: 60_000 };
  for (let i = 0; i < 3; i++) record('burst');
  assert.ok(retryAfter('burst', rule) > 0);
  // Once the oldest action ages out of the window, capacity returns.
  now = 60_000;
  assert.equal(retryAfter('burst', rule), 0);
});

test('minimum gap wins over window capacity while it is still binding', () => {
  const rule = { minGapMs: 5_000, maxInWindow: 2, windowMs: 60_000 };
  record('pay');
  now = 1_000;
  assert.equal(retryAfter('pay', rule), 4_000);
});

test('enforce records the action only when it is allowed', () => {
  enforce('findRoute', RULES.findRoute);
  assert.throws(() => enforce('findRoute', RULES.findRoute), /Please wait/);
  now = RULES.findRoute.minGapMs;
  enforce('findRoute', RULES.findRoute);
  now += RULES.findRoute.minGapMs;
  enforce('findRoute', RULES.findRoute);
});

test('different actions never limit each other', () => {
  enforce('test:submit', RULES.submitPayment);
  assert.equal(retryAfter('test:route', RULES.findRoute), 0);
});

test('payment rule stays deliberately stricter than route scanning', () => {
  assert.ok(RULES.submitPayment.minGapMs > RULES.findRoute.minGapMs);
  assert.ok(RULES.submitPayment.maxInWindow < RULES.findRoute.maxInWindow);
});
