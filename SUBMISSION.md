# Jisr Pay ? Stellar Testnet submission evidence

Updated October 9, 2026. This repository is a bilingual browser interface for native XLM payments through the source-built Testnet router. The browser consumes SDK 0.4.0, requires a positive wallet network report, verifies exact router/token events before confirmation, and saves transfer identity for recovery after reload. Corridor price comparisons are illustrative, not live executable exchange quotes.

## Current deployment and evidence

Live app: https://jisr-web.vercel.app/app
Docs: https://jisr-web.vercel.app/docs

The replacement deployment under EthTobi responds successfully and contains the current router/treasury configuration. The earlier browser tests were performed on a previous preview origin. The maintainer reported successful signing and confirmed both records remained Confirmed after reload. The two transactions were independently verified through Horizon and SDK router evidence:

| Total | Recipient | Treasury | Transaction |
| --- | --- | --- | --- |
| 4 XLM | 3.95 XLM | 0.05 XLM | [Explorer](https://stellar.expert/explorer/testnet/tx/81be73ff054b776938ade7c0efec3f790f433f67a2c34ab7c651c6bd10414ea8) |
| 7 XLM | 6.9125 XLM | 0.0875 XLM | [Explorer](https://stellar.expert/explorer/testnet/tx/1d90c10536b96038e32982c517a5fae2123acf968e265be2c365facb314e2a95) |

Each transaction charged an additional 0.002359 XLM network fee. These are Testnet demonstrations, not adoption or Mainnet evidence. A separate payment on the new hostname has not been independently observed.

## Validation and implementation

Merged implementation: [PR #42](https://github.com/jisr-pay/jisr-web/pull/42).
Deployment docs correction: [PR #44](https://github.com/jisr-pay/jisr-web/pull/44).

Local checks passed on Node 24.19.0: 62 shared SDK tests, 37 app tests, full workspace typechecks and production build. Run the pinned pnpm 11.8.0: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`.

Reviewed runtime revision after author rewrite: https://github.com/jisr-pay/jisr-web/commit/efd3b5c447ae49c9eadae9e010f6f371f2c263ed

Fresh passing CI: https://github.com/jisr-pay/jisr-web/actions/runs/37887155696

## Supported scope and remaining work

Native Stellar Testnet XLM only. Local browser history works; remote wallet backup is disabled because a public persistent API and same-origin /v1/wallet proxy are not deployed. Browser history is scoped to each hostname and does not automatically migrate. The treasury is a disposable demo account. Full mobile/RTL acceptance, wallet-decline acceptance, an operational treasury, Mainnet, security audit and operator adoption are not established.

SDK/API integration is merged. Contract/routing implementation remains reviewable in its own repositories and must be merged before presenting it as default-branch implementation. Documentation, author redistribution and Vercel account migration alone are not substantive grounds for a Drips appeal. Check the dashboard's rejection feedback and eligibility before submitting an appeal.
