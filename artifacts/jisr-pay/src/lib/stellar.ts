// Browser wallet adapter — the app-owned seam between UI and @workspace/jisr-sdk.
//
// The SDK stays wallet-free; everything that touches Freighter, the DOM or
// Vite environment lives here. Product behavior is unchanged: Freighter is
// assumed possibly-present on desktop and the connect attempt is the source
// of truth, only mobile is definitively unsupported.

import {
  requestAccess,
  signTransaction as freighterSignTransaction,
  getNetworkDetails,
} from '@stellar/freighter-api';
import {
  StrKey,
} from '@stellar/stellar-sdk';
import {
  AppError,
  buildAndSubmitPayment,
  classifyError,
  createLogger,
  fetchSettlement,
  withRetry,
  type PaymentCallbacks,
  type PaymentWallet,
  type TransactionResult,
  type TransferSettlement,
} from '@workspace/jisr-sdk';
import { networkConfig } from './network-config.ts';
import { interpretConnectResponse, isDeclineError, type ConnectResult } from './wallet-connect.ts';

const log = createLogger('stellar');

// Prompts the user to grant access and returns their public key. This call is
// what makes the Freighter popup appear, so it must run directly on the user's
// click. Never throws — callers render the outcome through ConnectResult.
export async function connectFreighter(): Promise<ConnectResult> {
  try {
    const res = await requestAccess();
    return interpretConnectResponse(res);
  } catch (e) {
    // Older extension versions reject the promise instead of resolving with an
    // apiError; normalize that path so declines still get their own copy.
    return isDeclineError(e) ? { outcome: 'declined' } : { outcome: 'unavailable' };
  }
}

// On desktop we assume Freighter *may* be present and let the actual connect
// attempt be the source of truth — a pre-check (isConnected) is unreliable and
// silently blocks the popup. Only mobile is treated as definitively unsupported.
export function detectWalletEnvironment(): 'freighter' | 'mobile' | 'none' {
  if (typeof window === 'undefined') return 'none';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) return 'mobile';
  return 'freighter';
}

// Best-effort guard: if Freighter is on a non-testnet network the payment would
// sign against the wrong chain. If we can read the network and it isn't testnet,
// stop early with a clear message. If we can't read it, proceed (signing still
// targets testnet) rather than blocking a legitimate payment.
async function assertTestnetNetwork(networkPassphrase: string): Promise<void> {
  let details;
  try {
    details = await getNetworkDetails();
  } catch {
    return;
  }
  if (details && !details.error && details.networkPassphrase &&
      details.networkPassphrase !== networkPassphrase) {
    throw new AppError(
      'WRONG_NETWORK',
      'Freighter is set to the wrong network. Switch it to Test Net and try again.',
    );
  }
}

// Adapts Freighter to the SDK's PaymentWallet port: no browser code leaks into
// the SDK, and the SDK never imports a wallet directly.
const freighterWallet: PaymentWallet = {
  async assertNetwork(config) {
    await assertTestnetNetwork(config.networkPassphrase);
  },
  async signTransaction(xdr, publicKey, config) {
    const signResult = await freighterSignTransaction(xdr, {
      networkPassphrase: config.networkPassphrase,
      address: publicKey,
    });
    if (signResult.error) {
      const errStr =
        typeof signResult.error === 'string'
          ? signResult.error
          : JSON.stringify(signResult.error);
      log.warn('Freighter signing failed', errStr);
      throw new AppError(classifyError(errStr), `Freighter could not sign the transaction: ${errStr}`);
    }
    return signResult.signedTxXdr;
  },
};

// Same-origin federation path. The upstream service sends no CORS headers, so
// calling it cross-origin would make the browser hide every response (even the
// 404 that says "not registered") behind an opaque network failure. Vite
// proxies /api/federation in dev and preview (vite.config.ts) and Vercel
// rewrites it in production (vercel.json) — the browser only ever talks to us.
const FEDERATION_PROXY_PATH = '/api/federation';

