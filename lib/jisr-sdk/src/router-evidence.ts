import { Address, StrKey, TransactionBuilder, scValToNative, xdr } from '@stellar/stellar-sdk';
import { fetchSettlement } from './settlement.ts';
import type { TransferSettlement } from './transfer-history.ts';
import { parseAmountToStroops } from './amount.ts';
import { TESTNET_PASSPHRASE, TESTNET_XLM_TOKEN } from './network-config.ts';

export interface RouterPolicy { contractId: string; tokenAddress: string; treasuryAddress: string; feeBps: number }
export interface RouterClaim { hash: string; sender: string; recipient: string; amount: string; contractId: string }
export interface RouterProof { paymentVerified: boolean; reason: string; netUnits?: string; feeUnits?: string; ledger?: number }

/** Total debit, recipient net and floor-rounded router fee in exact native token units. */
export function quoteRouterPayment(amount: string, feeBps: number) {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) throw new Error('Invalid router fee.');
  const total = parseAmountToStroops(amount);
  if (total <= 0n) throw new Error('Invalid router amount.');
  const fee = total * BigInt(feeBps) / 10000n;
  const format = (units: bigint) => `${units / 10000000n}.${(units % 10000000n).toString().padStart(7, '0')}`;
  return { totalUnits: total.toString(), netUnits: (total-fee).toString(), feeUnits: fee.toString(),
    recipientAmount: format(total-fee), routerFeePaid: format(fee) };
}

export function validateRouterPolicy(policy: RouterPolicy): void {
  if (!policy || !StrKey.isValidContract(policy.contractId) || policy.tokenAddress !== TESTNET_XLM_TOKEN ||
      !StrKey.isValidEd25519PublicKey(policy.treasuryAddress) || !Number.isInteger(policy.feeBps) ||
      policy.feeBps < 0 || policy.feeBps > 1000) throw new Error('Invalid Testnet router policy.');
}

/** Verify one successful route_payment operation, never diagnostic events or an unrelated hash. */
export function verifyRouterPayment(claim: RouterClaim, policy: RouterPolicy, result: any): RouterProof {
  const pending = (reason: string): RouterProof => ({ paymentVerified: false, reason });
  try {
    validateRouterPolicy(policy);
    if (claim.contractId !== policy.contractId || !/^[a-f0-9]{64}$/.test(claim.hash) ||
        !StrKey.isValidEd25519PublicKey(claim.sender) || !StrKey.isValidEd25519PublicKey(claim.recipient)) return pending('ROUTER_IDENTITY_MISMATCH');
    const total = parseAmountToStroops(claim.amount);
    if (total <= 0n || claim.sender === claim.recipient || claim.sender === policy.treasuryAddress) return pending('ROUTER_IDENTITY_MISMATCH');
    if (result?.status !== 'SUCCESS') return pending('ROUTER_EVIDENCE_PENDING');
    if (result.txHash !== claim.hash || !Number.isSafeInteger(result.ledger) || result.ledger < 1 ||
        typeof result.envelopeXdr !== 'string' || result.envelopeXdr.length > 1_000_000) return pending('ROUTER_INVALID_EVIDENCE');
    const tx = TransactionBuilder.fromXDR(result.envelopeXdr, TESTNET_PASSPHRASE);
    // Fee bumps and multi-operation routes are deliberately outside this verifier's scope.
    if (!('source' in tx) || tx.source !== claim.sender || tx.hash().toString('hex') !== claim.hash || tx.operations.length !== 1) return pending('ROUTER_IDENTITY_MISMATCH');
    const op = tx.operations[0];
    if (op.type !== 'invokeHostFunction' || (op.source && op.source !== claim.sender) || op.func.switch().name !== 'hostFunctionTypeInvokeContract') return pending('ROUTER_INVOCATION_MISMATCH');
    const call = op.func.invokeContract();
    const args = call.args().map(scValToNative);
    if (Address.fromScAddress(call.contractAddress()).toString() !== policy.contractId || call.functionName().toString() !== 'route_payment' ||
        args.length !== 5 || args[0] !== claim.sender || args[1] !== claim.recipient || args[2] !== policy.treasuryAddress || args[3] !== policy.tokenAddress || args[4] !== total) return pending('ROUTER_INVOCATION_MISMATCH');
    const groups = result.events?.contractEventsXdr;
    if (!Array.isArray(groups) || groups.length !== 1 || !Array.isArray(groups[0]) || groups[0].length > 100) return pending('ROUTER_EVIDENCE_PENDING');
    const events = groups[0].map((raw: unknown) => {
      if (typeof raw !== 'string' || raw.length > 65536) throw new Error('Invalid event');
      const event = xdr.ContractEvent.fromXDR(raw, 'base64');
      if (event.toXDR('base64') !== raw || event.type().name !== 'contract' || event.body().switch() !== 0 || !event.contractId()) throw new Error('Invalid event');
      return { contract: StrKey.encodeContract(event.contractId()!), topics: event.body().v0().topics().map(scValToNative), data: scValToNative(event.body().v0().data()) };
    });
    const fee = total * BigInt(policy.feeBps) / 10000n, net = total - fee;
    const routed = events.filter(e => e.contract === policy.contractId);
    if (routed.length !== 1 || routed[0].topics.length !== 3 || routed[0].topics[0] !== 'routed' || routed[0].topics[1] !== claim.sender || routed[0].topics[2] !== claim.recipient ||
        !Array.isArray(routed[0].data) || routed[0].data.length !== 4 || routed[0].data[0] !== policy.tokenAddress || routed[0].data[1] !== total || routed[0].data[2] !== net || routed[0].data[3] !== fee) return pending('ROUTER_EVENT_MISMATCH');
    const transfers = events.filter(e => e.contract === policy.tokenAddress);
    const expected = [[claim.recipient, net], ...(fee > 0n ? [[policy.treasuryAddress, fee]] : [])].map(([to, units]) => `${to}:${units}`).sort();
    const actual = transfers.map(e => {
      if (e.topics.length !== 4 || e.topics[0] !== 'transfer' || e.topics[1] !== claim.sender || e.topics[3] !== 'native' || typeof e.data !== 'bigint') throw new Error('Invalid token event');
      return `${e.topics[2]}:${e.data}`;
    }).sort();
    if (events.length !== 1 + expected.length || actual.length !== expected.length || actual.some((v, i) => v !== expected[i])) return pending('ROUTER_TRANSFER_MISMATCH');
    return { paymentVerified: true, reason: 'ROUTER_PAYMENT_MATCH', netUnits: net.toString(), feeUnits: fee.toString(), ledger: result.ledger };
  } catch { return pending('ROUTER_INVALID_EVIDENCE'); }
}

