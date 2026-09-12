# Jisr Pay organization and repository setup

This is the setup guide for OTimileyin (Codex) and EthTobi (Freebuff).
Organization name proposed: `jisr-pay`, subject to GitHub availability.
All repositories belong to the organization; the lead below owns day-to-day implementation.

## 1. Repository names and responsibilities

| Final GitHub repository | Lead | What to do now |
| --- | --- | --- |
| jisr-pay/jisr-web | EthTobi / Freebuff | Transfer the existing jisr-pay repository; rename to jisr-web after SDK extraction. Do not create an empty duplicate. |
| jisr-pay/jisr-sdk | EthTobi / Freebuff | Extract into lib/jisr-sdk first, including tests; publish separately after verification. Codex reviews Node/backend compatibility. |
| jisr-pay/jisr-api | OTimileyin / Codex | Backend, database, durable transfer history and reconciliation. Migrate the existing API scaffold into its own checkout after SDK interfaces stabilize. |
| jisr-pay/jisr-routing | OTimileyin / Codex | Start inside jisr-api. Create this separate repo when real quote providers and independent releases justify it. |
| jisr-pay/payment-router-contract | Original source holder; lead pending | Recover original source, tests and deployment evidence before publication. |

Keep documentation with each code repository. No separate jisr-docs repository is planned.
These are five target repositories, not five immediate funding submissions.

## 2. Create the GitHub organization

1. Sign into GitHub as OTimileyin.
2. Open profile picture > Settings > Organizations > New organization.
3. Choose the Free plan for this public-repository setup.
4. Enter `jisr-pay` if available, provide a contact email, complete GitHub's ownership/billing prompts accurately, and create the organization. If unavailable, choose an agreed alternative and replace the organization prefix throughout this guide.
5. Open the organization > People > Invite member. Invite the actual GitHub account `EthTobi` as an Owner, and have that person accept.
6. Confirm both human accounts appear as owners. Codex and Freebuff are development tools, not additional human owners.
7. Under organization Settings > Member privileges, use Read as the base permission. Optionally restrict repository creation by ordinary members; owners manage planned repositories.
8. Review the organization's two-factor authentication settings with both owners.

Official instructions: https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch

## 3. Transfer the existing repository

1. Do not create `jisr-pay/jisr-pay` in advance: the destination must not already contain a repository with that name.
2. Open `OTimileyin/jisr-pay` > Settings > General > Danger Zone > Transfer ownership.
3. Select the new organization as owner. Keep the repository name `jisr-pay` during extraction.
4. Read GitHub's transfer notices, type the requested repository name, and confirm.
5. Verify that `https://github.com/jisr-pay/jisr-pay` contains the expected code, commits, branches, issues and PRs.
6. Review repository access and existing branch protection/rulesets after transfer. Do not assume they were removed; plan and organization policy affect available features.

GitHub preserves commit information, issues, PRs and associated webhooks/secrets/deploy keys. Old Git URLs redirect, but updating each checkout is recommended:

```powershell
git remote set-url origin https://github.com/jisr-pay/jisr-pay.git
git remote -v
```

Official transfer behavior and steps: https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

## 4. Verify CI and deployment

1. Check Actions access, repository secrets and organization Actions policies.
2. Open a small documentation PR to trigger the existing pull-request workflow. A repository transfer itself is not a push event.
3. Confirm the Build and typecheck matrix passes on Ubuntu and Windows with Node 22 and 24.
4. Check Vercel's GitHub App access to the organization and the project's connected repository. Reconnect only if necessary; do not assume the transfer broke the webhook or requires a replacement Vercel project.
5. Verify a preview deployment and the existing production URL, environment variables and domain configuration.
6. Update absolute repository links in project documentation as needed.
7. Leave old branch cleanup separate from migration. Inspect current remote branches and preserve any unique work before considering deletion.

## 5. Protect main

For each code repository once its workflow exists:

1. Open repository Settings > Branches > Add branch protection rule, targeting `main`. A ruleset targeting main is also suitable.
2. Require a pull request and one approval from the other human contributor.
3. Dismiss stale approvals after new commits.
4. Require passing checks; select names from an actual workflow run. The existing workspace matrix should report:
   - `build (ubuntu-latest, 22.x)`
   - `build (ubuntu-latest, 24.x)`
   - `build (windows-latest, 22.x)`
   - `build (windows-latest, 24.x)`