// Resolves a recipient via the stellar-tags federation API.
// Throws if the recipient cannot be resolved — there is no fallback wallet.
export async function resolveFederation(address: string): Promise<string> {
  const input = address.trim();
  if (StrKey.isValidEd25519PublicKey(input)) {
    return input;
  }
  if (input.includes('*')) {
    log.info('Resolving federation address', { input });
    let res: Response;
    try {
      res = await withRetry('federation', () =>
        fetch(`${FEDERATION_PROXY_PATH}?q=${encodeURIComponent(input)}`, {
          signal: AbortSignal.timeout(10_000),
        }),
      );
    } catch (e) {
      log.error('Federation request failed', e);
      throw new AppError(
        'DIRECTORY_UNAVAILABLE',
        'The recipient directory is temporarily unavailable. Try again shortly, or paste the recipient’s Stellar address (G…).',
      );
    }
    if (res.status === 404) {
      const body = await res.text();
      if (body.includes('Application not found')) {
        // The directory answered but this federation name is not registered in
        // it — that is different from the service being down, and the copy and
        // error code must not conflate the two.
        throw new AppError(
          'RECIPIENT_NOT_FOUND',
          `Federation name "${input}" is not registered in the recipient directory. Paste the recipient's Stellar address (G…) instead.`,
        );
      }
      throw new AppError('RECIPIENT_NOT_FOUND', `Recipient "${input}" not found in the federation directory`);
    }
    if (!res.ok) {
      throw new AppError('DIRECTORY_UNAVAILABLE', `Federation lookup failed (HTTP ${res.status})`);
    }
    let record: { account_id?: string };
    try {
      record = await res.json();
    } catch {
      throw new AppError('DIRECTORY_UNAVAILABLE', 'The recipient directory returned an unreadable response.');
    }
    if (!record.account_id || !StrKey.isValidEd25519PublicKey(record.account_id)) {
      throw new AppError('RECIPIENT_NOT_FOUND', 'Federation record did not contain a valid Stellar account');
    }
    log.info('Federation resolved', { account_id: record.account_id });
    return record.account_id;
  }
  throw new AppError(
    'UNKNOWN',
    'Enter a Stellar public key (G…) or a federation address like alice*jisr.pay',
  );
}

// Thin config-adapted wrappers so call sites keep the exact same signatures
// as before the extraction: the network configuration is injected from the
// app's corridors/config module rather than read from the environment inside
// the SDK.
export function buildAndSubmitFreighterPayment(
  senderKey: string,
  recipientKey: string,
  amountXLM: string,
  callbacks: PaymentCallbacks,
): Promise<TransactionResult> {
  return buildAndSubmitPayment(freighterWallet, networkConfig(), senderKey, recipientKey, amountXLM, callbacks);
}

export { type TransactionResult } from '@workspace/jisr-sdk';

export function lookupSettlement(hash: string): Promise<TransferSettlement | null> {
  return fetchSettlement(networkConfig().horizonUrl, hash);
}

// Polls Horizon for the confirmed transaction and returns the real on-chain
// fee and ledger. Throws if the transaction failed or never appears.
export async function pollSettlement(
  hash: string,
  onUpdate: (status: string) => void,
): Promise<TransferSettlement> {
  let attempts = 0;
  const deadline = Date.now() + 30_000;

  while (attempts < 30 && Date.now() < deadline) {
    let tx;
    try {
      tx = await lookupSettlement(hash);
    } catch {
      onUpdate('awaitingSettlement');
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      continue;
    }
    if (!tx) {
      onUpdate('awaitingSettlement');
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      continue;
    }
    if (tx.successful === false) {
      throw new AppError('CONTRACT_FAILED', `Transaction ${hash} failed on-chain (ledger ${tx.ledger})`);
    }
    log.info('Settlement confirmed on Horizon', { hash: tx.hash, ledger: tx.ledger });
    onUpdate('settled');
    return tx;
  }
  throw new AppError('TIMEOUT', 'Settlement timeout — transaction not yet found on Horizon. It may still confirm; check the explorer.');
}
