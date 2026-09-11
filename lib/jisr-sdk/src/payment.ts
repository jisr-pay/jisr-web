// Wallet-free payment orchestration.
//
// `buildAndSubmitPayment` used to live in the web app's stellar.ts, entangled
// with Freighter. Only the two interactions that genuinely require a wallet
// (network guard, signing) are abstracted behind the `PaymentWallet` port; the
// build/submit/confirm flow — and the journaling contract it enforces — lives
// here so the backend can reuse it without a browser.

import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  rpc,
  TransactionBuilder,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { AppError, classifyError } from './errors.ts';
import { createLogger } from './logger.ts';
import { parseAmountToStroops } from './amount.ts';
import { resolveNetworkConfig, type NetworkConfig } from './network-config.ts';

const log = createLogger('payment');

/** Where a Node-compatible signer is plugged in; the SDK never prompts itself. */
export interface PaymentWallet {
  /** Reject with an AppError (e.g. WRONG_NETWORK) when the wallet cannot sign for `config.networkPassphrase`. */
  assertNetwork(config: NetworkConfig): Promise<void>;
  /** Sign an XDR envelope for `publicKey` on the configured network and return the signed base64 XDR. */
  signTransaction(signedTxXdr: string, publicKey: string, config: NetworkConfig): Promise<string>;
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

/** Retries a read-only network call on transient failures with exponential backoff. */
export async function withRetry<T>(
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

// Invokes route_payment(sender, recipient, platform_treasury, token_address, amount)
// on the payment_router contract via Soroban RPC. Every failure throws —
// nothing is simulated.
export async function buildAndSubmitPayment(
  wallet: PaymentWallet,
  network: NetworkConfig,
  senderKey: string,
  recipientKey: string,
  amountXLM: string,
  callbacks: PaymentCallbacks,
): Promise<TransactionResult> {
  const server = new rpc.Server(network.rpcUrl);

  // Validate the amount before anything network-related.
  const stroops = parseAmountToStroops(amountXLM);

  // Stop early if the wallet is on the wrong network.
  await wallet.assertNetwork(network);

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

  const contract = new Contract(network.contractId);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: network.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'route_payment',
        Address.fromString(senderKey).toScVal(),
        Address.fromString(recipientKey).toScVal(),
        Address.fromString(network.treasuryAddress).toScVal(),
        Address.fromString(network.tokenAddress).toScVal(),
        nativeToScVal(stroops, { type: 'i128' }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await withRetry('prepareTransaction', () =>
    server.prepareTransaction(transaction),
  );

  log.info('Requesting signature');
  const signedTxXdr = await wallet.signTransaction(prepared.toXDR(), senderKey, network);
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, network.networkPassphrase);

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
