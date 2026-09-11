# jisr-sdk publication runbook (history-preserving)

Follows docs/COLLABORATION_PLAN.md step 6 and docs/ORG_SETUP.md §6.5–6.6. The rewrite has already been executed and validated in a scratch clone at `C:\Users\ADMIN\jisr-sdk-publish-prep` (branch `main`, 19 commits); this runbook documents what was done and the exact push procedure for EthTobi.

## 1. What was done (record)

1. Fresh scratch clone of `jisr-pay/jisr-pay` to `..\jisr-sdk-publish-prep` (outside the workspace checkout, never pushed).
2. `git filter-branch --index-filter` pass 1: kept `lib/jisr-sdk/**` plus the pre-move lives of the moved files at `artifacts/jisr-pay/src/lib/{amount,errors,rateLimit,settlement,transfer-history,network-config}.ts` and their test files, pruning everything else.
3. Pass 2 (fresh clone): kept **and lifted** those files to the repository root in the same index rewrite, so the published repo has the SDK at `/` while `git log --follow` still reaches the pre-move commits.
4. Verified per the plan: `git log --follow --oneline -- src/amount.ts` connects to the original authoring commits; `git shortlog -sne` shows both contributors (11+2 Tim, 6 EthTobi); tip tree = SDK only; 126 → 19 commits.
5. Post-rewrite tip commits (normal commits on the prepared repo's `main`): self-contained tsconfig/devDependencies, CI workflow + MIT LICENSE, `packageManager` pin, lockfile + `.gitignore`.
6. Standalone validation in the prepared repo: fresh `pnpm install`, `pnpm test` (38/38), `pnpm typecheck`, and a Node `--experimental-strip-types` import of the barrel — all green.
7. Content-parity check: prepared repo files are byte-identical to `lib/jisr-sdk` (modulo CRLF; intentional additions: `.github/`, `LICENSE`, `packageManager` pin).

## 2. Push procedure (EthTobi only)

1. Confirm `https://github.com/jisr-pay/jisr-sdk` exists and is **empty** — no README, no license, no gitignore commit (ORG_SETUP §6.6).
2. In `C:\Users\ADMIN\jisr-sdk-publish-prep`:
   ```bash
   git remote add origin https://github.com/jisr-pay/jisr-sdk.git
   git push -u origin main
   ```
3. First CI run on GitHub Actions: `build (ubuntu-latest, 22.x/24.x)` + `build (windows-latest, 22.x/24.x)` should pass (the included workflow runs install/test/typecheck).
4. Protect `main` per ORG_SETUP §5 (require PR + passing checks; the SDK repo's own checks, not the workspace ones).
5. Then (and only then) rename `jisr-pay/jisr-pay` → `jisr-web` per `docs/RENAME_CHECKLIST.md`.
6. The scratch clone can be deleted afterward.

## 3. If it must be re-run from scratch

`git filter-branch` was used because Python/`git-filter-repo` was unavailable on this machine. On a machine with Python available, prefer `git filter-repo`:

1. `pip install git-filter-repo`
2. Fresh clone to a scratch directory outside any checkout.
3. One pass with `--path` keeps (SDK dir + pre-move paths) and `--to-subdirectory-filter` only if lifting to root is unnecessary.

Never run the filter against the real workspace checkout — always a scratch clone.

---

After the push, verify: clone the published `jisr-sdk` to a fresh folder and run `git log --follow --oneline -- src/amount.ts` — history must reach the July 2026 commits with both contributors.