5. Require the branch to be up to date and review conversations resolved.
6. Disable bypass of these requirements, force pushes and branch deletion on main.
7. Enable squash merging; use the project's `type: subject` PR title convention.
8. Verify the rule targets main and that a normal PR requires checks and another person's approval. Do not attempt to delete main or push unreviewed production changes as a protection test.

Use each extracted repository's actual checks, rather than requiring workspace checks that it no longer runs. Public repositories support protected branches on GitHub Free; recheck plan support if visibility changes.

Reference: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## 6. Extract the SDK before parallel development

1. EthTobi owns the extraction in `lib/jisr-sdk`, its tests, web imports and shared workspace/lockfile changes.
2. Keep browser wallet behavior separate from Node-compatible primitives, inject network configuration, and keep localization, branded receipts and illustrative comparisons in the web app.
3. Codex reviews SDK exports for backend use. Existing types include `TransactionResult`, `SavedTransfer` and `TransferSettlement`; do not introduce a duplicate `SettlementRecord` by accident.
4. Pass regression tests, typechecking, application build and Node import checks before freezing interfaces.
5. Prepare history-preserving extraction before publishing `jisr-sdk`. A subtree split of a newly populated directory alone does not retain earlier commits at the files' old paths. Inspect the resulting history and contributor attribution before choosing the migration method.
6. Publish the verified SDK. Create its destination repository empty when importing history: do not initialize a competing README, license or gitignore commit.
7. Once the extracted package is available to the web build, rename the transferred app repository to `jisr-web` in Settings > General. Update remotes, package references, CI, deployment connections and documentation, then verify the build again.

Detailed interface and backend acceptance criteria: [COLLABORATION_PLAN.md](COLLABORATION_PLAN.md).

## 7. Create the remaining repositories and separate local folders

For each repository when its migration is ready:

1. Open the organization > Repositories > New repository.
2. Confirm the owner is the organization and enter the exact name from section 1.
3. Use Public for the agreed open-source setup. When importing existing history, leave initialization options unchecked.
4. Import the prepared code/history, add appropriate documentation and licensing, configure CI, then protect main.
5. In repository Settings > Collaborators and teams, verify both humans have the intended access. Their implementation leads remain as listed above; organization owners already have administrative access.

The target folder layout on the laptop is:

```text
jisr-work/
  jisr-web/                 # EthTobi opens in Freebuff
  jisr-sdk/                 # EthTobi opens in Freebuff
  jisr-api/                 # OTimileyin opens in VS Code / Codex
  jisr-routing/             # Codex, only after its later extraction
  payment-router-contract/ # Source holder / agreed maintainer
```

Clone each published repo into its own folder. Creating a GitHub organization does not move or isolate local files automatically. If both people need to edit the same repository concurrently, use separate clones or worktrees for that repository as well.

Until extraction finishes in the existing shared folder, serialize edits and Git operations. Stage only owned files; do not switch branches or discard another person's work. Follow CONTRIBUTING.md for attribution and commits.

## 8. Ready-to-start checklist

> **Progress (2026-09-12):** organization created; repository transferred; SDK extraction **merged to main** (PR #14, post-merge CI green); `jisr-pay/jisr-sdk` published with preserved history and a passing CI matrix; app repository renamed to `jisr-web` (post-rename CI verified via the merge). Still open: production deployment confirmation on Vercel, main branch protection on both repos, and confirming both human owners have accepted their invites.

- [ ] Organization created and both human owners accepted.
- [ ] Existing repository transferred, CI and deployment verified.
- [ ] Main protected with actual passing checks and peer review.
- [ ] SDK workspace extraction verified, interfaces reviewed, and publication prepared with history intact.
- [ ] EthTobi opens the web/SDK folders; Codex opens the API folder.
- [ ] Original contract source and deployment evidence located; contract maintainer named.
- [ ] Specific Drips round identified before preparing applications or funding splits.

This document describes setup; it does not assert that any GitHub changes have been performed.
