import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import {
  requestAccess,
  signTransaction as freighterSignTransaction,
  getNetworkDetails,
} from '@stellar/freighter-api';
import {
  CONTRACT_ID,
  FEDERATION_API_BASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  TOKEN_ADDRESS,
  TREASURY_ADDRESS,
} from './corridors';
import { createLogger } from './logger';
import { AppError, classifyError } from './errors';
import { parseAmountToStroops } from './amount';
import { fetchSettlement } from './settlement';

const log = createLogger('stellar');

// Retries a read-only network call on transient failures (network blips, RPC
// rate limits) with exponential backoff. Never retries deterministic errors
// like "account not found" or a user rejection.
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  retries = 2,
  baseDelay = 600,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const code = classifyError(e);
      if (code !== 'NETWORK' && code !== 'RATE_LIMITED' && code !== 'TIMEOUT') throw e;
      if (attempt === retries) break;
      const delay = baseDelay * 2 ** attempt;
      log.warn(`${label} transient failure — retrying in ${delay}ms`, { attempt, code });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// Best-effort guard: if Freighter is on a non-testnet network the payment would
// sign against the wrong chain. If we can read the network and it isn't testnet,
// stop early with a clear message. If we can't read it, proceed (signing still
// targets testnet) rather than blocking a legitimate payment.
async function assertTestnetNetwork(): Promise<void> {
  let details;
  try {
    details = await getNetworkDetails();
  } catch {
    return;
  }
  if (details && !details.error && details.networkPassphrase &&
      details.networkPassphrase !== Networks.TESTNET) {
    throw new AppError(
      'WRONG_NETWORK',
      'Freighter is set to the wrong network. Switch it to Test Net and try again.',
    );
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

// Prompts the user to grant access and returns their public key. This call is
// what makes the Freighter popup appear, so it must run directly on the user's
// click. Returns null (rather than throwing) so callers can show a message.
export async function connectFreighter(): Promise<string | null> {
  try {
    const res = await requestAccess();
    if (res.error || !res.address) return null;
    return res.address;
  } catch {
    return null;
  }
}

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
        fetch(`${FEDERATION_API_BASE()}/federation?q=${encodeURIComponent(input)}`, {
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
        throw new AppError('DIRECTORY_UNAVAILABLE', 'The recipient directory is offline. Paste a Stellar public key instead.');
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

export interface TransactionResult {
  hash: string;
  createdAt?: string;
  feePaid: string;
  settlementTimeMs: number;
  ledger: number;
}

export interface PaymentCallbacks {
  /** Must complete before broadcast; a storage error prevents sending. */
  onPending: (result: TransactionResult) => void;
  onFailed: (hash: string) => void;
}

// Invokes route_payment(sender, recipient, platform_treasury, token_address, amount)
// on the deployed payment_router contract via Soroban RPC. Every failure throws —
// nothing is simulated.
export async function buildAndSubmitPayment(
  senderKey: string,
  recipientKey: string,
  amountXLM: string,
  callbacks: PaymentCallbacks,
): Promise<TransactionResult> {
  const server = new rpc.Server(SOROBAN_RPC_URL());

  // Validate the amount before anything network-related.
  const stroops = parseAmountToStroops(amountXLM);

  // Stop early if the wallet is on the wrong network.
  await assertTestnetNetwork();

  log.info('Building payment', { senderKey, recipientKey, stroops: stroops.toString() });

  let account;
  try {
    account = await withRetry('getAccount', () => server.getAccount(senderKey));
  } catch (e) {
    const code = classifyError(e);
    if (code === 'NETWORK' || code === 'RATE_LIMITED' || code === 'TIMEOUT') {
      throw e; // surfaced as a friendly network message upstream
    }
    throw new AppError(
      'NOT_FUNDED',
      `Sender account is not funded on testnet. Fund it at https://friendbot.stellar.org/?addr=${senderKey} and try again.`,
    );
  }

  const contract = new Contract(CONTRACT_ID());
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'route_payment',
        Address.fromString(senderKey).toScVal(),
        Address.fromString(recipientKey).toScVal(),
        Address.fromString(TREASURY_ADDRESS()).toScVal(),
        Address.fromString(TOKEN_ADDRESS()).toScVal(),
        nativeToScVal(stroops, { type: 'i128' }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await withRetry('prepareTransaction', () =>
    server.prepareTransaction(transaction),
  );

  log.info('Requesting signature from Freighter');
  const signResult = await freighterSignTransaction(prepared.toXDR(), {
    networkPassphrase: Networks.TESTNET,
    address: senderKey,
  });
  if (signResult.error) {
    const errStr =
      typeof signResult.error === 'string'
        ? signResult.error
        : JSON.stringify(signResult.error);
    log.warn('Freighter signing failed', errStr);
    throw new AppError(classifyError(errStr), `Freighter could not sign the transaction: ${errStr}`);
  }

  const signedTx = TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    Networks.TESTNET,
  );

  const start = Date.now();
  const pending = {
    hash: signedTx.hash().toString('hex'),
    feePaid: `${(Number(prepared.fee) / 10_000_000).toFixed(7)} XLM`,
    settlementTimeMs: 0,
    ledger: 0,
  };
  // Journal the signed hash before the request. A reload or lost response
  // must leave a recoverable transfer, even if broadcast is interrupted.
  callbacks.onPending(pending);
  log.info('Submitting to Soroban RPC');
  let sendResponse;
  try {
    sendResponse = await server.sendTransaction(signedTx);
  } catch {
    // A lost response does not prove rejection. Preserve the signed hash so
    // confirmation can be retried without submitting a second payment.
    throw new AppError('TIMEOUT', 'Submission response unavailable. Check the transaction before sending again.');
  }
  if (sendResponse.status === 'ERROR') {
    callbacks.onFailed(pending.hash);
    log.error('Soroban RPC rejected transaction', sendResponse);
    throw new AppError(
      'CONTRACT_FAILED',
      `Transaction rejected by Soroban RPC (hash ${sendResponse.hash})`,
    );
  }
  if (sendResponse.status === 'TRY_AGAIN_LATER') {
    callbacks.onFailed(pending.hash);
    throw new AppError('RATE_LIMITED', 'Stellar could not accept the transaction yet. Please try again shortly.');
  }

  let getResponse = await server.getTransaction(sendResponse.hash);
  const deadline = Date.now() + 60_000;
  while (
    getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    Date.now() < deadline
  ) {
    await new Promise((r) => setTimeout(r, 1000));
    getResponse = await server.getTransaction(sendResponse.hash);
  }
  if (getResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
    callbacks.onFailed(pending.hash);
    log.error('Transaction failed on-chain', { hash: sendResponse.hash });
    throw new AppError('CONTRACT_FAILED', `Transaction ${sendResponse.hash} failed on-chain`);
  }
  if (getResponse.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new AppError(
      'TIMEOUT',
      `Timed out waiting for confirmation of transaction ${sendResponse.hash}`,
    );
  }

  log.info('Payment confirmed', { hash: sendResponse.hash, ledger: getResponse.ledger });
  return {
    hash: sendResponse.hash,
    feePaid: `${(Number(prepared.fee) / 10_000_000).toFixed(7)} XLM`,
    settlementTimeMs: Date.now() - start,
    ledger: getResponse.ledger,
  };
}

export interface SettlementRecord {
  hash: string;
  successful: boolean;
  feeCharged: string;
  ledger: number;
  createdAt: string;
}

/** One bounded read; history checks never sign or resubmit a transaction. */
export async function lookupSettlement(hash: string): Promise<SettlementRecord | null> {
  return fetchSettlement(HORIZON_URL(), hash);
}

// Polls Horizon for the confirmed transaction and returns the real on-chain
// fee and ledger. Throws if the transaction failed or never appears.
export async function pollSettlement(
  hash: string,
  onUpdate: (status: string) => void,
): Promise<SettlementRecord> {
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
