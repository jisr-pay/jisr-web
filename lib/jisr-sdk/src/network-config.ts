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
    if (!new RegExp(`^${prefix}[A-Z2-7]{55}$`).test(value)) throw new Error(`Invalid ${key}.`);
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
  return {
    contractId: address('VITE_CONTRACT_ID', 'CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER', 'C'),
    treasuryAddress: address('VITE_TREASURY_ADDRESS', 'GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST', 'G'),
    tokenAddress: token,
    federationUrl: endpoint('VITE_FEDERATION_API_BASE', 'https://stellar-tags-production.up.railway.app'),
    rpcUrl: endpoint('VITE_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org'),
    horizonUrl: endpoint('VITE_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
    networkPassphrase: passphrase,
    network: 'TESTNET' as const,
  };
}
