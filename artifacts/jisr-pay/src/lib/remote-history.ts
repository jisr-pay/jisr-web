import { isSavedTransfer, applySettlement, type SavedTransfer } from '@workspace/jisr-sdk';

const hex = /^[a-f0-9]{64}$/;
const API = '/v1/wallet';
export class HistoryError extends Error {
  code: 'expired' | 'unavailable' | 'invalid' | 'wallet' | 'conflict' | 'unverified';
  constructor(code: HistoryError['code']) {
    super(code);
    this.code = code;
  }
}
type Json = Record<string, unknown>;
function object(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HistoryError('invalid');
  return value as Json;
}
export interface HistoryWallet {
  assertAccount(address: string): Promise<void>;
  sign(message: string, address: string): Promise<string>;
}

/** Refuse arbitrary signing requests, including challenges for another origin or network. */
export function validateChallenge(value: unknown, address: string, origin: string, now: number) {
  const data = object(value);
  if (typeof data.id !== 'string' || !hex.test(data.id) || data.address !== address ||
      typeof data.message !== 'string' || typeof data.expiresAt !== 'number') throw new HistoryError('invalid');
  const lines = data.message.split('\n');
  const issued = Date.parse(lines[5]?.slice('Issued: '.length) ?? '');
  if (!Number.isFinite(issued) || issued > now + 30_000 || data.expiresAt <= now ||
      data.expiresAt !== issued + 300_000) throw new HistoryError('invalid');
  const expected = [
    'Jisr Pay wallet login v1', `Origin: ${origin}`, 'Network: TESTNET', `Address: ${address}`,
    `Nonce: ${data.id}`, `Issued: ${new Date(issued).toISOString()}`,
    `Expires: ${new Date(data.expiresAt).toISOString()}`,
    'Purpose: access your Jisr transfer records; no transaction is authorized.',
  ].join('\n');
  if (data.message !== expected) throw new HistoryError('invalid');
  return { id: data.id, message: data.message, expiresAt: data.expiresAt };
}

export function parseRemoteRecord(value: unknown, address: string): SavedTransfer {
  const raw = object(value);
  const record = {
    hash: raw.hash, network: raw.network, asset: raw.asset, sender: raw.sender,
    recipient: raw.recipient, amount: raw.amount, contractId: raw.contractId,
    submittedAt: raw.submittedAt, status: 'pending',
  };
  if (!isSavedTransfer(record) || record.sender !== address ||
      !Number.isSafeInteger(raw.revision) || (raw.revision as number) < 0) throw new HistoryError('invalid');
  if (raw.status === 'pending' && raw.settlement === undefined) return record;
  const settlement = object(raw.settlement);
  if (!['confirmed', 'failed'].includes(raw.status as string) ||
      typeof settlement.successful !== 'boolean' || settlement.successful !== (raw.status === 'confirmed') ||
      settlement.hash !== record.hash || typeof settlement.feeCharged !== 'string' ||
      !/^\d+\.\d{7} XLM$/.test(settlement.feeCharged) ||
      typeof settlement.ledger !== 'number' || !Number.isSafeInteger(settlement.ledger) || settlement.ledger <= 0 ||
      typeof settlement.createdAt !== 'string' || !Number.isFinite(Date.parse(settlement.createdAt))) {
    throw new HistoryError('invalid');
  }
  return applySettlement(record, { hash: record.hash, successful: settlement.successful,
    feeCharged: settlement.feeCharged, ledger: settlement.ledger, createdAt: settlement.createdAt });
}

/** Tokens live only in this instance. Every async boundary checks session ownership. */
export class RemoteHistory {
  private token: string | null = null;
  private expiresAt = 0;
  private generation = 0;
  private controller = new AbortController();
  private address: string;
  private origin: string;
  private wallet: HistoryWallet;
  private request: typeof fetch;
  private now: () => number;
  constructor(address: string, origin: string, wallet: HistoryWallet,
    request: typeof fetch = fetch, now: () => number = Date.now) {
    this.address = address; this.origin = origin; this.wallet = wallet; this.request = request; this.now = now;
  }

