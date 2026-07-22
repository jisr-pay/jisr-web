# Jisr Pay — Codebase Index

> **Gulf ↔ Africa remittances at Stellar speed — AI-routed, blockchain-settled.**
> A hackathon fintech demo: a 3-agent AI pipeline finds the cheapest corridor and settles
> a real payment on the Stellar testnet via a deployed Soroban contract, with a branded PDF
> receipt, light/dark theming, and full English/Arabic RTL support.

Paths below are repo-relative so they work regardless of machine or OS.

---

## 1. Monorepo layout

A **pnpm workspace** monorepo (pnpm `11.8.0`, Node 20+).

```
jisr-pay/
├── artifacts/               # Deployable apps (Replit "artifact" convention)
│   ├── jisr-pay/            # ⭐ The product — React/Vite frontend (this is what ships)
│   ├── api-server/          # Express scaffold — NOT used by the frontend, no real routes
│   └── mockup-sandbox/      # Replit design-preview sandbox, unrelated to the shipped app
├── lib/                     # Shared workspace packages
│   ├── api-spec/            # OpenAPI 3.1 spec (health check only)
│   ├── api-zod/             # Zod types generated from api-spec
│   ├── api-client-react/    # React Query hooks generated from api-spec
│   └── db/                  # Drizzle ORM + Postgres config — schema is EMPTY, unused
├── scripts/                 # Workspace utility scripts (currently a placeholder)
├── docs/
│   └── EDGE_CASES.md        # Every failure mode in the payment flow and how it's handled
├── attached_assets/         # Ad-hoc assets dropped in by Replit (image, kickoff prompt)
├── CLAUDE.md                # gstack skill-suite setup instructions for AI coding sessions
├── README.md                # Project overview (see "Known drift" — partially stale)
├── replit.md                # Replit run/operate notes (template, mostly unfilled)
├── SUBMISSION.md            # Hackathon submission pitch/architecture writeup
├── DEMO_SCRIPT.md           # 2-minute demo video script
├── MARKETING_STRATEGY.md    # Go-to-market strategy doc (not code, informational)
├── pnpm-workspace.yaml      # Workspace + supply-chain security settings (see §6)
├── vercel.json              # Deploy config: build command, output dir, CSP + security headers
├── tsconfig.base.json / tsconfig.json
└── package.json             # Root scripts: build, typecheck
```

### Workspace packages

| Package | Name | Path | Purpose |
|---|---|---|---|
| Frontend app | `@workspace/jisr-pay` | `artifacts/jisr-pay/` | The actual product — React 19 + Vite 7 SPA. **This is what's deployed to Vercel.** |
| API server | `@workspace/api-server` | `artifacts/api-server/` | Express 5 scaffold with a `/api/healthz` route and nothing else. Not deployed, not called by the frontend. |
| API spec | `@workspace/api-spec` | `lib/api-spec/` | OpenAPI 3.1 YAML — currently documents only the health check. |
| Zod types | `@workspace/api-zod` | `lib/api-zod/` | Generated from the OpenAPI spec via Orval. |
| React client | `@workspace/api-client-react` | `lib/api-client-react/` | Generated React Query hooks from the OpenAPI spec. Not imported anywhere in the frontend. |
| Database | `@workspace/db` | `lib/db/` | Drizzle ORM + `pg` Pool wired to `DATABASE_URL`. **`src/schema/index.ts` is empty (commented-out example only) — zero tables, zero usage.** |

**Bottom line:** the only thing that matters for running/understanding the product is `artifacts/jisr-pay/`. Everything else in `artifacts/` and most of `lib/` is unused Replit scaffolding.

---

## 2. The product: `artifacts/jisr-pay/`

### Tech stack

React 19 · Vite 7 · TypeScript · Tailwind CSS v4 · `wouter` (routing) · `next-themes` (light/dark) ·
TanStack Query · Framer Motion · `@react-three/fiber` + `@react-three/drei` + `three.js` (3D) ·
`@stellar/stellar-sdk` + `@stellar/freighter-api` (wallet + chain) · `jspdf` (receipts) ·
`canvas-confetti`.

### Source tree

