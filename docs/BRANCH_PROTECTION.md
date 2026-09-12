# Branch protection for `main` — exact settings (ORG_SETUP §5)

## Current state (checked 2026-09-12)

| Repository | Protection state |
|---|---|
| `jisr-pay/jisr-web` | **Dormant.** An active ruleset "Jisr-pay Rules" (id 19855801, created 2026-07-27) exists but its target-branch include list is **empty**, so it matches no refs. Proof it is not enforcing: direct pushes to `main` succeed, and PR #14 merged with a merge commit although the ruleset demands linear history. It also requires signed commits, a "Preview" deployment, CodeQL scanning and code coverage — none of which are set up. |
| `jisr-pay/jisr-sdk` | **None.** No rulesets at all. |

Conclusion: `main` is effectively unprotected on both repos. Apply the settings below.

## Step 1 — remove the dormant ruleset (jisr-web only)

Settings → **Rules** → **Rulesets** → click **Jisr-pay Rules** → **Delete ruleset**.
(Its one useful pair of rules — block deletions, block force pushes — is re-added below.)

## Step 2 — create the real ruleset (both repositories)

Settings → **Rules** → **Rulesets** → **New branch ruleset**. Name: `main-protection`.
Enforcement status: **Active**. (In the classic Branches UI, the same settings map to one
branch protection rule with "Do not allow bypassing" checked.)

**Bypass list:** add **nobody**. An empty bypass list is the ruleset equivalent of
"do not allow bypassing the above settings" — admins included.

**Target branches:** Add target → **Include by pattern: `~DEFAULT_BRANCH`**
(the UI's "Bypass… include default branch" option). Prefer this over the literal name
`main` so the rule survives default-branch changes.

**Rules to enable, matching ORG_SETUP §5:**

| Rule | Settings |
|---|---|
| Require a pull request before merging | Required approvals: **1** · ✅ **Dismiss stale pull request approvals when new commits are pushed** · ✅ **Require conversation resolution before merging** · ❌ Code owners (no CODEOWNERS file) · ❌ "Someone other than last pusher" (self-approval is already blocked) · Allowed merge methods: **Merge + Squash**, ❌ Rebase (matches actual practice: #14 merge commit; §5.7 squash) |
| Require status checks to pass | Add all four, exact names: `build (ubuntu-latest, 22.x)` · `build (ubuntu-latest, 24.x)` · `build (windows-latest, 22.x)` · `build (windows-latest, 24.x)` · ✅ **Require branches to be up to date before merging** |
| Block force pushes | ✅ |
| Restrict deletions | ✅ |

> If the status-check picker finds no checks on `jisr-sdk`, open one throwaway PR first —
> check names only register in the picker after running once. (Both repos run the same
> four-job matrix, and both have green runs already.)

**Deliberately left OFF** (the dormant ruleset had these; they would deadlock a
two-person team on free infrastructure):

- *Require signed commits* — neither account has signing configured; every merge would fail.
- *Required deployments ("Preview")* — a Vercel hiccup would block all merges.
- *Code scanning (CodeQL), code quality, code coverage* — need apps/sets that don't exist here.
- *Require linear history* — you already merge with merge commits (PR #14).
- *Copilot code review* — optional; enable later if wanted.

## Step 3 — verify the protection actually bites

1. `git push --dry-run` of a direct commit to `main` → must be **rejected** (GH006, protected).
2. Open a PR: the merge button stays blocked until the four checks are green **and** the
   other account approves; merging your own PR must be impossible.
3. Push a new commit after approval → the approval is dismissed (stale-dismissal working).
4. Settings → General → Pull Requests: keep **Allow squash merging** and **Allow merge
   commits** enabled, rebase optional; PR titles follow `type: subject`.

## Rollback

Rulesets are editable in place: set **Enforcement status: Disabled** to suspend all rules
momentarily without deleting them (audit trail stays visible in the ruleset history).
