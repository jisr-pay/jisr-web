// App-side network configuration shim.
//
// The SDK's resolveNetworkConfig is environment-agnostic and takes the env
// record as a parameter. This module is the only place in the web app that
// touches Vite's import.meta.env and hands the resulting NetworkConfig to the
// rest of the app (and to SDK entry points that require injected config).

import { resolveNetworkConfig, type NetworkConfig } from '@workspace/jisr-sdk';

export type { NetworkConfig };

let cached: NetworkConfig | null = null;

export function networkConfig(): NetworkConfig {
  cached ??= resolveNetworkConfig((import.meta as { env?: Record<string, string | undefined> }).env ?? {});
  return cached;
}

// Resolved lazily and cached so importing this module in a plain Node test
// environment (no import.meta.env) does not crash before first network use.
export const CONTRACT_ID = () => networkConfig().contractId;
export const TREASURY_ADDRESS = () => networkConfig().treasuryAddress;
export const TOKEN_ADDRESS = () => networkConfig().tokenAddress;
export const FEDERATION_API_BASE = () => networkConfig().federationUrl;
export const SOROBAN_RPC_URL = () => networkConfig().rpcUrl;
export const HORIZON_URL = () => networkConfig().horizonUrl;
export const NETWORK_PASSPHRASE = () => networkConfig().networkPassphrase;
export const STELLAR_NETWORK = () => networkConfig().network;
