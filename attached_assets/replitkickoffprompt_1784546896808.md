# Replit kickoff prompt for Jisr Pay

Paste everything below the line into Replit's AI agent to continue the build.

---

I'm continuing an existing hackathon project called **Jisr Pay** (jisr = "bridge"
in Arabic). It's a three-agent AI system for the Kanz AI Hackathon (try.ka.nz)
that finds the cheapest, fastest corridor for Gulf↔Africa remittances and
settles the payment live on the Stellar blockchain.

## What already exists (import from GitHub, don't rebuild from scratch)

Repo: `github.com/OTimileyin/jisr-pay` — a Vite + React app with:
- `src/i18n.js` — English/Arabic string dictionary with RTL support
- `src/corridors.js` — corridor comparison data/logic (bank wire, cash pickup,
  mobile money vs. the Jisr Stellar corridor)
- `src/App.jsx` — a working 3-agent pipeline UI:
  1. **Rate-Scout Agent** — compares corridor fees/speed, picks the cheapest
  2. **Router Agent** — resolves recipient via a federation lookup API, builds
     and submits a real Soroban smart-contract transaction, signed via the
     Freighter wallet browser extension
  3. **Reconciliation Agent** — polls Stellar Testnet for settlement, reports
     real fee paid, real settlement time, and savings vs. traditional
     providers

It connects to an already-deployed Soroban `payment_router` contract on
Stellar Testnet (0.4% fee, capped at 30 XLM) — this is real, not mocked.
Import this repo first, get it running, then build on top of it. Do not
replace the agent logic in App.jsx; restyle and extend around it.

## Brand identity

- **Name**: Jisr Pay. "Jisr" (جسر) = bridge — the whole visual identity
  should evoke a bridge connecting two sides (Gulf ↔ Africa).
- **Palette**: deep violet/purple (`#7c3aed` / `#5b21b6`) as the primary
  accent, paired with a brushed-metal silver/chrome gradient (cool grays,
  near-white highlights, subtle warm gold accent for "value/savings"
  moments). Think liquid metal bridge cables, not flat corporate purple.
- **Wordmark**: "Jisr Pay" in a clean geometric sans, with a simple bridge-arc
  or connecting-node glyph as the mark (avoid literal clip-art bridges —
  keep it abstract/geometric, works in both LTR and RTL layouts).
- **Bilingual**: full English/Arabic parity, proper RTL mirroring (not just
  text-align: right — mirror the whole layout, nav, and icons).

## Hero section: 3D + metallic + mouse-hover reveal

Build the hero as a 3D scene using **react-three-fiber** + **drei**:
- A 3D object representing the bridge mark (or an abstract arc/ribbon of
  connected nodes forming a bridge silhouette) rendered with a **metallic
  material** — `MeshPhysicalMaterial` or `MeshStandardMaterial` with high
  `metalness` (~0.9), low `roughness` (~0.15-0.3), and an HDRI/environment
  map (`<Environment preset="city" />` or similar from drei) so it catches
  real reflections instead of looking flat.
- **Mouse-hover reveal effect**: as the cursor moves across the hero, reveal
  a hidden layer/detail under a soft radial mask that follows the pointer —
  e.g., the metallic bridge object sits under a matte/frosted overlay by
  default, and wherever the mouse hovers, a circular "spotlight" lifts the
  overlay to reveal the polished metal and light reflections underneath
  (a masked reveal via CSS `mask-image`/`-webkit-mask-image` with a radial
  gradient centered on pointer position works well combined with the 3D
  canvas; alternatively drive it fully in the R3F scene by raycasting mouse
  position onto the material and tweening a reveal uniform in a custom
  shader if you want it fully 3D-native).
- Keep interaction subtle and performant — throttle pointer updates, and
  provide a static fallback (no parallax/tilt, reveal effect degrades to a
  simple hover glow) for reduced-motion preference and low-power/mobile
  devices, since this same codebase will also ship as native apps.
- The hero copy stays as-is from the existing `heroTitle`/`heroBody` i18n
  strings — just give it this 3D metallic treatment behind/around the text.

## Multi-platform scope — plan for this from the start

This needs to ship as: a **web page**, an **Android app**, and an **iOS
app**, from as close to one codebase as possible. Recommended approach:

1. Keep the core as the existing Vite/React web app (single source of
   truth for the agent pipeline, i18n, and UI).
2. Wrap it for mobile using **Capacitor** (`@capacitor/core`,
   `@capacitor/android`, `@capacitor/ios`) rather than rewriting in React
   Native — this reuses the same React components, the same Freighter/
   Soroban integration logic, and the same 3D hero, and lets you build real
   Android/iOS binaries from the same repo.
3. Be deliberate about what changes per platform:
   - Freighter is a browser extension — it won't exist inside a native app
     shell. On mobile, gate the wallet-connect flow behind a check for
     Freighter availability and fall back to WalletConnect-style deep
     linking to a mobile Stellar wallet (e.g. xBull, Lobstr) or a
     "continue on web to pay" handoff — don't let the app hard-fail on
     mobile because of this.
   - The 3D hero should detect device capability (WebGL support, GPU tier,
     reduced-motion) and drop to a lighter static/gradient hero on
     low-power devices, since Capacitor WebViews on older phones may
     struggle with a full three.js scene.
   - Keep RTL/bilingual logic platform-agnostic (it already is, in
     `i18n.js`) so it works identically in the web build and both app
     shells.
4. Deployment targets: Replit for the live web demo URL (needed for the
   hackathon submission regardless), Capacitor + Android Studio for a
   signed APK/AAB, Capacitor + Xcode for a TestFlight build if time allows
   — the web deployment is the one that must exist for judging, the native
   builds are the "scaling vision" story if time runs out.

## What to do first

1. Import the `jisr-pay` GitHub repo into this Replit.
2. Get the existing agent pipeline running and confirm a real Testnet
   transaction still completes end-to-end (needs a Freighter wallet funded
   via Stellar Testnet Friendbot).
3. Build the 3D metallic hero with the mouse-hover reveal described above.
4. Apply the brand system (palette, wordmark, RTL) across the rest of the
   app (agent console, corridor table, results panel) so it's visually
   consistent with the new hero, not just the hero on its own.
5. Only after the web experience is solid, set up the Capacitor wrapper for
   Android/iOS.

Ask me before making any structural decision that trades off hackathon
demo-readiness (e.g. don't let the 3D scene or mobile wrapper block having a
working, deployed web demo — that's the non-negotiable deliverable).
