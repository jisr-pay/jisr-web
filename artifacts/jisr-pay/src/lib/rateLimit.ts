// Client-side rate limiting.
//
// This is a static frontend, so there is no server to enforce limits — but we
// still must not hammer the free external services (the Railway federation API,
// friendbot, Horizon, Soroban RPC) or let a user double-submit a payment by
// mashing a button. This enforces both a minimum gap between actions and a
// maximum number of actions per rolling window, per named action.

import { AppError } from './errors';

interface RateLimitRule {
  /** Minimum milliseconds between two consecutive actions. */
  minGapMs: number;
  /** Maximum number of actions allowed within windowMs. */
  maxInWindow: number;
  windowMs: number;
}

const history: Record<string, number[]> = {};

// Returns the number of ms the caller must wait, or 0 if the action is allowed
// right now. Does NOT record the action — call `record` once you actually run it.
export function retryAfter(action: string, rule: RateLimitRule): number {
  const now = Date.now();
  const times = (history[action] ?? []).filter((t) => now - t < rule.windowMs);
  history[action] = times;

  if (times.length > 0) {
    const sinceLast = now - times[times.length - 1];
    if (sinceLast < rule.minGapMs) return rule.minGapMs - sinceLast;
  }
  if (times.length >= rule.maxInWindow) {
    const oldest = times[0];
    return rule.windowMs - (now - oldest);
  }
  return 0;
}

export function record(action: string): void {
  (history[action] ??= []).push(Date.now());
}

// Convenience: throws a RATE_LIMITED AppError if the action isn't allowed yet,
// otherwise records it and returns. Use to guard an action in one call.
export function enforce(action: string, rule: RateLimitRule): void {
  const wait = retryAfter(action, rule);
  if (wait > 0) {
    throw new AppError(
      'RATE_LIMITED',
      `Please wait ${Math.ceil(wait / 1000)}s before trying again.`,
    );
  }
  record(action);
}

// Shared rules used across the app.
export const RULES = {
  // A full payment: expensive + irreversible, so keep it deliberate.
  submitPayment: { minGapMs: 3000, maxInWindow: 5, windowMs: 60_000 },
  // Corridor scan / route lookup: cheap but shouldn't be spammed.
  findRoute: { minGapMs: 1000, maxInWindow: 15, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;