```
artifacts/jisr-pay/src/
├── App.tsx                    # Root: RootErrorBoundary > ThemeProvider > QueryClientProvider
│                               #   > I18nProvider > TooltipProvider > Router. Renders <JisrCopilot/>
│                               #   globally (visible on every route) and global window
│                               #   error/unhandledrejection logging.
├── main.tsx                   # Vite entry point
├── index.css                  # Semantic HSL design tokens for light + dark themes; fonts
│
├── pages/
│   ├── Landing.tsx             # Route "/" — marketing page: sticky nav, story-driven 3D
│   │                            #   scrollytelling hero, HowItWorks, corridor highlights, footer.
│   │                            #   No wallet connect, no payment form.
│   ├── Home.tsx                 # Route "/app" — THE DASHBOARD. Wallet-connect nav + AgentPipeline.
│   │                            #   This is where a real payment is actually made.
│   └── not-found.tsx           # 404
│
├── components/
│   ├── AgentPipeline.tsx       # ⭐ THE core feature (730 lines). State machine: idle → step1
│   │                            #   (Rate-Scout scans corridors) → step2 (Router resolves
│   │                            #   federation + builds Soroban tx, Connect Wallet + Sign&Submit)
│   │                            #   → step3 (Reconciler polls Horizon) → done. Renders the
│   │                            #   corridor table, error banner, Payment Complete card with
│   │                            #   copy-hash / download-receipt / send-another / view-history
│   │                            #   actions. Client-side rate limiting + double-submit guards live
│   │                            #   here (via lib/rateLimit.ts).
│   ├── JisrCopilot.tsx         # Floating AI-assistant chat widget (draggable, theme-adaptive).
│   │                            #   Canned Q&A about savings/agents/corridors/Stellar — NOT a real
│   │                            #   LLM call, just local preset responses. Mounted globally in App.tsx.
│   ├── HeroScene.tsx           # react-three-fiber metallic torus-arc scene (procedural Lightformer
│   │                            #   lighting, no external HDR fetch) wrapped in an error boundary
│   │                            #   that falls back to a CSS gradient if WebGL/3D fails.
│   ├── ScrollHeroSection.tsx, StoryLandingSection.tsx, StoryScene.tsx, StoryBeats.tsx,
│   │   CameraRig.tsx, BridgeParticles.tsx, storyWaypoints.ts
│   │                            # A six-beat scroll-driven 3D camera fly-through used on the
│   │                            #   Landing page (bridge-open → pain-points → agent-pipeline →
│   │                            #   corridor-table → settlement → cta-rise). storyWaypoints.ts
│   │                            #   defines camera position/lookAt per scroll-progress waypoint;
│   │                            #   useScrollProgress (hooks/) drives it from scroll position.
│   ├── HowItWorks.tsx          # Static 3-step explainer (Rate-Scout/Router/Reconciler) + stats
│   │                            #   strip + "Why Stellar" panel. Bilingual.
│   ├── ThemeToggle.tsx         # Sun/moon light/dark switcher (next-themes)
│   ├── RootErrorBoundary.tsx   # App-wide error boundary — shows a "Reload" screen instead of a
│   │                            #   blank page for any uncaught render error
│   └── ui/                     # shadcn/ui + Radix primitives (accordion, dialog, toast, etc.) —
│                                #   standard generated component library, mostly unused directly
│                                #   except toast/toaster/tooltip/button
│
├── contexts/
│   └── I18nContext.tsx        # Provides t(), lang, toggleLang, isRTL app-wide
│
├── hooks/
│   ├── use-mobile.tsx          # useIsMobile() breakpoint hook
│   ├── use-toast.ts            # Toast state hook (backs components/ui/toaster.tsx)
│   └── useScrollProgress.ts    # Scroll-position → [0,1] progress ref, drives the story scroll scene
│
└── lib/
    ├── corridors.ts            # Corridor data (bank wire/cash pickup/mobile money/Jisr-Stellar),
    │                            #   fee math, and the real Stellar constants: CONTRACT_ID,
    │                            #   TREASURY_ADDRESS, TOKEN_ADDRESS, FEDERATION_API_BASE,
    │                            #   SOROBAN_RPC_URL, HORIZON_URL, NETWORK_PASSPHRASE (testnet)
    ├── stellar.ts               # (327 lines) Real payment flow — NO mocked transactions:
    │                            #   - connectFreighter/detectWalletEnvironment via
    │                            #     @stellar/freighter-api (requestAccess, direct-on-click)
    │                            #   - resolveFederation: real stellar-tags federation API call,
    │                            #     throws (no fallback wallet) if unresolved
    │                            #   - buildAndSubmitPayment: invokes route_payment on the
    │                            #     deployed Soroban contract (prepare/sign/send/confirm),
    │                            #     validates amount, checks network, retries transient
    │                            #     failures with backoff
    │                            #   - pollSettlement: polls Horizon for the confirmed tx,
    │                            #     throws on-chain failure rather than reporting fake success
    ├── receipt.ts               # (317 lines) generateReceiptPDF() — branded PDF receipt via
    │                            #   jsPDF: tx hash, addresses, fee, savings vs. bank wire,
    │                            #   contract ID. Triggered from AgentPipeline's Payment Complete card.
    ├── errors.ts                # Classifies raw SDK/Freighter/fetch errors into typed codes
    │                            #   (USER_REJECTED, WALLET_LOCKED, WRONG_NETWORK, NOT_FUNDED,
    │                            #   RECIPIENT_NOT_FOUND, DIRECTORY_UNAVAILABLE, NETWORK,
    │                            #   RATE_LIMITED, TIMEOUT, CONTRACT_FAILED) → user-facing messages
    ├── rateLimit.ts             # Client-side per-action min-gap + rolling-window limiter
    │                            #   (findRoute, submitPayment) — no backend to rate-limit against
    ├── logger.ts                # createLogger(scope) — leveled logger, debug/info suppressed
    │                            #   in production builds
    ├── i18n.ts                  # EN/AR string dictionary + useI18n() hook (localStorage-persisted)
    └── utils.ts                 # cn() Tailwind class merge helper
```

