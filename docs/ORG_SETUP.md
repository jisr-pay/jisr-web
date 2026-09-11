# jisr-pay organization setup checklist

Step-by-step plan for moving `OTimileyin/jisr-pay` into a GitHub organization
and locking `main` down for two people (and their agents) working in parallel.

Estimated effort: ~20 minutes of clicking plus a few minutes of propagation.
Everything here is free-tier compatible **as long as the repo stays public**
(branch protection and rulesets are free on public repos).

Decide before starting:

- [ ] Org name: **`jisr-pay`** (matches the product; repo keeps the name `jisr-pay`, so the URL becomes `github.com/jisr-pay/jisr-pay`).
- [ ] Both **OTimileyin** and **EthTobi** become **owners**.
- [ ] Repo stays **public** through the hackathon cycle.
- [ ] Merge style for PRs: **Squash and merge** (keeps the `type: subject` convention one-commit-per-PR). Disable merge commits and rebase in repo settings so there's exactly one button.

---

## 1. Create the organization

1. GitHub → profile picture → **Organizations** → **New organization**.
2. Plan: **Free**. Name: `jisr-pay`. Contact email: either maintainer's.
3. Invite the other person: Org → **People** → **Invite member** → role **Owner**.
   - Do not skip this: a transfer into an org where only one of you is owner
     recreates the single-bottleneck problem the org exists to fix.
4. In **People → Member privileges**, set:
   - Base permissions: **Read** (explicit access per-repo keeps it intentional).
   - Allow members to create repositories: **off** (repos come from the plan in `docs/PLAN.md`, not ad hoc).
5. Optional but recommended: enable **Two-factor authentication requirement**
   (Org → Settings → Authentication security).

## 2. Transfer the repository

1. Old repo → **Settings** → General → **Danger Zone** → **Transfer ownership**.
2. Enter `jisr-pay` as the new owner and confirm by typing the repo name.
3. What transfers automatically: code, commits and author credit (history is
   untouched), issues, PRs, stars, watchers, releases, Actions history.
4. What breaks and needs the steps below: git remotes on local machines,
   Vercel's GitHub integration, and branch protection (configured in §4 —
   protection settings do not survive a transfer).

## 3. After the transfer

- [ ] **Local remotes** (both people, every clone):
      `git remote set-url origin https://github.com/jisr-pay/jisr-pay.git`
      (GitHub's redirect would keep old URLs working, but fix them anyway —
      redirects are one rename away from breaking.)
- [ ] **Actions**: open the Actions tab, confirm the *Build and typecheck*
      workflow ran on the transfer push. If not, push any commit / open a
      throwaway PR to trigger it and confirm green before proceeding.
- [ ] **Vercel**: the project's GitHub webhook pointed at the personal account,
      so production deploys stop. In Vercel: install/authorize the **GitHub App
      for the org**, then either transfer the project into an org-scoped Vercel
      team or create a new project importing `jisr-pay/jisr-pay`. The build is
      fully driven by `vercel.json` (install, build command, output dir,
      rewrites, security headers), so the import is click-through. Re-check the
      production domain afterwards — that URL goes into `SUBMISSION.md`, and
      once it is stable it should also become the absolute `og:image`/`og:url`
      base in `index.html` (TODO already noted there).
- [ ] **Delete the four stale branches** (owner action, now trivial):
      `git push origin --delete OTimileyin-patch-1 OTimileyin-patch-1-1 claude/repo-state-assessment-27m0lv docs/codebase-index-update`
      They are stale ancestors; nothing is lost. This closes PLAN item 12.
- [ ] **Links**: update any absolute URLs in `README.md`, `SUBMISSION.md`,
      `CODEBASE_INDEX.md` from `OTimileyin/jisr-pay` to `jisr-pay/jisr-pay`.

## 4. Branch protection on `main`

Repo → **Settings** → **Branches** → **Add branch protection rule** → pattern `main`.

- [ ] **Require a pull request before merging** ✓
      - Required approvals: **1** — i.e. the other person reviews every change.
      - ✓ **Dismiss stale pull request approvals when new commits are pushed**.
      - Leave "Require review from Code Owners" **off** until a `CODEOWNERS`
        file exists; then add `.github/CODEOWNERS` with
        `* @OTimileyin @EthTobi` and turn it on.