/** Read-only RPC lookup with bounded cancellation and exact Testnet identity. */
export async function fetchRouterPaymentEvidence(rpcUrl: string, claim: RouterClaim, policy: RouterPolicy,
  options: { fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<RouterProof> {
  validateRouterPolicy(policy);
  const url = new URL(rpcUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid router RPC URL.');
  if (!/^[a-f0-9]{64}$/.test(claim.hash)) throw new Error('Invalid transaction hash.');
  const signal = AbortSignal.any([AbortSignal.timeout(10000), ...(options.signal ? [options.signal] : [])]);
  const request = async (method: string, params: object) => {
    const response = await (options.fetcher ?? fetch)(url.toString(), { method: 'POST', redirect: 'error', signal,
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    if (!response.ok) throw new Error('Router RPC unavailable.');
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('Router RPC response too large.');
    const body = JSON.parse(text);
    if (body.id !== 1 || body.jsonrpc !== '2.0' || body.error || !body.result) throw new Error('Invalid router RPC response.');
    return body.result;
  };
  if ((await request('getNetwork', {})).passphrase !== TESTNET_PASSPHRASE) throw new Error('Router RPC is not Stellar Testnet.');
  return verifyRouterPayment(claim, policy, await request('getTransaction', { hash: claim.hash }));
}


/** Confirmation for history/recovery: successful hashes remain pending until payment identity matches. */
export async function fetchVerifiedRouterSettlement(horizonUrl: string, rpcUrl: string, claim: RouterClaim,
  policy: RouterPolicy, options: { fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<TransferSettlement | null> {
  const url = new URL(horizonUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid Horizon URL.');
  const fetcher: typeof fetch = (input, init) => (options.fetcher ?? fetch)(input, { ...init, redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(10000), ...(init?.signal ? [init.signal] : []), ...(options.signal ? [options.signal] : [])]) });
  const root = await fetcher(horizonUrl);
  if (!root.ok || (await root.json()).network_passphrase !== TESTNET_PASSPHRASE) throw new Error('Horizon is not Stellar Testnet.');
  const settlement = await fetchSettlement(horizonUrl.replace(/\/+$/, ''), claim.hash, fetcher);
  if (!settlement || !settlement.successful) return settlement;
  const proof = await fetchRouterPaymentEvidence(rpcUrl, claim, policy, options);
  return proof.paymentVerified && proof.ledger === settlement.ledger ? settlement : null;
}