### Routing (`App.tsx`)

| Path | Component | Purpose |
|---|---|---|
| `/` | `pages/Landing.tsx` | Marketing/informational — 3D scrollytelling story, How It Works, corridor highlights. No payment tool. |
| `/app` | `pages/Home.tsx` | The dashboard — wallet connect + the actual `AgentPipeline` payment flow. |
| `*` | `pages/not-found.tsx` | 404 |

There is **no login/auth system** — this is intentional. Connecting a Freighter wallet *is*
the identity/authentication model (the address is cryptographically proven by the wallet's
signature). Traditional email/password auth would need a real backend + database, neither of
which the product uses.

---

## 3. The payment flow, end to end

1. **Rate-Scout** (`handleStart` in `AgentPipeline.tsx`) — reveals the 4 corridors
   (`lib/corridors.ts`) one at a time, sorts by fee, highlights the Jisr/Stellar route as
   cheapest. Client-rate-limited (`lib/rateLimit.ts`, `RULES.findRoute`).
2. **Router** (`handleStep1Proceed` / `handleConnectWallet` / `handleSubmitTx`) —
   - Resolves the recipient via `resolveFederation` (real stellar-tags API, or a raw `G...` key)
   - Connects Freighter (`connectFreighter`, official `@stellar/freighter-api`, called directly
     on click so the extension popup reliably appears)
   - Builds and submits the transaction (`buildAndSubmitPayment`) — invokes `route_payment` on
     the deployed Soroban contract with sender/recipient/treasury/token/amount, signs via
     Freighter, submits via Soroban RPC. Rate-limited (`RULES.submitPayment`) + hard
     double-submit guard.
3. **Reconciler** (`pollSettlement`) — polls Horizon for the confirmed transaction; on success
   shows the "Payment Complete" card (hash, fee, ledger, settlement time, savings vs. bank
   wire) with **Copy hash**, **Download Receipt** (PDF), **Send Another**, and **View History**
   (links to the account on stellar.expert) actions. Confetti fires on success.

**No step in this flow ever fabricates a result.** Every failure mode (unfunded wallet, wrong
network, unresolvable recipient, RPC timeout, on-chain failure) throws a typed, user-visible
error — see `docs/EDGE_CASES.md` for the full matrix.

---

## 4. Stellar network constants (testnet) — `lib/corridors.ts`

| Constant | Value |
|---|---|
| `CONTRACT_ID` | `CDNQ7OMHIFOLZHOKWQLOGDW7CF3DRMKXJC6OULNGNBWF4O4NO2NEIGER` |
| `TREASURY_ADDRESS` | `GAAFWEZKDYPXLTQGKQ3F23TXWYQUDAYTDW7P7VUQSVJFW2GWC4Y6LWST` |
| `TOKEN_ADDRESS` | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| `FEDERATION_API_BASE` | `https://stellar-tags-production.up.railway.app` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` |
| `NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |

