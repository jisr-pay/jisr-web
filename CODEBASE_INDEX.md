# Jisr Pay — Codebase Index 🌉

> **Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled.**
> A hackathon fintech demo featuring a 3-agent AI pipeline, Stellar blockchain settlement, branded PDF receipt generation, dual Light/Dark theme engine, and English/Arabic RTL support.

---

## Monorepo Overview

This is a **pnpm workspace** monorepo. Package manager: `pnpm 11+`. Node version: `20+`.

```
jisr-pay/
├── artifacts/          # Deployable applications
│   ├── jisr-pay/       # React frontend (Vite + TS + Tailwind v4)
│   ├── api-server/     # Express API server (Node + TS)
│   └── mockup-sandbox/ # Design sandbox
├── lib/                # Shared libraries (workspace packages)
│   ├── api-spec/       # OpenAPI 3.1 specification
│   ├── api-zod/        # Generated Zod types from OpenAPI
│   ├── api-client-react/ # Generated React Query client from OpenAPI
│   └── db/             # Drizzle ORM schema + DB config
├── scripts/            # Monorepo utility scripts
├── docs/               # Documentation & Edge cases
├── SUBMISSION.md       # Complete hackathon pitch & architecture document
├── DEMO_SCRIPT.md      # 2-minute video presentation script
├── MARKETING_STRATEGY.md # ⭐ Global Go-To-Market & Growth Strategy Blueprint
├── pnpm-workspace.yaml # Workspace config + allowBuilds script security settings
├── tsconfig.base.json  # Shared TS config
└── vercel.json         # Deployment config + strict Content Security Policy headers
```

---

## Workspace Packages

| Package | Name | Path | Purpose |
|---|---|---|---|
| Frontend App | `@workspace/jisr-pay` | `artifacts/jisr-pay/` | React 19 + Vite 7 SPA |
| API Server | `@workspace/api-server` | `artifacts/api-server/` | Express 5 REST API |
| API Spec | `@workspace/api-spec` | `lib/api-spec/` | OpenAPI 3.1 YAML |
| Zod Types | `@workspace/api-zod` | `lib/api-zod/` | Generated Zod schemas |
| React Client | `@workspace/api-client-react` | `lib/api-client-react/` | Generated React Query hooks |
| Database | `@workspace/db` | `lib/db/` | Drizzle ORM + PostgreSQL schema |

---

## Frontend App (`artifacts/jisr-pay/`)

**Tech Stack:** React 19, Vite 7, TypeScript, Tailwind CSS v4, Wouter (routing), `next-themes` (Light/Dark mode), TanStack Query, Framer Motion, Three.js, jsPDF.

### Source Structure

```
artifacts/jisr-pay/src/
├── App.tsx               # Root component — ThemeProvider + Router + QueryClient + ErrorBoundary
├── main.tsx              # Vite entry point
├── index.css             # Semantic HSL design system (Light & Dark theme variables)
├── pages/
│   ├── Landing.tsx       # ⭐ Public Landing Page route (/) — Nav + 3D Hero + Features + Corridors + Footer
│   ├── Home.tsx          # ⭐ App Dashboard route (/app) — Wallet Connect + AgentPipeline
│   └── not-found.tsx     # 404 Error page
├── components/
│   ├── AgentPipeline.tsx # ⭐ Core 3-Agent pipeline UX + live route comparison + PDF download (34KB)
│   ├── JisrCopilot.tsx   # ⭐ Floating AI Assistant widget with interactive remittance intelligence
│   ├── HeroScene.tsx     # Three.js 3D metallic torus-arc hero animation with cursor radial mask
│   ├── HowItWorks.tsx    # Animated 3-step breakdown of AI Agents
│   ├── ThemeToggle.tsx   # Sun/Moon light/dark mode switcher component
│   ├── RootErrorBoundary.tsx # Global React error boundary
│   └── ui/               # Radix UI & shadcn/ui primitives
├── contexts/
│   └── I18nContext.tsx   # Language context — provides `t()`, `lang`, `toggleLang`, `isRTL`
├── hooks/
│   ├── use-mobile.tsx    # `useIsMobile()` responsive breakpoint hook
│   └── use-toast.ts      # Toast notification system hook
└── lib/
    ├── corridors.ts      # Corridor data, fee/speed math, Stellar constants
    ├── receipt.ts        # ⭐ Client-side PDF receipt generator using jsPDF (12KB)
    ├── i18n.ts           # EN/AR translation dictionary + `useI18n()` hook
    ├── stellar.ts        # Freighter wallet SDK & Horizon transaction builder (11KB)
    ├── rateLimit.ts      # Client-side rate limiting protection
    ├── errors.ts         # Error normalization & user feedback formatting
    ├── logger.ts         # `createLogger()` scoped logging system
    └── utils.ts          # `cn()` Tailwind class merger
```

---

## Recent Feature Developments

### 1. 🌓 Light & Dark Theme Engine
- **`next-themes` Integration**: Added `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` in `App.tsx`.
- **Semantic CSS System (`index.css`)**: Defined full Light Mode HSL palette in `:root` and Dark Mode palette under `.dark`.
- **`ThemeToggle.tsx`**: Created animated Sun/Moon toggle button added to `Landing.tsx` and `Home.tsx` headers.
- **Background Tokenization**: Replaced all hardcoded dark hex codes (`bg-[#0d0d14]`, `bg-[#111118]`, `bg-[#08080c]`) with semantic Tailwind classes (`bg-background`, `bg-card`, `bg-muted`).

