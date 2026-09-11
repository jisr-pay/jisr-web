// Maps raw errors (from the Stellar SDK, Freighter, fetch, etc.) to short,
// actionable messages safe to show a user. Keeps raw technical strings out of
// the UI while preserving anything we already wrote as human-readable.

export type ErrorCode =
  | 'USER_REJECTED'
  | 'WALLET_LOCKED'
  | 'WALLET_MISSING'
  | 'WRONG_NETWORK'
  | 'NOT_FUNDED'
  | 'INSUFFICIENT_BALANCE'
  | 'RECIPIENT_NOT_FOUND'
  | 'DIRECTORY_UNAVAILABLE'
  | 'NETWORK'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'CONTRACT_FAILED'
  | 'UNKNOWN';

// A typed error we throw ourselves when we already know the exact cause.
export class AppError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

const FRIENDLY: Partial<Record<ErrorCode, string>> = {
  USER_REJECTED: 'You declined the request in Freighter. Approve it to continue.',
  WALLET_LOCKED: 'Your Freighter wallet is locked. Open the extension, unlock it, then try again.',
  WALLET_MISSING: 'Freighter wallet not found. Install the extension and reload the page.',
  WRONG_NETWORK: 'Freighter is set to the wrong network. Switch it to Test Net and try again.',
  DIRECTORY_UNAVAILABLE: 'The recipient directory is temporarily unavailable. Try again in a moment, or paste the recipient’s Stellar address (G…).',
  NETWORK: 'Network error reaching the Stellar network. Check your connection and try again.',
  RATE_LIMITED: 'Too many requests in a short time. Please wait a few seconds and try again.',
  TIMEOUT: 'The network took too long to confirm. Your payment may still have gone through — check the explorer before retrying.',
};

// Classify an unknown error into a code we can message consistently.
export function classifyError(err: unknown): ErrorCode {
  if (err instanceof AppError) return err.code;
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();

  if (!msg) return 'UNKNOWN';
  if (msg.includes('user declined') || msg.includes('user rejected') || msg.includes('rejected by the user') || msg.includes('denied')) return 'USER_REJECTED';
  if (msg.includes('locked') || msg.includes('not allowed to') || msg.includes('unlock')) return 'WALLET_LOCKED';
  if (msg.includes('freighter') && (msg.includes('not found') || msg.includes('not installed') || msg.includes('missing'))) return 'WALLET_MISSING';
  if (msg.includes('wrong network') || msg.includes('network passphrase') || msg.includes('different network')) return 'WRONG_NETWORK';
  if (msg.includes('not funded') || msg.includes('account not found') || msg.includes('friendbot')) return 'NOT_FUNDED';
  if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('underfunded')) return 'INSUFFICIENT_BALANCE';
  if (msg.includes('not found in the federation') || msg.includes('name tag not found')) return 'RECIPIENT_NOT_FOUND';
  if (msg.includes('federation lookup failed') || msg.includes('directory')) return 'DIRECTORY_UNAVAILABLE';
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed') || msg.includes('err_') || msg.includes('econn')) return 'NETWORK';
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) return 'RATE_LIMITED';
  if (msg.includes('timed out') || msg.includes('timeout')) return 'TIMEOUT';
  if (msg.includes('failed on-chain') || msg.includes('rejected by soroban') || msg.includes('contract')) return 'CONTRACT_FAILED';
  return 'UNKNOWN';
}

// Returns a user-facing message for any thrown value. If we don't have a
// friendly override for the code, we fall back to the original message (our
// own thrown messages are already written for humans).
export function toUserMessage(err: unknown): string {
  const code = classifyError(err);
  if (FRIENDLY[code]) return FRIENDLY[code] as string;
  const raw = err instanceof Error ? err.message : String(err ?? '');
  return raw || 'Something went wrong. Please try again.';
}

export function isUserRejection(err: unknown): boolean {
  return classifyError(err) === 'USER_REJECTED';
}
