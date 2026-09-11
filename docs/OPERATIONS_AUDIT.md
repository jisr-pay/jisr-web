# Operations audit — 11 September 2026

The red GitHub checks have concrete configuration causes. They do not, by
themselves, prove that the deployed frontend is unavailable. The two most recent
deployment status records inspected both reported successful Vercel previews.

## Confirmed failures and local corrections

| Operation | Finding | Correction |
| --- | --- | --- |
| GitHub build | `webpack.yml` runs `npm install` and `npx webpack` against a pnpm workspace with Vite and no Webpack setup. Its latest inspected run failed at Build. | Use the pinned pnpm version, supported Node versions, frozen installation, workspace typechecking/build, and amount tests. |
| TypeScript compilation | `BridgeParticles.tsx` produced TS2741 because `bufferAttribute` omitted its required constructor arguments. | Supply `args={[livePositions, 3]}`. All workspace TypeScript checks subsequently passed. |
| Datadog checks | GitHub's annotation explicitly says `Missing API or APP keys to initialize datadog-ci!` | Skip with a visible notice when either credential is missing. Configured checks still run and can fail. |
| Local startup | The README's root `pnpm dev` command had no script. Both Vite configs threw without `PORT` and `BASE_PATH`. | Add the root frontend dev script and sensible defaults, retaining environment overrides. |
| Windows installation | Overrides explicitly removed Windows native binaries for esbuild, Rollup, Lightning CSS, and Tailwind. | Remove platform exclusion overrides; retain the release-age policy and security overrides. |
| Optional API development | Its script uses Unix `export`, which does not work in Windows cmd. | Use portable build/start scripts; the logger already defaults to development behavior without `NODE_ENV=production`. |
| Payment asset | The form selected USD/AED/KES/NGN but passed that number directly to an XLM-denominated contract call. No conversion exists. | Display test XLM only. Keep the $500 USD comparison explicitly separate and illustrative. Remove fictitious dollar savings from receipts and settlement results. |
| Payment confirmation | Clearing `isPolling` after a lookup failure also displayed the settled label and completion card. | Completion now requires the explicit `done` state. Preserve submitted hashes and offer confirmation retries without signing again. |
| Submission/reset | Reset could erase active payment state while an asynchronous operation continued. Mobile users could click a submit button that did nothing. | Block reset during submission/polling, invalidate stale recipient resolution and scan callbacks, use a synchronous submission guard, and disable unavailable signing. |
| Amount parsing | `Number(amount) * 10_000_000` loses precision for large values and permits ambiguous exponent input. | Validate decimal input before wallet access and convert directly with BigInt. |
| Copilot savings | It used the bank-wire entry as Jisr's fee and subtracted a fee from principal plus fees. | Compare fees consistently: the illustrative $500 example is $47.50 bank fees versus $2.00 Jisr fees, a $45.50 difference. |
| Saved language | An arbitrary saved language value indexed an undefined dictionary; blocked storage could also throw. | Validate the saved value and tolerate unavailable storage. |
| Landing rendering | The active story scene lacked the local error boundary used by the older hero. A rendering failure could replace the whole app with the root error screen. | Add a local boundary with a translated landing message and working app link. |
| Release provenance output | The build exported `steps.hash.outputs.digests`, but the hashing step produced `hashes`. | Correct the output mapping. |

## External or unfinished operations

- **Recipient directory is offline.** A GET to
  `https://stellar-tags-production.up.railway.app/federation?q=alice%2Ajisr.pay`
  returned HTTP 404 with `Application not found`, rather than a recipient record.
  Restore that Railway deployment or supply a working directory. The app now
  identifies this as a service outage and has a lookup timeout. A valid `G...`
  public key bypasses federation, but does not guarantee a successful payment.
- **Datadog credentials still need configuration** if these external checks are
  desired: `DD_API_KEY` and `DD_APP_KEY`. Skipping unconfigured checks is not a
  successful synthetic test run.
- **SLSA still describes placeholder files.** The release workflow creates
  `artifact1` and `artifact2` text files rather than building and attesting the
  deployed application. Fixing the output name does not make it a real app release.
- **Real currency conversion/payouts are not implemented.** The current payment
  route uses Stellar Testnet, and the comparison/chat data are fixed examples.
- **Transfer state now survives reloads in the same browser.** The follow-up
  implementation adds a versioned browser-local journal, status checks and
  receipt recovery. Cross-device persistence still requires a backend.
- **Wallet signing and contract execution need an end-to-end test.** RPC
  `getHealth` returned `healthy`, and the configured treasury account existed on
  Horizon. A read-only ledger lookup also found the configured contract instance,
  and the configured token ID matches native XLM on Testnet. These observations
  do not prove that `route_payment` executes successfully.

## Evidence

- [Failing Webpack workflow](https://github.com/OTimileyin/jisr-pay/actions/runs/34559597213)
- [Failing Datadog workflow](https://github.com/OTimileyin/jisr-pay/actions/runs/34559597270)
- [pnpm GitHub Actions setup](https://github.com/pnpm/action-setup)

## Validation

- Exact amount conversion and invalid-input regression tests: 2 tests passed
  with Node 24 using `--test-isolation=none` in the restricted environment.
- All workspace TypeScript checks passed: shared libraries, frontend, mockup
  sandbox, API scaffold, and scripts.
- Workflow YAML parsing passed. Lockfile overrides match the workspace and the
  restored Windows native packages are present. `git diff --check` passed.
- Dependencies were installed with lifecycle scripts skipped after the sandbox
  blocked subprocess creation. pnpm 10.34.5 was used as a local installation
  fallback after pnpm 11 encountered I/O failures; the project remains pinned to
  pnpm 11.8.0. The lockfile was regenerated for the restored native packages.
- Production build attempted but **not verified**: Vite's esbuild config loader
  failed with `spawn EPERM` in this environment. Run `pnpm install`, `pnpm build`,
  and the frontend tests in a normal terminal or the corrected GitHub workflow.
- Browser interaction, PDF rendering, and wallet integration were not exercised
  end to end. Payment-state changes were reviewed in code, not signed on-chain.
- No payment was signed or submitted, and no deployment was triggered.

## Follow-up implementation: transfer recovery

- The signed hash is saved before broadcast; saving failure prevents broadcast.
- History shows pending, confirmed and failed transfers and updates across open
  tabs. It never automatically resubmits a transaction.
- Network lookup validates the hash, success flag, ledger, timestamp and fee.
  Missing transactions and failed requests are not interpreted as payment failure.
- Saved receipts require a fresh network confirmation before download.
- The review screen shows the full sender, recipient, amount and Testnet network.
- New review/history text is available in English and Arabic; form inputs now
  have associated labels and decimal amount constraints.
- Fifteen amount, persistence and mocked-network regression tests pass. These
  tests do not sign a transaction or replace a browser/wallet integration test.
- CI now covers Linux and Windows, Node 22 and 24.

Manual acceptance checks for the next Testnet session:

1. Review a transfer, approve in Freighter, and verify that its hash appears in
   history before network confirmation finishes.
2. Refresh while pending. Use **Check status** on the existing record and verify
   that no second wallet-signing request appears.
3. Disconnect the network during confirmation. Verify that the transfer stays
   pending and that an explorer link remains available.
4. Restore connectivity and check again. Confirm the amount, hash, fee and
   timestamp in the downloadable receipt.
5. Switch languages and wallets; verify that history remains readable and the
   connected wallet filters the list correctly.
