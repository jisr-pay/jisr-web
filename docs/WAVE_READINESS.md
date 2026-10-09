# Current readiness update ? October 9

Use [SUBMISSION.md](../SUBMISSION.md) for the current deployment, merged integration, new revisions/CI and verified Testnet payment evidence. The October 7 assessment below is historical; its old URL, hashes and integration gaps have been superseded. API hosting and full browser acceptance limits remain explicitly documented in the current brief.

---

# Jisr Wave readiness — October 9, 2026

## Audit scope and evidence

Reviewed October 7, 2026 against the local web/API source and public GitHub APIs.
The local web HEAD matches remote main `c7904b60b8341e5fbc7af1692aa91e420f32fdc7`;
API HEAD matches `43592e5d0a519c4fdc3b7cb1d354c5d8b251c7ba`.
The standalone SDK is at `4a21043ec238a11adbc9c99f858e438fbc4fad9e`. Its
source files match the web workspace SDK byte-for-byte.
Changes are on `docs/wave-readiness-oct09`; they have not been pushed.

| Component | Existing implementation | Remaining submission evidence |
| --- | --- | --- |
| Web | EN/AR interface, Freighter, SDK integration, local/optional API history, receipts | Browser signing, mobile/RTL/recovery acceptance, payment-path alignment |
| SDK | Compiled exports, exact amounts, injectable wallet/network/storage, regression tests | Standalone revision parity and contract/deployment provenance |
| API | SQLite persistence, wallet sessions, native-operation verification, migrations | Contract evidence decoding or alignment with native web payments; live deployment acceptance |
| Contract | README and LICENSE only | Original Rust source, authorization tests, reproducible WASM, deployment transaction |
| Routing | README and LICENSE only | Implemented provider/routing behavior and independent utility |

`https://jisr-pay.vercel.app/` returned HTTP 200 on October 7. Browser wallet
acceptance and successful payment execution were not established by this probe.

Existing remote CI results observed October 7:
- [Web build/typecheck passed](https://github.com/jisr-pay/jisr-web/actions/runs/34912420697).
- [API checks passed](https://github.com/jisr-pay/jisr-api/actions/runs/35065896709).
These runs concern existing remote commits, not the unpushed changes.

## Priority before October 9

1. **October 7:** Correct submission claims; document governance; run local checks;
   record application status and verify eligibility; identify original contract holder.
2. **October 8:** Resolve contract-versus-native payment alignment with the web/SDK
   maintainer. Recover contract provenance and execute authorized Testnet acceptance.
   Record transaction hash, network, sender/recipient, exact amount, and observed
   events. Confirm API proxy/deployment and wallet-session browser acceptance.
3. **October 9:** Review and publish completed changes through PRs; capture passing
   CI and deployment evidence; submit eligible repositories with actual capabilities.
   Placeholder repositories need substantive implementation before representing
   them as working payment infrastructure.

## Governance

The organization `.github` repository already supplies CONTRIBUTING.md,
SECURITY.md, CODE_OF_CONDUCT.md, and a PR template. This upgrade adds a maintainer
record and issue-link/branch conventions; the API gains local contribution guidance.
The owner confirmed EthTobi as a maintainer on October 7. Confirm current
organization membership and GitHub App coverage before applying to Drips. The owner confirmed GitHub contact and anytime availability. Component roles
still need confirmation. A web `main-protection` ruleset is active. The API
ruleset endpoint returned no repository rulesets; branch protection or inherited
organization rules must be inspected separately before concluding it is unprotected.
Drips Wave App installation is owner-confirmed as of October 7; repository
coverage and permissions remain independently unverified.

## Release gates and network configuration

The SDK calls a Soroban router and journals a non-null contractId. Remote-history
registration accepts only native records; the API does not confirm successful
contract claims without matching evidence. Do not rewrite old contract records as
native payments. Choose and implement a supported path, preserving immutable
identity and pending outcomes when evidence is incomplete.

Current signing uses `Test SDF Network ; September 2015` and the Testnet XLM
token. `Public Global Stellar Network ; September 2015` is the Mainnet passphrase,
but current SDK configuration rejects it. Mainnet release requires tested network
support, recovered contract source, authorization review, event verification,
and operational acceptance. Renaming the status to v1.0-RC cannot establish these.

## Wave enrollment and appeals

Verify [current maintainer rules](https://docs.drips.network/wave/maintainers/participating-in-a-wave/).
First appeal: at least two weeks after rejection; declined appeals: one-month
cooldown; maximum three appeals per repository. Submit through Maintainers →
Orgs and Repos → Appeal. The owner reports no rejection feedback. Current application status is not yet
established; use the initial application flow if the repository has not been
rejected. Appeal timing/history checks apply only to rejected repositories.
Approval is not guaranteed.

Proposed backlog complexity is planning metadata. Enroll approved-repository
issues through the app and set actual complexity there; GitHub Wave-label
addition defaults to trivial. `complexity: medium` alone is not enrollment.
See [points rules](https://docs.drips.network/wave/points-and-rewards/).

## Local verification

- `git diff --check`: passed in all six Jisr child repositories after the edits.
- SDK standalone/workspace source comparison: all source files match.
- Web `pnpm test`: did not reach tests because its automatic dependency installation
  timed out. Explicit frozen-lockfile installation retried using cached downloads
  but stalled on remaining tarballs. Dependency-download processes were stopped;
  caches remain available for a later retry. No test or build pass is claimed.
- API `npm run build`: JavaScript syntax and OpenAPI JSON checks passed under
  the available Node 22 runtime; repeat under supported Node 24 before release.
- API `npm ci`: stalled on package downloads. The SDK isolated consumer check
  failed with `ENOTCACHED` because installation had not populated the needed cache.
- The installed runtime is Node 22.23.2; API tests require Node 24.15–24.x.
  Fetching the official Node 24 archive timed out before completion. API tests
  remain unrun. Recent remote API CI passed on Node 24 as linked above.

Retry the documented install/check commands with a working registry connection
and the supported runtimes before submission. These local environment failures
are verification limits, not evidence of application test failures.

## October 8 implementation update

The router repository now has a new independently tested implementation, a release WASM and a fresh Testnet deployment at CCGSUUQLWXKU6AZ6YKUNXLR7R6KLBYBG4AJGJ54XV4DC63AJ3LDVPNW4. An authorized fee-split payment and exact credits were verified. This does not recover older deployment provenance or establish browser acceptance. The standalone routing package now has a tested Horizon quote/selection and unsigned path-operation implementation. API contract claims still remain unverified.

API checks passed again on Node 24.15.0 (41 tests, build/OpenAPI and isolated SDK consumer); standalone SDK tests/build passed again (49 tests). Web frozen install was retried with pinned pnpm 11.8.0 and stalled on eight unavailable package downloads. Earlier remote CI is separate evidence; no fresh local full web build is claimed until completed.
