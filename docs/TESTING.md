# Validation and release acceptance

From the repository root, run:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

The automated suite covers exact stroop amounts, journal persistence and
corruption, stale callbacks, settlement response validation (including
future-dated confirmations), Testnet configuration, clipboard failures,
total-fee comparisons, EN/AR dictionary parity, error classification —
exhaustively over every code with dedicated friendly copy — rate-limit windows,
corridor fee/speed claims, and the pure receipt payload (filename pattern,
hash and recipient truncation, settlement-time formatting). The reusable
primitives behind these tests live in `lib/jisr-sdk` (`@workspace/jisr-sdk`)
and run browser-free under Node; its suite also pins the public export
surface and verifies the SDK core stays free of Vite, DOM and wallet
references. Network responses in these tests are mocked. Tests never request
a wallet signature or send XLM.

The September 11, 2026 local verification passed 56 tests (38 SDK, 18 web),
the frontend TypeScript check, and the production Vite build (with the three.js and jsPDF
vendor libraries in dedicated chunks). Earlier local runs could not
build: the sandbox exports `PORT=0`, which `vite.config.ts` rejects, and the
same runs misread that as an esbuild subprocess failure. Invoking Vite directly
with valid variables builds the real output:

```sh
cd artifacts/jisr-pay
PORT=3000 BASE_PATH=/ node node_modules/vite/bin/vite.js build --config vite.config.ts
```

CI still builds on Linux and Windows, and a passing local typecheck does not
establish that the application works in a browser.

## Browser acceptance on Testnet

1. Open `/` and `/app` on desktop and mobile. Check both languages, themes,
   keyboard navigation, and the loading state on a slow connection.
2. Connect Freighter on Testnet. Decline a connection once and retry. Confirm
   repeated clicks do not open concurrent connection requests.
3. Enter an invalid amount and verify signing is unavailable. Use a valid,
   funded recipient public key when the federation service is unavailable.
4. Review full sender/recipient addresses, XLM amount, contract, and network.
   Approve one Testnet transfer and record its hash independently.
5. Reload while pending. Check the existing transaction without signing again.
   Disconnect the network and verify that uncertainty remains pending.
6. Restore connectivity, confirm the same hash, and compare the receipt with
   the explorer. Test PDF download with a blocked lazy-loaded chunk, then retry.
7. Check saved transfers in another tab and with a different connected wallet.
   In a disposable browser profile, test unavailable or damaged local storage:
   the application must not broadcast without saving the signed hash.

## Manual Testnet E2E checklist — Freighter signing run

Sign-off sheet for the one link automation cannot cover: a human completing a
real signature. Run it on the deployed production build serving the latest
`main` (not a local dev server), so the artifact reviewers and judges see is
what passes. Record the final transaction hash and run date in the evidence
notes when every row passes.

| # | Step | Pass when | Fail signal |
|---|------|-----------|-------------|
| 0 | Preconditions | Freighter installed, network set to **Testnet**, account funded from the friendbot faucet (≥ 2 XLM) | Balance fetch fails or shows 0 XLM after funding |
| 1 | Connect wallet | "Connect Freighter" succeeds with no console errors | Extension popup never opens, or repeated clicks open concurrent requests |
| 2 | Reject-then-retry | Declining the connection prompt shows a typed error with recovery copy; retrying connects cleanly | App freezes, or the second prompt never appears |
| 3 | Review screen | Amount + recipient (G… key) accepted; review shows full sender/recipient addresses, XLM amount, contract ID, and "Stellar Testnet" | Addresses truncated without a toggle, or wrong network label |
| 4 | Guardrails | Invalid amount or malformed recipient disables signing with a clear message | "Sign" stays clickable on invalid input |
| 5 | Sign | Freighter shows matching amount/recipient/fee; approving returns to a pending state, and the app records the hash **before** treating the transfer as sent | App declares success without a stored hash, or the hash appears only after confirmation |
| 6 | Reload while pending | Reloading mid-flight shows the same transaction still pending; no second signing prompt | Pending transfer vanishes, or the app prompts to sign again |
| 7 | Offline resilience | With connectivity cut, status stays pending (never flips to confirmed/failure); on restore it resolves with the same hash | Status changes while offline, or the hash changes after reconnect |
| 8 | Settlement + receipt | Confirmed state matches the hash on the Stellar Testnet explorer; receipt PDF downloads with amount, recipient, hash, timestamp | Explorer shows different amount/recipient, or the receipt omits the hash |
| 9 | Cross-tab + second wallet | Saved history lists the transfer in another tab and stays per-account under a different Freighter account | History leaks across accounts or disappears on reload |
| 10 | Federation copy | An unregistered federation name (e.g. `alice*jisr.pay`) produces the "not registered — paste a G… address" message, not "directory offline" | Message claims the directory is down while the service is healthy |

Rows 0–9 test behavior already covered by the automated suite where possible;
their value here is verifying the full chain in the deployed artifact with a
real wallet. Row 10 requires a deployment that includes the error-copy fix.

## Release artifact

The **Build and attest frontend artifact** workflow runs manually or when a
release is published. It tests and builds the workspace, archives the actual
frontend output, and uploads it to the workflow run for 30 days. It does not
deploy a site or attach an archive to the release page.

The workflow uses [GitHub's attestation action](https://github.com/actions/attest)
to associate build provenance with the archive. After downloading and extracting
the workflow artifact, verify the contained archive with:

```sh
gh attestation verify jisr-pay-frontend.tar.gz --repo OTimileyin/jisr-pay
```

A successful attestation establishes artifact provenance; it does not replace
the browser and wallet acceptance checks above. These checks and the hosted
workflow must pass before describing this work as release-verified.
