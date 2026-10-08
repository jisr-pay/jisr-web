# Router integration — October 8, 2026

The SDK now verifies exact route_payment invocation identity, transaction hash, Testnet RPC identity, ledger and successful operation events. It requires the routed event and matching native-token transfers for both recipient net and treasury fee. Missing, duplicate, inconsistent or expired/unavailable RPC evidence remains pending. Diagnostic events cannot confirm payments.

The API consumes compiled SDK 0.4.0 and can opt into a server-controlled router policy. It checks agreement between Horizon settlement and RPC ledger before confirming contract claims. Set all router policy variables from .env.example together; never accept policy from a registration payload.

The web calls the verified SDK payment flow and uses the saved full transfer identity on recovery, rather than treating transaction success as payment confirmation. Wallet backup accepts supported router records; the API still enforces wallet ownership and matching evidence.

Default SDK configuration references the October 8 Testnet fixture, whose treasury key was disposable. This is a demonstration configuration, not an operational treasury. A maintained deployment needs its own reviewed policy and configuration. RPC history is bounded; evidence older than retention stays pending and requires an evidence archive adapter. No Mainnet, security audit, physical delivery or real Freighter acceptance is claimed.

Fresh SDK-driven payment: https://stellar.expert/explorer/testnet/tx/7bd2f4ee71912363bfc76a809bbdfd212c8d540e9f5063116a9b90519467b4fd

See SDK docs/sdk-router-payment-2026-10-08.json for exact event/balance credits and injected Node signer scope. API docs/router-live-verification-2026-10-08.json records live reconciliation. Checks and appeal text must cite the final reviewed/merged implementation revision.

Local checks: pnpm 11.8.0 frozen offline installation, 62 workspace SDK tests, 37 browser-library tests, full typecheck and production build passed. Browser review rendered exact fee/net in English and Arabic, including a 390px Arabic mobile viewport; screenshots are in docs/screenshots/. This was a review-screen check without Freighter signing.

RPC event and retention reference: https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getTransaction . Only successful contract events are used; diagnostic events are excluded.

Policy boundary: the verifier compares transaction evidence against configured policy. The pre-sign quote uses that configuration; live policy preflight and full token/treasury display before signing remain follow-up work in web issue #38. Configure it to match the immutable deployed policy.
