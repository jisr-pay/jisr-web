/**
 * Pure receipt-payload helpers shared by the jsPDF renderer (receipt-impl.ts)
 * and its tests. No jsPDF or DOM here, so `node --test` can exercise the
 * exact strings a user sees on their downloaded receipt.
 */

export interface ReceiptData {
  amount: string;
  currency: string;
  recipient: string;
  txHash: string;
  feePaid: string;
  settlementTimeSec: number;
  contractId: string;
  timestamp: Date;
}

/** Filename pinned by the AgentPipeline toast copy: jisr-pay-receipt-<8 chars>.pdf */
export function receiptFilename(txHash: string): string {
  return `jisr-pay-receipt-${txHash.slice(0, 8)}.pdf`;
}

/** Grid-card form: keeps the head and tail of the hash, elides the middle. */
export function truncateHash(hash: string, head = 16, tail = 8): string {
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

/** Long text is cut to max characters including a trailing ellipsis. */
export function truncateText(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

/** Settlement duration rendered with one decimal, e.g. "4.8 seconds". */
export function settlementSecondsLabel(seconds: number): string {
  return `${seconds.toFixed(1)} seconds`;
}