### 2. 🧾 Branded PDF Receipt Download (`lib/receipt.ts`)
- **jsPDF Integration**: Built `generateBrandedReceiptPDF()` generating styled PDF receipts upon transaction settlement.
- **Receipt Details**: Cryptographic Stellar transaction hash, sender/recipient addresses, fee breakdown, and savings vs bank wire calculation.
- **Pipeline Trigger**: Integrated "Download PDF Receipt" action into `AgentPipeline.tsx` post-settlement state.

### 3. 🛣 Landing & Dashboard Route Separation
- **`Landing.tsx` (`/`)**: Dedicated marketing presentation page featuring the interactive 3D hero scene, feature benefits, how-it-works cards, and corridor comparison table.
- **`Home.tsx` (`/app`)**: Dedicated transaction dashboard hosting Freighter wallet connection and the full 3-Agent pipeline UX.

### 4. 🛡 Content Security Policy & Build Hardening
- **Google Fonts CSP**: Configured `vercel.json` headers and `index.html` meta tags with explicit `style-src` (`fonts.googleapis.com`) and `font-src` (`fonts.gstatic.com`) permissions.
- **PNPM v11 Compatibility**: Configured `allowBuilds` in `pnpm-workspace.yaml` for `esbuild` and `core-js`.
- **Three.js Deprecation**: Updated `HeroScene.tsx` frame animation loop from `state.clock` to frame `delta` time.

---

## Key Files Summary

| File | Purpose |
|---|---|
| [App.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/App.tsx) | App Root: ThemeProvider, QueryClientProvider, I18nProvider, TooltipProvider, Router |
| [Landing.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/pages/Landing.tsx) | Marketing Landing Page (`/`): Glassmorphism Header, 3D Hero, Features, Corridors Table |
| [Home.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/pages/Home.tsx) | Remittance App (`/app`): Wallet connection + AgentPipeline execution container |
| [AgentPipeline.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/components/AgentPipeline.tsx) | Core Pipeline: Rate-Scout → Router → Reconciler state machine & PDF download trigger |
| [HeroScene.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/components/HeroScene.tsx) | 3D WebGL metallic Torus bridge with radial cursor reveal mask |
| [ThemeToggle.tsx](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/components/ThemeToggle.tsx) | Sun/Moon theme switcher component for navigation bars |
| [receipt.ts](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/lib/receipt.ts) | Branded PDF receipt generator built with `jsPDF` |
| [corridors.ts](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/lib/corridors.ts) | Corridor definitions (AED, SAR, QAR, KWD to NGN, KES, GHS, ETB), fee math & Stellar constants |
| [stellar.ts](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/lib/stellar.ts) | Freighter wallet SDK integration, Soroban RPC connection, Horizon ledger polling |
| [i18n.ts](file:///c:/Users/USER/Documents/jisr-pay/artifacts/jisr-pay/src/lib/i18n.ts) | Translation dictionary (EN/AR) & `useI18n()` hook |

---

## Design System (`src/index.css`)

| Token | Light Mode | Dark Mode | Purpose |
|---|---|---|---|
| `--background` | `hsl(0, 0%, 100%)` | `hsl(240, 10%, 4%)` | Page background |
| `--foreground` | `hsl(240, 10%, 4%)` | `hsl(240, 5%, 93%)` | Primary text |
| `--card` | `hsl(0, 0%, 100%)` | `hsl(240, 8%, 7%)` | Cards & containers |
| `--primary` | `hsl(258, 84%, 57%)` | `hsl(258, 84%, 57%)` | Royal Violet brand color (`#7c3aed`) |
| `--muted` | `hsl(240, 5%, 96%)` | `hsl(240, 8%, 12%)` | Muted elements & table headers |
| `--border` | `hsl(240, 5%, 90%)` | `hsl(240, 8%, 14%)` | Component borders |

Fonts: **Plus Jakarta Sans** (Latin) · **IBM Plex Sans Arabic** (RTL)

---

## Supported Corridors & Fee Structure

| Gulf Currency | Recipient Currency | Rail Comparison |
|---|---|---|
| UAE (AED) | Nigeria (NGN) | Bank Wire: 6.5% + $15 (2 days) |
| Saudi Arabia (SAR) | Kenya (KES) | Cash Pickup: 5.0% + $10 (30 mins) |
| Kuwait (KWD) | Ghana (GHS) | Mobile Money: 3.5% + $2 (15 mins) |
| Qatar (QAR) | Ethiopia (ETB) | **Jisr Stellar: 0.4% flat (~5 seconds)** |

---

## Stellar Network Constants (Testnet)

| Constant | Value |
|---|---|
| `CONTRACT_ID` | `CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER` |
| `TREASURY_ADDRESS` | `GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` |

---

## Development & Build Commands

```bash
# Install dependencies
pnpm install

# Start frontend dev server
pnpm --filter @workspace/jisr-pay run dev

# Start API server
pnpm --filter @workspace/api-server run dev

# Typecheck all workspace packages
pnpm run typecheck

# Production build
pnpm run build
```
