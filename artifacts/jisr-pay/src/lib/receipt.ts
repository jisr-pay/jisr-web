/**
 * generateReceiptPDF — Jisr Pay transaction receipt
 *
 * Produces a branded A4 PDF with:
 *  - Dark violet header with bridge arc logo
 *  - "PAYMENT SETTLED" badge
 *  - Amount prominently displayed
 *  - Details grid (hash, recipient, fee, time, savings)
 *  - Stellar Explorer URL
 *  - Branded footer
 */

import jsPDF from 'jspdf';

export interface ReceiptData {
  amount: string;
  currency: string;
  recipient: string;
  txHash: string;
  feePaid: string;
  settlementTimeSec: number;
  savingsAmount: number;
  savingsPercent: number;
  contractId: string;
  timestamp: Date;
}

/* ─── Palette ─────────────────────────────────────── */
const VIOLET      = [124, 58, 237]  as [number, number, number]; // #7c3aed
const VIOLET_DARK = [76,  29, 149]  as [number, number, number]; // #4c1d95
const GOLD        = [245, 158, 11]  as [number, number, number]; // #f59e0b
const BG_DARK     = [10,  10,  15]  as [number, number, number]; // #0a0a0f
const BG_CARD     = [19,  19,  26]  as [number, number, number]; // #13131a
const BORDER      = [30,  30,  46]  as [number, number, number]; // #1e1e2e
const GREEN       = [16, 185, 129]  as [number, number, number]; // #10b981
const WHITE       = [255, 255, 255] as [number, number, number];
const MUTED       = [148, 163, 184] as [number, number, number]; // slate-400
const AMBER_LIGHT = [252, 211, 77]  as [number, number, number];

