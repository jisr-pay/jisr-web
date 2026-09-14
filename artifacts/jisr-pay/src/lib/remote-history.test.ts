import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RemoteHistory, HistoryError, validateChallenge, parseRemoteRecord } from './remote-history.ts';

const address = `G${'A'.repeat(55)}`;
const recipient = `G${'B'.repeat(55)}`;
const origin = 'http://localhost:24519';
const initialTime = Date.parse('2026-09-14T12:00:00.000Z');
const id = 'a'.repeat(64);
const token = 'b'.repeat(64);
const signature = Buffer.alloc(64).toString('base64');
const challenge = { id, address, expiresAt: initialTime + 300_000, message: [
  'Jisr Pay wallet login v1', `Origin: ${origin}`, 'Network: TESTNET', `Address: ${address}`,
  `Nonce: ${id}`, `Issued: ${new Date(initialTime).toISOString()}`,
  `Expires: ${new Date(initialTime + 300_000).toISOString()}`,
  'Purpose: access your Jisr transfer records; no transaction is authorized.',
].join('\n') };
const record = { hash: 'c'.repeat(64), network: 'TESTNET' as const, asset: 'XLM' as const,
  sender: address, recipient, amount: '1.0000000', contractId: null,
  submittedAt: new Date(initialTime).toISOString(), status: 'pending' as const, revision: 1 };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
function fixture() {
  let now = initialTime;
  let wrongWallet = false;
  let sign = async (_message: string) => signature;
  let history = async (_url: string, _init: RequestInit) => response({ records: [record], nextCursor: null });
  const calls: { url: string; init: RequestInit }[] = [];
  const request: typeof fetch = async (input, init = {}) => {
    const url = String(input); calls.push({ url, init });
    if (url.endsWith('/challenges')) return response(challenge);
    if (url.endsWith('/sessions')) return response({ token, address, expiresAt: now + 900_000 });
    if (url.endsWith('/session')) return response({ revoked: true });
    return history(url, init);
  };
  const client = new RemoteHistory(address, origin, {
    assertAccount: async () => { if (wrongWallet) throw Error('changed'); },
    sign: async message => sign(message),
  }, request, () => now);
  return { client, calls, setTime: (value: number) => { now = value; },
    changeWallet: () => { wrongWallet = true; },
    setSigner: (value: typeof sign) => { sign = value; },
    setHistory: (value: typeof history) => { history = value; } };
}
const code = (expected: HistoryError['code']) => (error: unknown) => error instanceof HistoryError && error.code === expected;

