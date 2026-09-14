// Direct contract tests for buildAndSubmitPayment.
//
// The Soroban RPC boundary arrives through the injectable `options.rpcServer`
// parameter, so each test supplies a plain fake object — no prototype
// patching, no real network. Everything else runs for real: account, build,
// simulated prepare, wallet signing through the PaymentWallet port, and the
// real SHA-256 transaction hash. Each named failure path pins its AppError
// code, its user-facing message, and the observable callback state.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  Account,
  Keypair,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk';
import { buildAndSubmitPayment, type NetworkConfig, type PaymentCallbacks, type PaymentWallet } from './payment.ts';
import { AppError } from './errors.ts';
import { TESTNET_PASSPHRASE } from './network-config.ts';
import { isSavedTransfer } from './transfer-history.ts';

const sender = Keypair.random();
const recipient = Keypair.random();

const config: NetworkConfig = {
  contractId: 'CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER',
  treasuryAddress: 'GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST',
  tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  federationUrl: 'https://federation.invalid',
  rpcUrl: 'https://rpc.invalid',
  horizonUrl: 'https://horizon.invalid',
  networkPassphrase: TESTNET_PASSPHRASE,
  network: 'TESTNET',
};

const wallet: PaymentWallet = {
  async assertNetwork(c) {
    if (c.networkPassphrase !== TESTNET_PASSPHRASE) throw new AppError('WRONG_NETWORK', 'wrong network');
  },
  async signTransaction(xdr) {
    return xdr;
  },
};

const account = () => new Account(sender.publicKey(), '100');

const getTx = (status: string) => ({ status }) as unknown as rpc.Api.GetTransactionResponse;

/** The four RPC methods buildAndSubmitPayment uses; fakes override exactly these. */
type RpcOverrides = Partial<Record<'getAccount' | 'prepareTransaction' | 'sendTransaction' | 'getTransaction', (...args: never[]) => unknown>>;

/** A test double for the Soroban RPC server: just the overridden methods. */
function fakeServer(overrides: RpcOverrides = {}): rpc.Server {
  return overrides as unknown as rpc.Server;
}

interface Harness {
  pending: { hash: string; feePaid: string; settlementTimeMs: number; ledger: number }[];
  failures: string[];
}

const callbacks = (h: Harness): PaymentCallbacks => ({
  onPending: (result) => { h.pending.push(result); },
  onFailed: (hash) => { h.failures.push(hash); },
});

// The RPC echoes the transaction's own hash on send. Capture it at prepare
// time so fakes can respond with the real value, like soroban-rpc does.
let txHash = '';
const happyPath: RpcOverrides = {
  getAccount: async () => account(),
  prepareTransaction: async (tx) => {
    txHash = (tx as unknown as { hash: () => Buffer }).hash().toString('hex');
    return tx;
  },
  sendTransaction: async () => ({ status: 'PENDING', hash: txHash }),
  getTransaction: async () => getTx('SUCCESS'),
};

/** Runs one payment through the supplied RPC fake. */
function pay(h: Harness, server: rpc.Server = fakeServer(happyPath), amount = '1', w: PaymentWallet = wallet) {
  return buildAndSubmitPayment(w, config, sender.publicKey(), recipient.publicKey(), amount, callbacks(h), { rpcServer: server });
}

function assertAppError(promise: Promise<unknown>, code: string, messagePart: string) {
  return assert.rejects(promise, (e: unknown) => {
    assert.ok(e instanceof AppError, `expected AppError, got ${e}`);
    assert.equal((e as AppError).code, code);
    assert.match((e as AppError).message, new RegExp(messagePart));
    return true;
  });
}

test('decimal-string amounts reach the contract call as exact integer stroops', async () => {
  const cases = [
    { amount: '1', stroops: 10_000_000n },
    { amount: '0.0000001', stroops: 1n },
    { amount: '12.0000001', stroops: 120_000_001n },
    { amount: '1234.5', stroops: 12_345_000_000n },
  ];
  for (const { amount, stroops } of cases) {
    let sentAmount: bigint | undefined;
    await pay({ pending: [], failures: [] }, fakeServer({
      ...happyPath,
      prepareTransaction: async (tx) => {
        const op = (tx as unknown as { operations: Array<{ type: string; func: { invokeContract: () => { args: () => unknown[] } } }> }).operations[0];
        assert.equal(op.type, 'invokeHostFunction');
        sentAmount = scValToNative(op.func.invokeContract().args()[4]) as bigint;
        return tx;
      },
    }), amount);
    assert.equal(sentAmount, stroops);
  }
});

test('invalid amounts are rejected before any network activity', async () => {
  for (const [amount, message] of [
    ['0', 'greater than zero'],
    ['-1', 'positive decimal'],
    ['abc', 'positive decimal'],
    ['1.00000001', 'positive decimal'],
    ['', 'positive decimal'],
  ] as const) {
    let networkTouched = false;
    await assert.rejects(
      pay({ pending: [], failures: [] }, fakeServer({
        getAccount: async () => { networkTouched = true; return account(); },
      }), amount),
      new RegExp(message),
    );
    assert.equal(networkTouched, false);
  }
});