  get authenticated() { return this.token !== null && this.expiresAt > this.now(); }
  get hasSession() { return this.token !== null; }
  private current(generation: number) {
    if (generation !== this.generation) throw new HistoryError('expired');
  }
  private async revoke(token: string) {
    try { await this.request(`${API}/session`, { method: 'DELETE', credentials: 'omit', redirect: 'error',
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) }); } catch { /* local logout still takes effect */ }
  }
  logout() {
    const token = this.token;
    this.token = null;
    this.expiresAt = 0;
    this.generation++;
    this.controller.abort();
    this.controller = new AbortController();
    if (token) void this.revoke(token);
  }
  async assertWallet() {
    const generation = this.generation;
    try { await this.wallet.assertAccount(this.address); }
    catch { this.current(generation); this.logout(); throw new HistoryError('wallet'); }
    this.current(generation);
    if (this.token && !this.authenticated) { this.logout(); throw new HistoryError('expired'); }
  }
  private async json(path: string, method: string, body?: unknown, authenticated = true): Promise<Json> {
    const generation = this.generation;
    if (authenticated) {
      if (!this.authenticated) { this.logout(); throw new HistoryError('expired'); }
      await this.assertWallet();
    }
    this.current(generation);
    let response: Response;
    try {
      response = await this.request(`${API}${path}`, { method, credentials: 'omit', redirect: 'error', cache: 'no-store',
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(authenticated ? { Authorization: `Bearer ${this.token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(15_000)]) });
    } catch { this.current(generation); throw new HistoryError('unavailable'); }
    this.current(generation);
    if (response.status === 401) { this.logout(); throw new HistoryError('expired'); }
    if (!response.ok) throw new HistoryError(response.status === 409 ? 'conflict' : response.status === 422 ? 'unverified' : 'unavailable');
    let value: unknown;
    try { value = await response.json(); } catch { throw new HistoryError('invalid'); }
    this.current(generation);
    if (authenticated) {
      await this.assertWallet();
      this.current(generation);
    }
    return object(value);
  }
  async login() {
    this.logout();
    const generation = this.generation;
    await this.assertWallet();
    this.current(generation);
    const challenge = validateChallenge(await this.json('/challenges', 'POST', { address: this.address }, false),
      this.address, this.origin, this.now());
    this.current(generation);
    let signature: string;
    try { signature = await this.wallet.sign(challenge.message, this.address); }
    catch { this.current(generation); throw new HistoryError('wallet'); }
    this.current(generation);
    await this.assertWallet();
    this.current(generation);
    if (challenge.expiresAt <= this.now() || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) throw new HistoryError('invalid');
    const session = await this.json('/sessions', 'POST', { id: challenge.id, signature }, false);
    this.current(generation);
    if (typeof session.token !== 'string' || !hex.test(session.token) || session.address !== this.address ||
        typeof session.expiresAt !== 'number' || session.expiresAt <= this.now() ||
        session.expiresAt > this.now() + 930_000) throw new HistoryError('invalid');
    this.token = session.token;
    this.expiresAt = session.expiresAt;
    await this.assertWallet();
    this.current(generation);
  }
  async list(after?: string) {
    if (after !== undefined && !hex.test(after)) throw new HistoryError('invalid');
    const page = await this.json(`/transfers${after ? `?after=${after}` : ''}`, 'GET');
    if (!Array.isArray(page.records) || page.records.length > 50 ||
        !(page.nextCursor === null || typeof page.nextCursor === 'string' && hex.test(page.nextCursor))) throw new HistoryError('invalid');
    const records = page.records.map(value => parseRemoteRecord(value, this.address));
    if (records.some((record, index) => record.hash <= (index ? records[index - 1].hash : after ?? '')) ||
        (page.nextCursor !== null && page.nextCursor !== records.at(-1)?.hash)) throw new HistoryError('invalid');
    return { records, nextCursor: page.nextCursor as string | null };
  }
  async register(record: SavedTransfer) {
    if (!isSavedTransfer(record) || record.sender !== this.address || record.contractId !== null) throw new HistoryError('invalid');
    const { hash, network, asset, sender, recipient, amount, contractId, submittedAt } = record;
    const response = await this.json('/transfers', 'POST', { hash, network, asset, sender, recipient, amount, contractId, submittedAt });
    const remote = parseRemoteRecord(response.record, this.address);
    if (['hash', 'network', 'asset', 'sender', 'recipient', 'amount', 'contractId', 'submittedAt']
      .some(key => remote[key as keyof SavedTransfer] !== record[key as keyof SavedTransfer])) throw new HistoryError('invalid');
    return remote;
  }
  async reconcile(hash: string) {
    if (!hex.test(hash)) throw new HistoryError('invalid');
    const response = await this.json(`/transfers/${hash}/reconcile`, 'POST');
    const record = parseRemoteRecord(response.record, this.address);
    if (record.hash !== hash || !['pending', 'confirmed', 'failed', 'unknown', 'unavailable', 'invalid_evidence', 'unverified_payment']
      .includes(response.outcome as string)) throw new HistoryError('invalid');
    if (response.outcome === 'unverified_payment') throw new HistoryError('unverified');
    if (['unknown', 'unavailable', 'invalid_evidence'].includes(response.outcome as string)) throw new HistoryError('unavailable');
    if (response.outcome !== record.status) throw new HistoryError('invalid');
    return record;
  }
}