- [ ] **Require status checks to pass before merging** ✓ → search and select
      all four matrix checks published by the *Build and typecheck* workflow:
      - `build (ubuntu-latest, 22.x)`
      - `build (ubuntu-latest, 24.x)`
      - `build (windows-latest, 22.x)`
      - `build (windows-latest, 24.x)`
      - ✓ **Require branches to be up to date before merging** (kills
        merge-surprise between two simultaneous workers).
- [ ] **Require conversation resolution before merging** ✓.
- [ ] **Do not allow bypassing the above settings** ✓ — otherwise admins can
      still push to `main` and the protection is decorative. Accept the trade:
      an emergency fix goes through a PR with an instant self-merge after the
      other owner's approval.
- [ ] Leave **unchecked**: "Allow force pushes" and "Allow deletions" (defaults
      once protection is on).

Note: GitHub also offers the newer **Rulesets** UI; classic branch protection
above is the simplest path and does everything needed. If you prefer rulesets,
map each checkbox 1:1 — the required-check names are identical.

## 5. The two-person (two-agent) workflow on one shared laptop

Both agents run on the same machine in the same folder: Buffy (Freebuff
desktop app) and Codex (VS Code + CLI) share **one working tree**. That is
the main hazard — not push races, but one agent staging, overwriting, or
branch-switching away the other's uncommitted work.

1. **Prefer separate worktrees before parallel sessions.** One directory
   cannot safely hold two agents' uncommitted work:

   ```sh
   git worktree add ../jisr-pay-codex feat/<branch>
   ```

   Each worktree checks out its own branch; history stays single-source and
   nothing uncommitted is ever shared. (Attribution per worktree is possible
   via `git config extensions.worktreeConfig` + `git config --worktree …`.)
2. **If working in the shared checkout anyway, serialize.** Only one agent
   edits at a time. Every agent: run `git status` immediately before and
   after its own work, commit in small slices staging explicit files only,
   and never `git add -A`/`.`, never switch branches, never discard anything
   it did not create.
3. **Authorship stays honest** (`CONTRIBUTING.md`): agents commit under the
   human driving them — Buffy's commits are EthTobi's, Codex's are
   OTimileyin's. If both share one local git config, say who drove the work
   in the commit body instead of adding trailers.
4. Branch names follow the commit convention: `feat/…`, `fix/…`, `test/…`,
   `docs/…`, `chore/…`.
5. Push branch → open PR → **the other person reviews** → squash-merge with
   a `type: subject` title. Protection makes this mandatory even on one
   machine — no direct pushes to `main` from either agent.
6. Task ownership comes from `docs/PLAN.md` (P2 items 9–12) and the
   repo-lead table agreed for the org: web + SDK on EthTobi's side, api +
   routing on OTimileyin's side, contract repo by whoever holds the Soroban
   source.
7. Extraction sequencing stays as decided: **finish the `jisr-sdk` workspace
   extraction before parallel work starts** — it touches every `src/` file
   and is the one change that must not happen concurrently.

## 6. Verify the setup actually protects you

- [ ] `git push origin main` from a local clone → **must be rejected** (remote: "protected branch hook declined").
- [ ] Open a trivial PR → all four matrix checks appear and must pass → other owner approves → squash-merge works.
- [ ] Approve with one account, push a new commit to the same PR → the stale approval is dismissed automatically.
- [ ] Confirm `git push origin --delete` of any branch is refused on `main` (and stale-branch cleanup in §3 is done before protection matters).

## 7. If something goes wrong

- A transfer can be reversed: org → transfer repository back to the personal
  account (owner action, no history impact).
- Branch protection can be edited by any org owner at any time — a blocked
  release is never more than one settings change away.
- Nothing in this checklist rewrites history or force-pushes; the
  `contributor-history.bundle` in the repo root remains the offline backup of
  pre-rebuild history.

## 8. Next in sequence (already agreed — see docs/PLAN.md discussion)

1. `jisr-sdk` workspace-package extraction with tests moving alongside it
   (`lib/jisr-sdk`, importing the existing `lib/api-client-react` pattern).
2. Promote the package to its own repo via `git subtree split` so commits and
   author credit survive.
3. Publish the deployed `payment_router` Soroban contract source as the second
   repo, with its tests.
4. Then start parallel feature work on stable interfaces
   (`TransactionResult`, `SettlementRecord`, `TransferSettlement` are the seed
   of that shared contract).