/* ─── Helpers ─────────────────────────────────────── */
function rgb(doc: jsPDF, color: [number, number, number]) {
  return doc.setTextColor(color[0], color[1], color[2]);
}
function fillRgb(doc: jsPDF, color: [number, number, number]) {
  return doc.setFillColor(color[0], color[1], color[2]);
}
function strokeRgb(doc: jsPDF, color: [number, number, number]) {
  return doc.setDrawColor(color[0], color[1], color[2]);
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

export function generateReceiptPDF(data: ReceiptData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width mm
  const margin = 18;
  const contentW = W - margin * 2;

  /* ══════════════════════════════════════════
     HEADER — full-width dark violet band
  ══════════════════════════════════════════ */
  const headerH = 52;
  fillRgb(doc, VIOLET_DARK);
  doc.rect(0, 0, W, headerH, 'F');

  // Subtle diagonal stripe overlay for depth
  doc.setLineWidth(0.2);
  strokeRgb(doc, [255, 255, 255]);
  doc.setGState(doc.GState({ opacity: 0.04 }));
  for (let x = -headerH; x < W + headerH; x += 8) {
    doc.line(x, 0, x + headerH, headerH);
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── Bridge Arc Logo (drawn) ──
  // Scale the SVG arc: original 24×24px → ~10mm
  const logoX = margin;
  const logoY = 14;
  const S = 0.45; // scale: 1 unit in SVG = 0.45 mm

  doc.setLineWidth(1.2);
  strokeRgb(doc, VIOLET);
  doc.setGState(doc.GState({ opacity: 1 }));

  // Arc path approximated as quadratic bezier via cubic
  // SVG: M4,18 C4,18 6,8 12,8 C18,8 20,18 20,18  (scaled)
  const ax = logoX;
  const ay = logoY;
  doc.lines(
    [
      [( 6-4)*S, ( 8-18)*S, (12- 4)*S, (8-18)*S, (16-4)*S, 0],  // first half arc
    ],
    ax + 4*S, ay + 18*S,
  );
  doc.lines(
    [
      [(14)*S*0.3, 0, (16-4)*S, (10)*S, (16)*S, (10)*S],
    ],
    ax + 4*S + (12-4)*S, ay + 8*S,
  );

  // Gold dots
  fillRgb(doc, GOLD);
  strokeRgb(doc, GOLD);
  doc.circle(ax + 4*S,  ay + 18*S, 1.0, 'F');
  doc.circle(ax + 20*S, ay + 18*S, 1.0, 'F');

  // ── Wordmark ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  rgb(doc, VIOLET);
  doc.text('Jisr', margin + 12, logoY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(22);
  rgb(doc, WHITE);
  doc.text('Pay', margin + 12 + doc.getTextWidth('Jisr') + 1.5, logoY + 7);

  // ── "Transaction Receipt" label (right-aligned) ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rgb(doc, MUTED);
  doc.text('TRANSACTION RECEIPT', W - margin, logoY + 4, { align: 'right' });

  // ── Date/time ──
  doc.setFontSize(7);
  rgb(doc, MUTED);
  const dateStr = data.timestamp.toUTCString();
  doc.text(dateStr, W - margin, logoY + 9, { align: 'right' });

  /* ══════════════════════════════════════════
     SETTLED BADGE + AMOUNT
  ══════════════════════════════════════════ */
  const badgeY = headerH + 10;

  // Green "✓ PAYMENT SETTLED" pill
  fillRgb(doc, [6, 78, 59]); // dark green bg
  doc.roundedRect(margin, badgeY, 46, 8, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, GREEN);
  doc.text('✓  PAYMENT SETTLED', margin + 5, badgeY + 5.2);

  // Amount — large centred
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(38);
  rgb(doc, WHITE);
  const amountStr = `${data.amount} ${data.currency}`;
  doc.text(amountStr, W / 2, badgeY + 24, { align: 'center' });

  // Savings line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, GOLD);
  const savingsStr = `You saved $${data.savingsAmount.toFixed(2)} (${data.savingsPercent.toFixed(0)}%) vs Bank Wire`;
  doc.text(savingsStr, W / 2, badgeY + 32, { align: 'center' });

  /* ══════════════════════════════════════════
     DIVIDER
  ══════════════════════════════════════════ */
  const divY = badgeY + 38;
  doc.setLineWidth(0.3);
  strokeRgb(doc, BORDER);
  doc.line(margin, divY, W - margin, divY);

  /* ══════════════════════════════════════════
     DETAILS CARDS  (2-column grid)
  ══════════════════════════════════════════ */
  const cardY = divY + 8;
  const cardH = 22;
  const cardGap = 5;
  const colW = (contentW - cardGap) / 2;

  const fields: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Transaction Hash', value: `${data.txHash.slice(0, 16)}...${data.txHash.slice(-8)}` },
    { label: 'Recipient Address', value: truncate(data.recipient, 28) },
    { label: 'Fee Paid', value: data.feePaid },
    { label: 'Settlement Time', value: `${data.settlementTimeSec.toFixed(1)} seconds` },
  ];

  fields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * (colW + cardGap);
    const cy = cardY + row * (cardH + cardGap);

    // Card background
    fillRgb(doc, BG_CARD);
    strokeRgb(doc, BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, colW, cardH, 3, 3, 'FD');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rgb(doc, MUTED);
    doc.text(field.label.toUpperCase(), cx + 5, cy + 7);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    rgb(doc, WHITE);
    doc.text(field.value, cx + 5, cy + 15.5);
  });

  /* ══════════════════════════════════════════
     FULL HASH BLOCK
  ══════════════════════════════════════════ */
  const hashBlockY = cardY + 2 * (cardH + cardGap) + 3;
  fillRgb(doc, BG_CARD);
  strokeRgb(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, hashBlockY, contentW, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, MUTED);
  doc.text('FULL TRANSACTION HASH', margin + 5, hashBlockY + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  rgb(doc, [167, 139, 250]); // violet-400
  doc.text(data.txHash, margin + 5, hashBlockY + 14, { maxWidth: contentW - 10 });

  /* ══════════════════════════════════════════
     STELLAR EXPLORER CTA
  ══════════════════════════════════════════ */
  const ctaY = hashBlockY + 26;
  fillRgb(doc, [30, 10, 80]); // deep violet bg
  strokeRgb(doc, VIOLET);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, ctaY, contentW, 14, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  rgb(doc, VIOLET);
  doc.text('🔗  Verify on Stellar Expert:', margin + 5, ctaY + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  rgb(doc, MUTED);
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${data.txHash}`;
  doc.text(explorerUrl, margin + 5, ctaY + 11.5, { maxWidth: contentW - 10 });

  // Make the URL clickable
  doc.link(margin, ctaY, contentW, 14, { url: explorerUrl });

  /* ══════════════════════════════════════════
     NETWORK INFO ROW
  ══════════════════════════════════════════ */
  const netY = ctaY + 20;
  doc.setLineWidth(0.2);
  strokeRgb(doc, BORDER);
  doc.line(margin, netY, W - margin, netY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, MUTED);
  doc.text('Network: Stellar Testnet', margin, netY + 5);
  doc.text(
    `Contract: ${data.contractId.slice(0, 10)}...${data.contractId.slice(-6)}`,
    W / 2, netY + 5, { align: 'center' },
  );

  // Green live dot
  fillRgb(doc, GREEN);
  doc.circle(W - margin - 15, netY + 3.8, 1.2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, GREEN);
  doc.text('LIVE', W - margin - 12, netY + 5);

  /* ══════════════════════════════════════════
     FOOTER BAND
  ══════════════════════════════════════════ */
  const footerY = 268;
  fillRgb(doc, BG_DARK);
  doc.rect(0, footerY, W, 29, 'F');

  // Thin top accent line
  strokeRgb(doc, VIOLET);
  doc.setLineWidth(0.5);
  doc.line(0, footerY, W, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  rgb(doc, VIOLET);
  doc.text('Jisr', margin, footerY + 9);
  doc.setFont('helvetica', 'normal');
  rgb(doc, WHITE);
  doc.text('Pay', margin + doc.getTextWidth('Jisr') + 1, footerY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rgb(doc, MUTED);
  doc.text(
    'Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled.',
    margin, footerY + 15,
  );
  doc.text(
    'This receipt is for informational purposes. Verify all details on the Stellar blockchain.',
    margin, footerY + 20,
  );

  const year = new Date().getFullYear();
  rgb(doc, MUTED);
  doc.setFontSize(6.5);
  doc.text(`© ${year} Jisr Pay — MIT License`, W - margin, footerY + 20, { align: 'right' });

  /* ══════════════════════════════════════════
     SAVE
  ══════════════════════════════════════════ */
  const filename = `jisr-pay-receipt-${data.txHash.slice(0, 8)}.pdf`;
  doc.save(filename);
}
