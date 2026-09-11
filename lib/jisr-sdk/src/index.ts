// Public interface of @workspace/jisr-sdk.
//
// These exports are what the jisr-api backend consumes after extraction and
// what the web app re-exports; changes here are the "SDK interface freeze"
// referenced in docs/COLLABORATION_PLAN.md.

export { parseAmountToStroops } from './amount.ts';
export type { NetworkConfig } from './network-config.ts';
export { resolveNetworkConfig, TESTNET_PASSPHRASE, TESTNET_XLM_TOKEN } from './network-config.ts';
export {
  AppError,
  classifyError,
  isUserRejection,
  toUserMessage,
  type ErrorCode,
} from './errors.ts';
export {
  fetchSettlement,
  type TransferSettlement,
} from './settlement.ts';
export {
  HISTORY_KEY,
  applySettlement,
  isSavedTransfer,
  readTransfers,
  saveTransfer,
  settlementDurationMs,
  type HistoryStorage,
  type SavedTransfer,
  type TransferStatus,
} from './transfer-history.ts';
export { createLogger, setLogSink, type Logger, type LogSink } from './logger.ts';
export { enforce, record, retryAfter, setClock, RULES } from './rateLimit.ts';
export {
  buildAndSubmitPayment,
  withRetry,
  type PaymentCallbacks,
  type PaymentWallet,
  type TransactionResult,
} from './payment.ts';