This is real, already-deployed infrastructure (from the sibling `stellar-tags` project) —
not something this repo deploys itself. Mainnet is intentionally out of scope (no contract
deployed there, no free funding, real money at risk for no benefit to a testnet demo).

---

## 5. Corridors & fee model — `lib/corridors.ts`

| Corridor | Fee | Speed | Method |
|---|---|---|---|
| Bank Wire | 6.5% + $15 | ~2 days | SWIFT |
| Cash Pickup | 5.0% + $10 | ~30 min | Agent network |
| Mobile Money | 3.5% + $2 | ~15 min | M-Pesa API |
| **Jisr (Stellar)** | **0.4% flat** | **~5 sec** | Soroban contract |

`calculateTotal()`, `formatSpeed()`, `getBestCorridor()` are pure functions here — the easiest
part of the codebase to unit test (see `docs/EDGE_CASES.md` §"amount" for validation rules
applied before these numbers ever reach the chain).

---

## 6. Deployment & security

- **Hosting:** Vercel, auto-deploys on every push to `main` (`vercel.json`: install/build
  commands target the `artifacts/jisr-pay` workspace, output `dist/public`, SPA rewrite to
  `index.html`).
- **Headers (`vercel.json`):** a scoped Content-Security-Policy (`script-src 'self'
  'unsafe-inline'`, `connect-src` limited to the 4 Stellar/federation hosts above + Google
  Fonts allowances, `frame-ancestors 'none'`), plus `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Supply-chain (`pnpm-workspace.yaml`):** `minimumReleaseAge: 1440` (packages must be
  published ≥1 day before install is allowed — supply-chain-attack defense), a curated
  `minimumReleaseAgeExclude` allowlist, and a long list of platform-specific `overrides` that
  strip unused OS/arch binaries (esbuild, lightningcss, rollup, tailwindcss/oxide, ngrok) since
  the build only runs on Linux x64.
- **No database, no backend in production.** `artifacts/api-server` and `lib/db` exist but are
  not part of the deployed app.

---

## 7. Documentation map

| File | What it's for |
|---|---|
| `CLAUDE.md` | Tells AI coding sessions to install/use the **gstack** skill suite (`/qa`, `/ship`, `/review`, etc.) |
| `docs/EDGE_CASES.md` | Every edge case in the payment flow (wallet, amount, federation, network, lifecycle) and exactly how it's handled — pairs with `lib/errors.ts` / `lib/rateLimit.ts` |
| `SUBMISSION.md` | Hackathon submission pitch: problem, 3-agent architecture, key features, tech stack |
| `DEMO_SCRIPT.md` | Timestamped script for a 2-minute demo video |
| `MARKETING_STRATEGY.md` | Go-to-market strategy — business doc, not implementation detail |
| `README.md` | Project overview and quickstart — **see drift note below** |
| `replit.md` | Replit run/operate template — mostly unfilled placeholder text |

### Known drift (worth fixing, not yet reconciled)

`README.md` describes an earlier state of the app and is now out of date in a few places: it
says the theme is "dark-only" (light/dark theming was added later via `next-themes` +
`ThemeToggle`), describes a single `Home.tsx` page (the app is now split into
`Landing.tsx` + `Home.tsx`), and doesn't mention `JisrCopilot`, the PDF receipt, or the
rate-limiting/error/logging hardening. Treat this index and the source tree as the source of
truth over `README.md` until it's refreshed.

---

## 8. Development commands

```bash
pnpm install                                          # install (from repo root)
pnpm --filter @workspace/jisr-pay run dev              # frontend dev server (needs PORT, BASE_PATH env vars)
pnpm --filter @workspace/jisr-pay run build            # production build → dist/public
pnpm --filter @workspace/jisr-pay exec tsc --noEmit    # typecheck the frontend only
pnpm run typecheck                                     # typecheck every workspace package
pnpm run build                                         # typecheck + build everything (root script)
```

The frontend's `vite.config.ts` requires `PORT` and `BASE_PATH` env vars to be set (throws
otherwise) — Vercel's build command in `vercel.json` sets them; locally, export them yourself
(e.g. `PORT=3000 BASE_PATH=/`).
