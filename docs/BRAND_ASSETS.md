# Brand assets

The brand is a bridge arch between two anchors: violet `#7C3AED` on near-black
`#0A0A0F`, with gold `#F59E0B` anchor dots. Original vector source of truth
resides in the `jisr-pay/.github` repository at `assets/logo.svg`
(horizontal lockup) and `assets/icon.svg` (mark).

## This workspace

Files under `public/`:

| File | Purpose |
| --- | --- |
| `favicon.svg` | Primary favicon (vector, official mark). |
| `favicon.ico` | Legacy 32×32 favicon for older clients. |
| `apple-touch-icon.png` | iOS home-screen icon (180×180, full-bleed). |
| `icon-192.png` | Installable-web-app icon (192×192). |
| `icon-512.png` | Installable-web-app icon (512×512). |
| `icon-512-maskable.png` | Installable-web-app icon, maskable safe-zone version. |
| `og-image.png` | Social share card (1200×630) with lockup and tagline. |
| `manifest.webmanifest` | Declares name, theme and the icon set. |
| `robots.txt` | Crawl rules (unchanged). |

`index.html` references the icon set, theme color and manifest. Regenerate the
raster files from the SVGs with the System.Drawing script under
`.opencode` tooling history; sizes are 32/180/192/512 plus the 1200×630 card.

## Rules of use

- Prefer the source SVGs in `jisr-pay/.github` for new artwork; rasterize only
  for formats that require it (ICO, PWA, social cards).
- Do not recolor the mark. Keep `#7C3AED`/`#F59E0B`/`#0A0A0F` as the palette.
- Maskable icons keep the mark inside the central 80% safe zone.
- This is Testnet-only branding; no real-funds claims anywhere.