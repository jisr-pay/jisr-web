# Jisr Pay — Stellar developer tooling submission

Submission target: October 9, 2026 (Africa/Lagos). Evidence reviewed October 7.

## Purpose and implemented behavior

Jisr Pay provides a bilingual payment interface, reusable Stellar payment SDK,
and durable transfer-tracking API. The web pipeline compares illustrative
corridor fees, requests a Freighter signature, submits through Soroban RPC,
and retrieves settlement information. Wallets control signing; the API does
not sign or rebroadcast payments. Fee comparison data is static and does not
establish executable fiat quotes or guarantee the cheapest route.

The SDK currently invokes `route_payment(sender, recipient, treasury, token,
amount)` on a configured Testnet contract. The original assessment found the contract repository contained
only a README and LICENSE; deployed source, authorization behavior, fee splits,
and deployment provenance have not been verified from that repository.
The API verifies native XLM operation evidence, but does not yet verify
successful contract payment claims. Aligning these paths is a release gate.

## Review links

- Web demo: https://jisr-pay.vercel.app/ (HTTP 200 verified October 7;
  this check does not establish wallet acceptance).
- Web: https://github.com/jisr-pay/jisr-web
- SDK: https://github.com/jisr-pay/jisr-sdk (standalone repository exists;
  local workspace copy is `lib/jisr-sdk`).
- API: https://github.com/jisr-pay/jisr-api
- Contract: https://github.com/jisr-pay/payment-router-contract

## Reproducible checks

Web: pinned pnpm 11.8.0, `pnpm install --frozen-lockfile`, `pnpm test`,
`pnpm build`. API: Node 24.15–24.x, `npm ci`, `npm run check:sdk`,
`npm test`, `npm run build`. Both repositories have Linux/Windows CI.
See [readiness evidence](docs/WAVE_READINESS.md) for results and outstanding work.

## Submission acceptance

Recover and verify contract source and deployment evidence; record an actual
wallet-approved Testnet transaction and verify recipient, amount, and event
semantics. Complete EN/AR, RTL, mobile, reload/recovery, and wallet-decline
browser checks. Maintainers are xteesamz and EthTobi, available anytime via GitHub; the owner
confirms the Drips Wave App is installed. Verify its target-repository permissions. Submit each repository
on the strength of its implemented behavior and demonstrated ecosystem utility.
Mainnet support remains a future milestone requiring matching configuration,
authorization/security review, evidence verification, and operational acceptance.

## October 8 router evidence

A new independently tested router now has six passing Soroban tests, release WASM and a fresh [Testnet contract](https://stellar.expert/explorer/testnet/contract/CCGSUUQLWXKU6AZ6YKUNXLR7R6KLBYBG4AJGJ54XV4DC63AJ3LDVPNW4). The [authorized payment](https://stellar.expert/explorer/testnet/tx/6e79ed7847d34d19fb0d9f8bf43282cd583972537a41d539559a610a7f108910) produced exact recipient/treasury credits. This is independent contract evidence; current browser configuration, wallet acceptance and API contract-event verification remain separate gates.
