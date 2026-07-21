export interface Corridor {
  id: string;
  nameKey: 'bankWire' | 'cashPickup' | 'mobileMoney' | 'jisrStellar';
  feePercent: number;         // e.g. 6.5 = 6.5%
  feeFixed: number;           // fixed USD fee on top
  speedMinutes: number;       // min settlement time
  method: string;
  isJisr: boolean;
}

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

export function calculateTotal(corridor: Corridor, amount: number): number {
  return amount * (corridor.feePercent / 100) + corridor.feeFixed;
}

export function formatSpeed(minutes: number): string {
  if (minutes < 1) return `~${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}hr`;
  return `${Math.round(minutes / 1440)}d`;
}

export function getBestCorridor(corridors: Corridor[]): Corridor {
  return corridors.reduce((best, c) => 
    c.feePercent < best.feePercent ? c : best
  );
}

// Deployed stellar-tags payment_router infrastructure (Stellar testnet)
export const CONTRACT_ID = 'CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER';
export const TREASURY_ADDRESS = 'GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST';
export const TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const FEDERATION_API_BASE = 'https://stellar-tags-production.up.railway.app';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const STELLAR_NETWORK = 'TESTNET';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
