/**
 * Generates public/og-image.png (1200×630) — the social share card for
 * og:/twitter: metadata. Brand palette: brand violet bridge arc with gold
 * endpoint dots on near-black, matching the receipt and landing design.
 *
 * Zero dependencies: writes the PNG by hand (IHDR/IDAT/IEND + CRC32, deflate
 * via node:zlib). Run: node scripts/generate-og-image.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const BG = [10, 10, 15]; // #0a0a0f near-black
const VIOLET = [124, 58, 237]; // #7c3aed
const VIOLET_DARK = [76, 29, 149]; // #4c1d95
const GOLD = [245, 158, 11]; // #f59e0b

/* ── PNG plumbing ─────────────────────────────────────────────── */
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* ── Rasterize ────────────────────────────────────────────────── */
const px = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = BG[0];
  px[i * 3 + 1] = BG[1];
  px[i * 3 + 2] = BG[2];
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function blend(x, y, color, a) {
  if (a <= 0) return;
  const i = (y * W + x) * 3;
  px[i] = Math.round(px[i] * (1 - a) + color[0] * a);
  px[i + 1] = Math.round(px[i + 1] * (1 - a) + color[1] * a);
  px[i + 2] = Math.round(px[i + 2] * (1 - a) + color[2] * a);
}

// Bridge arc: thick half-annulus rising from the bottom edge, centered.
const cx = 600;
const cy = 700; // center below the canvas so only the arc's crown shows
const rIn = 420;
const rOut = 510;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy);
    // ±0.5px feather gives cheap anti-aliasing.
    const a = clamp01(Math.min(rOut - d, d - rIn) + 0.5);
    if (a > 0) blend(x, y, VIOLET, a);
  }
}

// Gold endpoint dots where the arc meets the card edges.
for (const [dx, dy] of [
  [cx - 465, 585],
  [cx + 465, 585],
]) {
  const r = 26;
  for (let y = Math.floor(dy - r - 2); y <= Math.ceil(dy + r + 2); y++) {
    for (let x = Math.floor(dx - r - 2); x <= Math.ceil(dx + r + 2); x++) {
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      const a = clamp01(r - Math.hypot(x - dx, y - dy) + 0.5);
      if (a > 0) blend(x, y, GOLD, a);
    }
  }
}

// Thin violet accent band along the bottom, echoing the receipt footer.
for (let y = H - 14; y < H; y++) {
  for (let x = 0; x < W; x++) blend(x, y, VIOLET_DARK, 0.9);
}

/* ── Encode ───────────────────────────────────────────────────── */
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'og-image.png');
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
