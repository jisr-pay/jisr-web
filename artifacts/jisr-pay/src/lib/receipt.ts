/**
 * generateReceiptPDF — Jisr Pay transaction receipt (public API)
 *
 * jsPDF is loaded lazily: the PDF library only downloads when a user
 * actually requests a receipt. See receipt-impl.ts for the implementation.
 */

import type { ReceiptData } from './receipt-payload.ts';

export { type ReceiptData, receiptFilename } from './receipt-payload.ts';
export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  // Explicit .ts on the dynamic import: the node test loader fails on
  // extensionless relative imports, and Vite handles the extension fine.
  const { generateReceiptPDFImpl } = await import('./receipt-impl.ts');
  generateReceiptPDFImpl(data);
}
