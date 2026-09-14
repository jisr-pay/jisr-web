// Decline detection for the Freighter connect flow.
//
// Kept dependency-free so the classifier and copy selection are unit-testable
// under plain Node (node:test) without importing @stellar/freighter-api, whose
// module graph assumes a browser extension host.

export type ConnectOutcome = 'connected' | 'declined' | 'unavailable';

/** Freighter's decline error shape: { code: -4, message: 'The user rejected this request.' } */
export function isDeclineError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === -4
  );
}

export type ConnectResult =
  | { outcome: 'connected'; address: string }
  | { outcome: 'declined' }
  | { outcome: 'unavailable' };

/** Map a freighter-api requestAccess() result (or a thrown error) to a ConnectResult. */
export function interpretConnectResponse(res: unknown): ConnectResult {
  const r = res as { address?: unknown; error?: unknown } | null | undefined;
  if (r && typeof r === 'object' && typeof r.address === 'string' && r.address.length > 0) {
    return { outcome: 'connected', address: r.address as string };
  }
  if (isDeclineError(r?.error)) return { outcome: 'declined' };
  return { outcome: 'unavailable' };
}

/**
 * UI copy for a failed connect attempt, selected by outcome so a user decline
 * no longer tells them to install an extension they have.
 */
export function connectCopy(outcome: ConnectOutcome): 'freighterDeclined' | 'installFreighter' {
  return outcome === 'declined' ? 'freighterDeclined' : 'installFreighter';
}
