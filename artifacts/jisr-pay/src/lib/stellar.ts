import {
  Address,
  BASE_FEE,
  Contract,
  Horizon,
  Networks,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import {
  CONTRACT_ID,
  FEDERATION_API_BASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  TOKEN_ADDRESS,
  TREASURY_ADDRESS,
} from './corridors';

export function detectWalletEnvironment(): 'freighter' | 'mobile' | 'none' {
  if (typeof window === 'undefined') return 'none';
  // @ts-ignore
  if (window.freighter || window.freighterApi) return 'freighter';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) return 'mobile';
  return 'none';
}

export async function connectFreighter(): Promise<string | null> {
  try {
    // @ts-ignore
    const freighter = window.freighterApi || window.freighter;
    if (!freighter) return null;
    await freighter.setAllowed?.();
    const publicKey = await freighter.getPublicKey();
    return publicKey;
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
    const res = await fetch(
      `${FEDERATION_API_BASE}/federation?q=${encodeURIComponent(input)}`,
    );
    if (res.status === 404) {
      throw new Error(`Recipient "${input}" not found in the federation directory`);
    }
    if (!res.ok) {
      throw new Error(`Federation lookup failed (HTTP ${res.status})`);
    }
    const record = await res.json();
    if (!record.account_id || !StrKey.isValidEd25519PublicKey(record.account_id)) {
      throw new Error('Federation record did not contain a valid Stellar account');
    }
    return record.account_id;
  }
  throw new Error(
    'Enter a Stellar public key (G...) or a federation address like alice*jisr.pay',
  );
}

export interface TransactionResult {
  hash: string;
  feePaid: string;
  settlementTimeMs: number;
  ledger: number;
}

// Invokes route_payment(sender, recipient, platform_treasury, token_address, amount)
// on the deployed payment_router contract via Soroban RPC. Every failure throws —
// nothing is simulated.
export async function buildAndSubmitPayment(
  senderKey: string,
  recipientKey: string,
  amountXLM: string,
): Promise<TransactionResult> {
  const server = new rpc.Server(SOROBAN_RPC_URL);

  let account;
  try {
    account = await server.getAccount(senderKey);
  } catch {
    throw new Error(
      `Sender account is not funded on testnet. Fund it at https://friendbot.stellar.org/?addr=${senderKey} and try again.`,
    );
  }

  const stroops = BigInt(Math.round(Number(amountXLM) * 10_000_000));
  if (stroops <= 0n) {
    throw new Error('Amount must be greater than zero');
  }

  const contract = new Contract(CONTRACT_ID);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'route_payment',
        Address.fromString(senderKey).toScVal(),
        Address.fromString(recipientKey).toScVal(),
        Address.fromString(TREASURY_ADDRESS).toScVal(),
        Address.fromString(TOKEN_ADDRESS).toScVal(),
        nativeToScVal(stroops, { type: 'i128' }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(transaction);

  // @ts-ignore
  const freighter = window.freighterApi || window.freighter;
  if (!freighter) {
    throw new Error('Freighter wallet not found');
  }
  const signResult = await freighter.signTransaction(prepared.toXDR(), {
    networkPassphrase: Networks.TESTNET,
  });
  const signedXDR =
    typeof signResult === 'string' ? signResult : signResult.signedTxXdr;

  const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);

  const start = Date.now();
  const sendResponse = await server.sendTransaction(signedTx);
  if (sendResponse.status === 'ERROR') {
    throw new Error(
      `Transaction rejected by Soroban RPC (hash ${sendResponse.hash})`,
    );
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
    throw new Error(`Transaction ${sendResponse.hash} failed on-chain`);
  }
  if (getResponse.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(
      `Timed out waiting for confirmation of transaction ${sendResponse.hash}`,
    );
  }

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

// Polls Horizon for the confirmed transaction and returns the real on-chain
// fee and ledger. Throws if the transaction failed or never appears.
export async function pollSettlement(
  hash: string,
  onUpdate: (status: string) => void,
): Promise<SettlementRecord> {
  const server = new Horizon.Server(HORIZON_URL);
  let attempts = 0;

  while (attempts < 30) {
    let tx;
    try {
      tx = await server.transactions().transaction(hash).call();
    } catch {
      onUpdate('awaitingSettlement');
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      continue;
    }
    if (tx.successful === false) {
      throw new Error(`Transaction ${hash} failed on-chain (ledger ${tx.ledger_attr})`);
    }
    onUpdate('settled');
    return {
      hash: tx.hash,
      successful: true,
      feeCharged: `${(Number(tx.fee_charged) / 10_000_000).toFixed(7)} XLM`,
      ledger: tx.ledger_attr,
      createdAt: tx.created_at,
    };
  }
  throw new Error('Settlement timeout — transaction not found on Horizon');
}
