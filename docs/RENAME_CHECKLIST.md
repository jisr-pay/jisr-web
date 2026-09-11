# jisr-pay → jisr-web rename checklist

> **Status (2026-09-12): the rename has been performed** — `https://github.com/jisr-pay/jisr-web` is live, old URLs redirect, and the local checkout's remote was updated. Remaining: the §5 verification pass (CI + Vercel connection) on the next PR, and confirming branch protection carried over. The extraction PR should be merged through that verification path.

Per docs/ORG_SETUP.md §6.7 and docs/COLLABORATION_PLAN.md step 6 sequencing: **run this only after the `jisr-sdk` repository is published and its CI is green** (docs/SDK_PUBLISH_RUNBOOK.md). All GitHub-side actions are performed by EthTobi; nothing in this checklist has been executed here.

## 1. Pre-flight verification (before touching GitHub)

- [ ] `jisr-sdk` repo exists, history published, CI matrix green (`docs/SDK_PUBLISH_RUNBOOK.md` §2 complete).
- [ ] Workspace tip passes locally: `pnpm test` (all packages), `pnpm run typecheck`, `pnpm --filter @workspace/jisr-pay run build`.
- [ ] Vercel project connected to `jisr-pay/jisr-pay`; last production deployment succeeded.
- [ ] No open PRs that would be disrupted (or: coordinate their rebase after rename).
- [ ] Both owners have admin access to the repository (needed for the rename).

## 2. Perform the rename (GitHub UI, EthTobi)

1. Open `https://github.com/jisr-pay/jisr-pay` → Settings → General → **Repository name** → `jisr-web` → Rename.
2. GitHub sets up redirects from the old name automatically; old clones keep working via redirect until each remote is updated. Issues, PRs, stars, watch settings, releases, and branch protection carry over.
3. Confirm `https://github.com/jisr-pay/jisr-web` loads and the old URL redirects.

Reference: https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository

## 3. Update local checkouts (each contributor)

```bash
git remote set-url origin https://github.com/jisr-pay/jisr-web.git
git remote -v                       # confirm
git fetch --prune                   # sanity check against the renamed remote
```

## 4. Update repository references

- [ ] Grep this workspace for `jisr-pay/jisr-pay` (documentation, badges, CI): any occurrence pointing at the app repo becomes `jisr-pay/jisr-web`. The **package name** `@workspace/jisr-pay` and the folder `artifacts/jisr-pay/` are local identifiers and may stay as-is — renaming them is optional follow-up hygiene, not required.
- [ ] `.github/workflows/ci.yml`: only if it references the repository by name.
- [ ] `vercel.json`: no repo-name references expected; verify.
- [ ] README/docs badges and clone URLs if any.

## 5. CI and deployment verification (post-rename)

1. Push a small documentation PR to the renamed repo; confirm the CI matrix (`build (ubuntu-latest, 22.x)`, …) runs and passes.
2. Vercel: check Settings → Git integration still shows the project connected to `jisr-pay/jisr-web`. GitHub redirects usually keep webhooks working, but verify a preview deployment on the PR.
3. Merge the PR; confirm a production deployment succeeds and the production URL/domain is unchanged.
4. Branch protection on `main` still requires the passing checks (ORG_SETUP §5).

## 6. Rollback

If anything is broken and needs time to fix: rename back to `jisr-pay` in the GitHub UI (redirects are reversible; the old name is immediately free once released). Vercel reconnection follows the same steps as §5.

---

Related: docs/SDK_PUBLISH_RUNBOOK.md (must complete first), docs/ORG_SETUP.md §6.7.
