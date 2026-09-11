# Jisr Pay 🌉

> **Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled, a fraction of the cost.**

Jisr Pay is a hackathon fintech demo for Gulf-to-Africa remittances. Its three-stage interface (Rate-Scout → Router → Reconciler) compares illustrative fees, builds a native XLM payment on Stellar Testnet, and checks its network result. The comparison data is static; it does not execute bank transfers, convert fiat currencies, or use a live AI routing service. The app supports English and Arabic with RTL layouts.

---

## ✨ Features

| Feature | Details |
|---|---|
| **3-Agent AI Pipeline** | Rate-Scout scans corridors, Router resolves addresses & builds Stellar txs, Reconciler polls the ledger and confirms settlement |
| **Stellar Blockchain** | Real `@stellar/stellar-sdk` integration for native Testnet XLM; Mainnet configuration is rejected |
| **Freighter Wallet** | Native browser-extension wallet connect; graceful fallback for mobile |
| **Corridor Comparison** | Illustrative fee/speed table with percentage and fixed charges; not a live quote |
| **English / Arabic** | Full i18n with RTL layout mirroring, IBM Plex Sans Arabic, `dir` switching |
| **3D Hero** | `react-three-fiber` metallic torus-arc scene with mouse-hover radial reveal |
| **Confetti Settlement** | `canvas-confetti` burst on transaction confirmation |

---

## 🗺️ Illustrative Corridor Scenarios

These are product examples, not operational fiat payout integrations. Actual
payments in the dashboard use native Testnet XLM between Stellar accounts.

| From | To | Methods |
|---|---|---|
| UAE (AED) | Nigeria (NGN) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Saudi Arabia (SAR) | Kenya (KES) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Kuwait (KWD) | Ghana (GHS) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Qatar (QAR) | Ethiopia (ETB) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |

---

## 🏗️ Tech Stack

- **Frontend** — React 19 + Vite + TypeScript
- **3D** — `@react-three/fiber`, `@react-three/drei`, `three.js`
- **Blockchain** — `@stellar/stellar-sdk` (Horizon API)
- **Styling** — Tailwind CSS v4, light/dark themes
- **i18n** — Custom `useI18n()` hook with EN/AR dictionary
- **Animations** — `canvas-confetti`
- **Router** — `wouter`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.13+ (Node.js 24 recommended)
- pnpm 11.8.0 (the version pinned in `package.json`)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm --filter @workspace/jisr-pay run dev
```

The app runs at `http://localhost:24519` by default.

### Running the Full Monorepo

```bash
# Start the web app
pnpm run dev
```

`PORT` defaults to `24519` and `BASE_PATH` defaults to `/`. The optional
API scaffold can be started separately with `pnpm --filter @workspace/api-server run dev`
after configuring its required environment variables.

The payment form sends **test XLM**, without fiat conversion. The $500 fee
comparison is illustrative. If federation names fail to resolve, use a valid
recipient Stellar public key (`G...`); the external directory must be online
for named recipients to work.

### Transfer recovery and history

Before broadcasting a signed payment, the app saves its hash, public addresses,
amount, contract and Testnet network in this browser. It does not store private
keys or signed transaction payloads. If saving fails, the app stops before
broadcast and explains the storage problem.

The dashboard's **Transfer history** survives refreshes. Pending transfers can
be checked without signing or sending again. Network errors and missing records
remain uncertain; only an explicit network result confirms or fails a transfer.
Confirmed transfers offer receipts after a fresh network check. Connecting a
wallet filters history to transfers sent by that wallet.

History is local to this browser; clearing site data removes it. Cross-device
history and recovery require a backend and are not implemented.

Run `pnpm test` for amount, history recovery, confirmation-response,
configuration, clipboard and fee-comparison tests.
CI runs these checks and the workspace build on Linux and Windows with Node 22
and 24. Wallet signing still needs a manual Testnet verification. See
[validation and release acceptance](docs/TESTING.md) for coverage, known local
verification limits, and the browser acceptance procedure.

---

## 🔬 Testing — UI Only (no wallet needed)

1. Open the app in your browser
2. Enter any amount (e.g. `100`) in **You Send**
3. Enter any recipient (e.g. `alice*jisr.pay`)
4. Click **Find the Best Route**
5. Review the illustrative corridor comparison, then continue to payment review
6. Connect a wallet and resolve a valid recipient before signing. A federation
   lookup may fail if its external service is unavailable; use a valid public
   key for wallet testing. No-wallet testing cannot confirm settlement.

---

## 🔗 Testing — Full End-to-End (Stellar Testnet)

1. Install [Freighter](https://www.freighter.app/) in Chrome/Brave
2. Open Freighter → switch network to **Testnet**
3. Fund your account via [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test)
4. Click **Connect Wallet** in the app and approve
5. Enter an amount + a recipient `G...` address (self-send is fine on Testnet)
6. Click through all three agents — the Reconciler polls the ledger and fires confetti on confirmation
7. Verify the transaction at [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)

---

## 📁 Project Structure

```
artifacts/jisr-pay/
├── src/
│   ├── components/
│   │   ├── HeroScene.tsx      # react-three-fiber 3D metallic arc
│   │   └── AgentPipeline.tsx  # 3-agent pipeline UI + corridor table
│   ├── contexts/
│   │   └── I18nContext.tsx    # Language context (EN/AR)
│   ├── lib/
│   │   ├── corridors.ts       # Corridor data, fees, speeds
│   │   ├── i18n.ts            # Translation strings + useI18n() hook
│   │   └── stellar.ts         # Freighter + Stellar SDK helpers
│   ├── pages/
│   │   └── Home.tsx           # Single-page layout
│   ├── App.tsx
│   └── index.css              # Jisr design tokens + Google Fonts
└── vite.config.ts
```

---

## 🎨 Design System

| Token | Value | Use |
|---|---|---|
| Background | `#0a0a0f` | App background |
| Primary | `#7c3aed` | Violet — brand, buttons, accents |
| Primary Light | `#a78bfa` | Hover states, highlights |
| Gold | `#f59e0b` | Savings moments only |
| Surface | `#13131a` | Cards, inputs |
| Border | `#1e1e2e` | Dividers |

Fonts: **Plus Jakarta Sans** (Latin) · **IBM Plex Sans Arabic** (RTL)

---

## 🌐 Internationalisation

Toggle between English and Arabic using the **عربي / EN** button in the nav. The entire layout flips to RTL when Arabic is active — including the agent pipeline, corridor table, and form inputs. Add new strings to the `strings` object in `src/lib/i18n.ts`.

---

## 📋 Roadmap

- [x] 3-agent pipeline UI
- [x] Stellar Testnet integration
- [x] Freighter wallet connect
- [x] EN/AR bilingual + RTL
- [x] 3D hero scene
- [ ] Capacitor wrapper (Android / iOS)
- [ ] Mainnet deployment with KYC flow
- [ ] Real-time exchange rate feeds
- [ ] SMS OTP fallback for unbanked recipients

---

## 📄 License

MIT — built for hackathon demonstration purposes. Not financial advice; Testnet only.
