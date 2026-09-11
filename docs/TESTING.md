# Validation and release acceptance

From the repository root, run:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

The automated suite covers exact stroop amounts, journal persistence and
corruption, stale callbacks, settlement response validation, Testnet
configuration, clipboard failures, total-fee comparisons, EN/AR dictionary
parity, error classification and rate-limit windows, and corridor fee/speed
claims. Network responses in these tests are mocked. Tests never request a
wallet signature or send XLM.

The September 11, 2026 local verification passed 46 tests and the frontend
TypeScript check. Tests used Node's `--test-isolation=none` because this sandbox
restricts subprocesses. The production Vite build remains unverified locally:
esbuild's config loader failed with `spawn EPERM`. A passing typecheck does not
establish that the application bundles or works in a browser.

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