test('challenge binds exact origin, network, address, purpose and lifetime', () => {
  assert.equal(validateChallenge(challenge, address, origin, initialTime).message, challenge.message);
  for (const message of [challenge.message.replace(origin, 'https://evil.example'),
    challenge.message.replace('TESTNET', 'PUBLIC'), challenge.message + '\n',
    challenge.message.replace('no transaction is authorized.', 'authorize a payment.')]) {
    assert.throws(() => validateChallenge({ ...challenge, message }, address, origin, initialTime), code('invalid'));
  }
  assert.throws(() => validateChallenge(challenge, recipient, origin, initialTime), code('invalid'));
  assert.throws(() => validateChallenge(challenge, address, origin, challenge.expiresAt), code('invalid'));
});
test('login signs exact message; bearer goes only to same-origin wallet routes', async () => {
  const f = fixture(); f.setSigner(async message => { assert.equal(message, challenge.message); return signature; });
  await f.client.login(); await f.client.list();
  assert.equal(f.client.authenticated, true);
  assert.equal((f.calls.at(-1)!.init.headers as Record<string, string>).Authorization, `Bearer ${token}`);
  assert.ok(f.calls.every(call => call.url.startsWith('/v1/wallet/') && call.init.credentials === 'omit' && call.init.redirect === 'error'));
  assert.equal(JSON.parse(f.calls[1].init.body as string).signature, signature);
});
test('wallet rejection does not exchange a session or register a transfer', async () => {
  const f = fixture(); f.setSigner(async () => { throw Error('rejected'); });
  await assert.rejects(f.client.login(), code('wallet'));
  assert.equal(f.calls.length, 1);
});
test('logout during signing discards late signature', async () => {
  const f = fixture();
  let finish!: (value: string) => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  f.setSigner(() => { started(); return new Promise(resolve => { finish = resolve; }); });
  const login = f.client.login(); await ready; f.client.logout(); finish(signature);
  await assert.rejects(login, code('expired')); assert.equal(f.calls.length, 1);
});
test('expiry clears session before any history request', async () => {
  const f = fixture(); await f.client.login(); f.setTime(initialTime + 900_000);
  await assert.rejects(f.client.list(), code('expired'));
  assert.equal(f.client.authenticated, false);
  assert.ok(!f.calls.some(call => call.url.includes('/transfers')));
});
test('account switch revokes session and blocks history', async () => {
  const f = fixture(); await f.client.login(); f.changeWallet();
  await assert.rejects(f.client.list(), code('wallet'));
  assert.equal(f.client.authenticated, false);
  assert.ok(f.calls.some(call => call.url.endsWith('/session') && call.init.method === 'DELETE'));
});
test('late history response cannot survive logout', async () => {
  const f = fixture(); await f.client.login();
  let finish!: (value: Response) => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  f.setHistory(() => { started(); return new Promise(resolve => { finish = resolve; }); });
  const pending = f.client.list(); await ready; f.client.logout(); finish(response({ records: [record], nextCursor: null }));
  await assert.rejects(pending, code('expired'));
});
test('401 clears token; transient failure keeps session for retry', async () => {
  const f = fixture(); await f.client.login();
  f.setHistory(async () => response({}, 503)); await assert.rejects(f.client.list(), code('unavailable'));
  assert.equal(f.client.authenticated, true);
  f.setHistory(async () => response({}, 401)); await assert.rejects(f.client.list(), code('expired'));
  assert.equal(f.client.authenticated, false);
});
test('pagination refuses foreign wallets, duplicates and nonadvancing cursors', async () => {
  const f = fixture(); await f.client.login();
  for (const page of [{ records: [{ ...record, sender: recipient }], nextCursor: null },
    { records: [record, record], nextCursor: null }, { records: [record], nextCursor: id }]) {
    f.setHistory(async () => response(page)); await assert.rejects(f.client.list(), code('invalid'));
  }
  f.setHistory(async () => response({ records: [record], nextCursor: null }));
  await assert.rejects(f.client.list(record.hash), code('invalid'));
});
test('registration retries preserve immutable identity and exclude local settlement', async () => {
  const f = fixture(); await f.client.login();
  const bodies: string[] = [];
  f.setHistory(async (_url, init) => { bodies.push(init.body as string); return response({ record }); });
  await f.client.register(record); await f.client.register(record);
  assert.equal(bodies[0], bodies[1]);
  assert.deepEqual(Object.keys(JSON.parse(bodies[0])).sort(), ['hash', 'network', 'asset', 'sender', 'recipient', 'amount', 'contractId', 'submittedAt'].sort());
  await assert.rejects(f.client.register({ ...record, contractId: `C${'A'.repeat(55)}` }), code('invalid'));
  assert.equal(bodies.length, 2);
});
test('settlement evidence must match hash and status and contain valid receipt fields', () => {
  const settlement = { hash: record.hash, successful: true, feeCharged: '0.0000100 XLM', ledger: 123,
    createdAt: new Date(initialTime + 5000).toISOString() };
  const confirmed = { ...record, status: 'confirmed', settlement };
  assert.equal(parseRemoteRecord(confirmed, address).feePaid, settlement.feeCharged);
  for (const invalid of [{ ...confirmed, settlement: { ...settlement, hash: id } },
    { ...confirmed, status: 'failed' }, { ...confirmed, settlement: undefined },
    { ...confirmed, settlement: { ...settlement, ledger: 0 } }]) {
    assert.throws(() => parseRemoteRecord(invalid, address), code('invalid'));
  }
});

test('reconciliation uncertainty never becomes a failed payment or another signature', async () => {
  const f = fixture(); let signatures = 0;
  f.setSigner(async () => { signatures++; return signature; });
  await f.client.login();
  for (const outcome of ['unknown', 'unavailable', 'invalid_evidence', 'unverified_payment']) {
    f.setHistory(async () => response({ record, outcome }));
    await assert.rejects(f.client.reconcile(record.hash), code(outcome === 'unverified_payment' ? 'unverified' : 'unavailable'));
  }
  f.setHistory(async () => response({ record, outcome: 'pending' }));
  assert.equal((await f.client.reconcile(record.hash)).status, 'pending');
  assert.equal(signatures, 1);
});

test('wallet changes while receiving a response invalidate the returned records', async () => {
  const f = fixture(); await f.client.login();
  f.setHistory(async () => { f.changeWallet(); return response({ records: [record], nextCursor: null }); });
  await assert.rejects(f.client.list(), code('wallet'));
  assert.equal(f.client.authenticated, false);
});
