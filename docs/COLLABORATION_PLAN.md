# Repository ownership and implementation handoff

Decision recorded September 11, 2026, following the shared EthTobi/Freebuff proposal.

## Target repositories

| Repository | Lead | Initial location and scope |
| --- | --- | --- |
| jisr-web | EthTobi / Freebuff | Existing application; UI, wallet integration, localization, receipts and product copy. |
| jisr-sdk | EthTobi / Freebuff; Codex reviews backend consumption | Extract first into lib/jisr-sdk; reusable payment primitives, settlement checks and journal logic with their tests. |
| jisr-api | OTimileyin / Codex | Start in artifacts/api-server and lib/db; durable transfer tracking and read-only reconciliation. |
| jisr-routing | OTimileyin / Codex | Initially a module inside the API; extract only when real provider integrations justify independent releases. |
| payment-router-contract | Source holder, to be identified | Recover original contract source, tests and deployment evidence before publishing. |

Each repository keeps its own documentation. These are target boundaries, not five immediate migrations or five assumed funding submissions.

## Progress (2026-09-12)

- Steps 1–2 complete: organization `jisr-pay` exists, the repository was transferred, and the SDK was extracted into `lib/jisr-sdk` with web imports updated (branch `feat/extract-jisr-sdk`, 38 SDK + 18 web tests green, typechecks and web build verified).
- Step 6 complete: `jisr-pay/jisr-sdk` published with history preserved per docs/SDK_PUBLISH_RUNBOOK.md; its CI matrix passed on the first run. The pre-existing LICENSE-only initial commit in the destination was superseded (see the runbook postscript).
- Pending: merge of the extraction branch into main (with post-rename CI/Vercel verification), branch protection (ORG_SETUP §5), and Codex's interface review before backend implementation starts (handoff: docs/API_HANDOFF.md). The app repository was renamed to `jisr-web` on 2026-09-12; docs/RENAME_CHECKLIST.md records the remaining verification.

## Evidence and extraction boundaries

The current stellar.ts invokes route_payment via Soroban RPC. This establishes the client integration, but does not independently verify the current deployment, its source or its behavior. No Rust source, Cargo.toml or WASM was found in this checkout. Obtain original source and deployment provenance; do not reconstruct a contract and present it as the deployed original.

SDK candidates are amount.ts, errors.ts, rateLimit.ts, settlement.ts, reusable portions of stellar.ts, and transfer-history.ts. Move the relevant tests with them.

Before extraction:

- Separate Freighter and browser environment behavior from payment primitives. Keep wallet integration in the web app or an explicit optional adapter so backend imports do not require a browser.
- Inject network configuration into SDK operations. stellar.ts currently imports configuration through corridors.ts, whose product comparison data must remain in the app. Avoid Vite environment access in the SDK core.
- Resolve the logger dependency explicitly; avoid accidentally pulling app-only dependencies into the SDK.
- Keep i18n, branded receipts and illustrative corridor/fee comparisons in the web app.
- Keep storage injectable through HistoryStorage; backend persistence must not depend on browser local storage.

Existing exported names to preserve or intentionally migrate are TransactionResult, SavedTransfer, TransferStatus, HistoryStorage and TransferSettlement. There is no SettlementRecord declaration in the inspected journal file. The API will consume SDK types after extraction, rather than copy declarations or import from the web source tree.

## Sequence and concurrent editing

1. Identify the organization slug and owners, transfer the existing repository, and configure main to require PRs and passing checks. These GitHub changes are not completed by this document.
2. EthTobi extracts the SDK into the workspace and updates web imports. During this step, EthTobi owns web source, SDK source, root workspace/package configuration, TypeScript references and the lockfile.
3. Codex reviews the package exports from the backend consumer perspective. Verify Node imports, existing regression tests, typechecking and builds before the interface freeze.
4. Recover and publish the original contract source with its tests and deployment evidence. Source-holder work can proceed independently of extraction.
5. Begin parallel implementation against the stabilized SDK. Codex owns artifacts/api-server and lib/db; EthTobi owns web and SDK. Coordinate shared manifest/lockfile edits explicitly.
6. Promote the SDK into its own repository after the workspace extraction works. Review history preservation: a subtree split of a newly populated directory alone does not preserve the files' earlier history at their old paths. Select and inspect a migration that retains that provenance and contributor attribution.
7. Extract routing only after working provider integrations and a stable interface exist.

Use separate local checkouts or worktrees and task branches. Branches alone do not isolate simultaneous edits in one working directory. Neither assistant should claim the other has accepted a task or received a message until the human handoff occurs.

## Codex first backend milestone

Deliver persistent Testnet transfer tracking and a read-only reconciliation path after the SDK interface freeze. Signing and broadcasting remain in the wallet flow.

Acceptance criteria:

- Records are uniquely keyed by network and transaction hash; registering the same transfer is idempotent and cannot change its immutable identity fields.
- Client-supplied status is not settlement evidence. A trusted network lookup determines confirmation or explicit failure; missing transactions and transient network errors remain pending/unknown.
- A successful transaction alone does not prove the claimed recipient, amount or contract invocation. Verify those fields against network operation/event evidence before marking application payment details as verified.
- Store decimal amounts exactly, without floating-point conversion. Reuse SDK amount validation and settlement semantics.
- Store no private keys or signed transaction payloads. Do not add backend signing or automatic rebroadcasting to reconciliation.
- Define and implement wallet ownership verification before exposing private account history or accepting owner-scoped mutations. A supplied public address is not authentication.
- Handle concurrent registration and reconciliation atomically; an older response cannot overwrite a confirmed result.
- Test duplicate registration, conflicting identity fields, explicit network success/failure, missing transactions, transient lookup errors, ownership checks and concurrent state updates.
- Document environment configuration, migrations and the API contract with the implementation. Update the existing OpenAPI source and regenerate clients when routes are implemented.

Until the SDK interface is stable, backend work is limited to this contract and preparation; no duplicated payment implementation is introduced.

## Outstanding external inputs

- Organization slug and confirmation of who should hold organization ownership.
- Original payment_router source location and deployment evidence.
- The specific Drips round/link, for checking eligibility and submission requirements before applying.

Funding relationships should describe actual dependencies. No organization transfer, repository publication, branch-protection change, funding configuration or external message has been performed by writing this plan.
