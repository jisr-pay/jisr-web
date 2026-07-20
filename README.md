# Jisr Pay 🌉

> **Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled, a fraction of the cost.**

Jisr Pay is a hackathon fintech demo that reimagines cross-border remittances for Gulf-to-Africa corridors. A 3-agent AI pipeline (Rate-Scout → Router → Reconciler) finds the best route, builds a Stellar transaction, and settles it on-chain in seconds — all from a single-page web app with full English/Arabic RTL support.

---

## ✨ Features

| Feature | Details |
|---|---|
| **3-Agent AI Pipeline** | Rate-Scout scans corridors, Router resolves addresses & builds Stellar txs, Reconciler polls the ledger and confirms settlement |
| **Stellar Blockchain** | Real `@stellar/stellar-sdk` integration — Testnet by default, Mainnet-ready |
| **Freighter Wallet** | Native browser-extension wallet connect; graceful fallback for mobile |
| **Corridor Comparison** | Live fee/speed table — Bank Wire, Cash Pickup, Mobile Money vs Jisr's 0.4% Stellar route |
| **English / Arabic** | Full i18n with RTL layout mirroring, IBM Plex Sans Arabic, `dir` switching |
| **3D Hero** | `react-three-fiber` metallic torus-arc scene with mouse-hover radial reveal |
| **Confetti Settlement** | `canvas-confetti` burst on transaction confirmation |

---

## 🗺️ Supported Corridors

| From | To | Methods |
|---|---|---|
| UAE (AED) | Nigeria (NGN) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Saudi Arabia (SAR) | Kenya (KES) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Kuwait (KWD) | Ghana (GHS) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |
| Qatar (QAR) | Ethiopia (ETB) | Bank Wire · Cash Pickup · Mobile Money · **Jisr Stellar** |

---

## 🏗️ Tech Stack

- **Frontend** — React 18 + Vite + TypeScript
- **3D** — `@react-three/fiber`, `@react-three/drei`, `three.js`
- **Blockchain** — `@stellar/stellar-sdk` (Horizon API)
- **Styling** — Tailwind CSS v4, dark-only theme
- **i18n** — Custom `useI18n()` hook with EN/AR dictionary
- **Animations** — `canvas-confetti`
- **Router** — `wouter`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

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
# Start all services (web app + API server)
pnpm run dev
```

---

## 🔬 Testing — UI Only (no wallet needed)

1. Open the app in your browser
2. Enter any amount (e.g. `100`) in **You Send**
3. Enter any recipient (e.g. `alice*jisr.pay`)
4. Click **Find the Best Route**
5. Watch the 3-agent pipeline animate through all three steps
6. The Reconciler will pause and prompt you to connect a wallet — that's expected

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
