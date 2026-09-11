/**
 * generateReceiptPDF — Jisr Pay transaction receipt (public API)
 *
 * jsPDF is loaded lazily: the PDF library only downloads when a user
 * actually requests a receipt. See receipt-impl.ts for the implementation.
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

/**
 * Lazy loader: downloads the jsPDF chunk on first use, then renders.
 * Keeps the PDF library out of the initial bundle.
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const { generateReceiptPDFImpl } = await import('./receipt-impl');
  generateReceiptPDFImpl(data);
}
