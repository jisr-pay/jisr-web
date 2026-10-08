import { StrKey } from '@stellar/stellar-sdk';
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const TESTNET_XLM_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

/** Validated network endpoints and addresses every SDK operation must receive. */
export interface NetworkConfig {
  contractId: string;
  treasuryAddress: string;
  tokenAddress: string;
  federationUrl: string;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  routerFeeBps?: number;
  network: 'TESTNET';
}

/** The journal, wallet signing and receipts all describe Testnet XLM. */
export function resolveNetworkConfig(env: Record<string, string | undefined>): NetworkConfig {
  const setting = (key: string, fallback: string) => env[key]?.trim() || fallback;
  const passphrase = setting('VITE_NETWORK_PASSPHRASE', TESTNET_PASSPHRASE);
  if (passphrase !== TESTNET_PASSPHRASE) throw new Error('Jisr Pay currently supports Stellar Testnet only.');
  const token = setting('VITE_TOKEN_ADDRESS', TESTNET_XLM_TOKEN);
  if (token !== TESTNET_XLM_TOKEN) throw new Error('Jisr Pay currently supports native Testnet XLM only.');
  const address = (key: string, fallback: string, prefix: 'C' | 'G') => {
    const value = setting(key, fallback);
    if (!(prefix === 'C' ? StrKey.isValidContract(value) : StrKey.isValidEd25519PublicKey(value))) throw new Error(`Invalid ${key}.`);
    return value;
  };
  const endpoint = (key: string, fallback: string) => {
    const value = setting(key, fallback);
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error(`${key} must be an HTTPS endpoint without credentials, a query or a fragment.`);
    }
    return url.toString().replace(/\/+$/, '');
  };
  const fee = setting('VITE_ROUTER_FEE_BPS', '125');
  if (!/^\d+$/.test(fee) || Number(fee) > 1000) throw new Error('Invalid VITE_ROUTER_FEE_BPS.');
  return {
    routerFeeBps: Number(fee),
    contractId: address('VITE_CONTRACT_ID', 'CCGSUUQLWXKU6AZ6YKUNXLR7R6KLBYBG4AJGJ54XV4DC63AJ3LDVPNW4', 'C'),
    treasuryAddress: address('VITE_TREASURY_ADDRESS', 'GBHS7NUWCDQAQSC2DFM5E7BBYRD74KVJPCVE3OVYMU7LBQDSJBY34AAP', 'G'),
    tokenAddress: token,
    federationUrl: endpoint('VITE_FEDERATION_API_BASE', 'https://stellar-tags-production.up.railway.app'),
    rpcUrl: endpoint('VITE_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
    horizonUrl: endpoint('VITE_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
    networkPassphrase: passphrase,
    network: 'TESTNET' as const,
  };
}
