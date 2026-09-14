# Optional wallet history backup

The existing browser journal remains the payment recovery source. Remote backup
is disabled by default and is separate from signing or broadcasting payments.
It requires the wallet routes from jisr-api PR #1 (backend commit `803560f`).

## Local setup (PowerShell)

Start jisr-api with `WALLET_AUTH_ORIGIN=http://localhost:24519` and a Testnet
`HORIZON_URL=https://horizon-testnet.stellar.org`, following its README for
database and port configuration. Then start this frontend from the repository:

```powershell
$env:VITE_REMOTE_HISTORY_ENABLED = 'true'
$env:WALLET_API_TARGET = 'http://127.0.0.1:3001'
pnpm --filter @workspace/jisr-pay dev
```

Use the actual backend port. `WALLET_API_TARGET` is a Vite process environment
variable, not a browser setting; set it in the launching shell. Dev and preview
proxy `/v1/wallet/*` without removing the prefix. The backend must allow the
exact browser origin, including scheme and port. No service token belongs in
frontend configuration.

Production is not configured or deployed by this change. Before building with
`VITE_REMOTE_HISTORY_ENABLED=true`, provision a same-origin reverse proxy for
`/v1/wallet/*` to the reviewed backend, preserve the Origin header, and set its
`WALLET_AUTH_ORIGIN` to the public frontend origin. Avoid caching wallet responses.
Do not send requests to the service-only `/v1/transfers` routes. Without this
setup, leave the feature disabled.

## Behavior

- Connect a Testnet wallet, then explicitly sign a login message in the history
  section. The client verifies the challenge's origin, address, network, purpose,
  nonce and five-minute lifetime before requesting a signature.
- A session lasts at most 15 minutes. Its token stays in memory. Sign-out,
  component removal, account/network changes and expiry clear it; reload also
  discards it. Best-effort server revocation accompanies local sign-out. Wallet
  checks run every three seconds and before and after authenticated requests.
- Save each local native XLM record explicitly. Upload preserves every identity
  field, including the original submittedAt, and excludes local settlement state.
  Legacy non-null contract claims are not rewritten or uploaded.
- Remote records are paginated in hash order, not time order. Check status uses
  backend read-only reconciliation. Restore copies a record through the existing
  browser journal's immutable identity and monotonic settlement checks.
- Backend outages, unknown evidence, conflicts and unverified payments leave the
  local journal intact. No backup action signs or broadcasts a transaction.
  Refresh the backup after uploading to see the server's records.

## Validation and remaining browser acceptance

The Node client suite covers exact signing scope, rejection, expiry, wallet
switches, stale responses, authorization failure, pagination, immutable retries,
settlement validation and reconciliation uncertainty. EN/AR keys are checked by
the existing translation suite. Run `pnpm --filter @workspace/jisr-pay test`,
workspace typechecking and the frontend production build.

Before enabling for users, complete real Freighter Testnet acceptance: approve
and reject login, switch account/network while a request or signature is pending,
sign out and reload, expire a session, save a known native payment, page through
records, reconcile it without another signature, and restore it in a fresh
browser. Verify backend downtime leaves pending local history recoverable.
Automated client tests do not establish extension UX or deployed proxy behavior.

EthTobi can continue payment-flow component coverage and then refactor
AgentPipeline. Keep that work separate from the optional backup panel.
