import { resolveNetworkConfig } from './network-config';

import type { Corridor } from './fees';
export { calculateTotal, getBestCorridor, type Corridor } from './fees';

export const CORRIDORS: Corridor[] = [
  {
    id: 'bank-wire',
    nameKey: 'bankWire',
    feePercent: 6.5,
    feeFixed: 15,
    speedMinutes: 2880,  // 2 days
    method: 'SWIFT',
    isJisr: false,
  },
  {
    id: 'cash-pickup',
    nameKey: 'cashPickup',
    feePercent: 5.0,
    feeFixed: 10,
    speedMinutes: 30,
    method: 'Agent network',
    isJisr: false,
  },
  {
    id: 'mobile-money',
    nameKey: 'mobileMoney',
    feePercent: 3.5,
    feeFixed: 2,
    speedMinutes: 15,
    method: 'M-Pesa API',
    isJisr: false,
  },
  {
    id: 'jisr-stellar',
    nameKey: 'jisrStellar',
    feePercent: 0.4,
    feeFixed: 0,
    speedMinutes: 0.083,  // ~5 seconds
    method: 'Soroban contract',
    isJisr: true,
  },
];

export function formatSpeed(minutes: number): string {
  if (minutes < 1) return `~${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}hr`;
  return `${Math.round(minutes / 1440)}d`;
}

// Signing, saved history and receipts consistently target native Testnet XLM.
const networkConfig = resolveNetworkConfig(import.meta.env);
export const CONTRACT_ID = networkConfig.contractId;
export const TREASURY_ADDRESS = networkConfig.treasuryAddress;
export const TOKEN_ADDRESS = networkConfig.tokenAddress;
export const FEDERATION_API_BASE = networkConfig.federationUrl;
export const SOROBAN_RPC_URL = networkConfig.rpcUrl;
export const HORIZON_URL = networkConfig.horizonUrl;
export const NETWORK_PASSPHRASE = networkConfig.networkPassphrase;
export const STELLAR_NETWORK = networkConfig.network;
