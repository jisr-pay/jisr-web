import type { Corridor } from './fees.ts';
export { calculateTotal, getBestCorridor, type Corridor } from './fees.ts';

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
// Values come from the app's network-config shim (Vite env → SDK config);
// this module holds only illustrative corridor/fee comparison data.
export {
  CONTRACT_ID,
  FEDERATION_API_BASE,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  SOROBAN_RPC_URL,
  STELLAR_NETWORK,
  TOKEN_ADDRESS,
  TREASURY_ADDRESS,
} from './network-config.ts';