test('wrong-network wallets abort before building anything', async () => {
  const strictWallet: PaymentWallet = {
    async assertNetwork() { throw new AppError('WRONG_NETWORK', 'Freighter is set to the wrong network.'); },
    async signTransaction() { throw new Error('should not be reached'); },
  };
  let accountFetched = false;
  await assertAppError(
    pay({ pending: [], failures: [] }, fakeServer({
      getAccount: async () => { accountFetched = true; return account(); },
    }), '1', strictWallet),
    'WRONG_NETWORK', 'wrong network',
  );
  assert.equal(accountFetched, false, 'network guard must run before getAccount');
});

test('signing rejection surfaces as USER_REJECTED with nothing recorded and nothing sent', async () => {
  const refusingWallet: PaymentWallet = {
    async assertNetwork() {},
    // The port's contract: adapters classify their own failures, exactly like
    // the real Freighter adapter does before rethrowing.
    async signTransaction() { throw new AppError('USER_REJECTED', 'User declined the request in Freighter.'); },
  };
  const h: Harness = { pending: [], failures: [] };
  let sent = false;
  await assertAppError(
    pay(h, fakeServer({
      ...happyPath,
      sendTransaction: async () => { sent = true; return { status: 'PENDING', hash: txHash }; },
    }), '1', refusingWallet),
    'USER_REJECTED', 'declined',
  );
  assert.equal(sent, false, 'nothing may be broadcast after a refusal');
  assert.equal(h.pending.length, 0);
  assert.equal(h.failures.length, 0);
});

test('RPC-rejected submission calls onFailed exactly once and throws CONTRACT_FAILED', async () => {
  const h: Harness = { pending: [], failures: [] };
  await assertAppError(
    pay(h, fakeServer({ ...happyPath, sendTransaction: async () => ({ status: 'ERROR', hash: txHash }) })),
    'CONTRACT_FAILED', 'rejected by Soroban RPC',
  );
  assert.equal(h.pending.length, 1, 'hash is journaled before broadcast');
  // onFailed receives the journaled (real transaction) hash, not a send artifact.
  assert.deepEqual(h.failures, [h.pending[0].hash]);
});

test('a lost submit response preserves the pending hash and throws TIMEOUT without calling onFailed', async () => {
  const h: Harness = { pending: [], failures: [] };
  await assertAppError(
    pay(h, fakeServer({ ...happyPath, sendTransaction: async () => { throw new Error('fetch failed'); } })),
    'TIMEOUT', 'Check the transaction before sending again',
  );
  assert.equal(h.pending.length, 1, 'pending record enables recovery');
  assert.equal(h.failures.length, 0, 'a lost response is not a definitive failure');
});

test('on-chain failure calls onFailed and throws CONTRACT_FAILED', async () => {
  const h: Harness = { pending: [], failures: [] };
  await assertAppError(
    pay(h, fakeServer({ ...happyPath, getTransaction: async () => getTx('FAILED') })),
    'CONTRACT_FAILED', 'failed on-chain',
  );
  assert.deepEqual(h.failures, [h.pending[0].hash]);
});

test('unfunded senders map to NOT_FUNDED with a friendbot link instead of a raw RPC error', async () => {
  await assertAppError(
    pay({ pending: [], failures: [] }, fakeServer({
      getAccount: async () => { throw new Error('The resource at the URL you requested was not found.'); },
    })),
    'NOT_FUNDED', 'friendbot',
  );
});

test('success returns the real hash, prepared fee and ledger; pending placeholders stay honest zeros', async () => {
  const h: Harness = { pending: [], failures: [] };
  const result = await pay(h, fakeServer({
    ...happyPath,
    getTransaction: async () => ({ status: 'SUCCESS', ledger: 4651575 }) as unknown as rpc.Api.GetTransactionResponse,
  }));
  assert.match(result.hash, /^[a-f0-9]{64}$/, 'hash is the real SHA-256 of the signed transaction');
  assert.equal(result.ledger, 4651575);
  assert.equal(result.feePaid, '0.0000100 XLM', 'fee from the prepared transaction (BASE_FEE), 7 decimals');
  assert.equal(h.pending.length, 1);
  assert.equal(h.failures.length, 0);
  const pending = h.pending[0];
  assert.equal(pending.hash, result.hash, 'the journaled hash is the confirmed hash');
  assert.deepEqual(
    { ledger: pending.ledger, settlementTimeMs: pending.settlementTimeMs },
    { ledger: 0, settlementTimeMs: 0 },
    'pending placeholders are honest zeros, not guesses',
  );
});

test('a TransactionResult maps into a valid native-XLM SavedTransfer with contractId null', async () => {
  const h: Harness = { pending: [], failures: [] };
  const result = await pay(h);
  // The exact mapping the web app performs for native XLM registrations.
  const record = {
    hash: result.hash,
    network: 'TESTNET',
    asset: 'XLM',
    sender: sender.publicKey(),
    recipient: recipient.publicKey(),
    amount: '1',
    contractId: null,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  } as const;
  assert.ok(isSavedTransfer(record), 'native-XLM record shape (contractId: null) must be valid');
});
