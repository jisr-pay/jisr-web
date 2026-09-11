# Jisr Pay — Continuation Plan

> Written Sept 11, 2026 after pushing `1d25bdc`. Everything below was verified
> against the code, not guessed. Resume from **P0** and work down.
>
> **Progress (Sept 11, later):** P0-1, P0-2, P1-3, P1-4, P1-5, P1-7 and P1-8
> are done. P1-6 needed no change — the stroop boundaries were already pinned
> (`amount.test.ts` covers 1 stroop, the app max, and one-past-max). Remaining:
> P2 items 9–12.

---

## Where things stand

- `main` is pushed and clean. The four old remote branches
  (`OTimileyin-patch-1`, `-1-1`, `claude/repo-state-assessment-27m0lv`,
  `docs/codebase-index-update`) are **stale ancestors** of `main` (history was
  rebuilt; no merge-base). Nothing was lost on them — deleting them is optional
  housekeeping (needs repo-owner auth).
- Verified green locally: **46/46 lib tests**, frontend `tsc --noEmit`,
  **production Vite build** (34s, only the known three.js chunk-size warning).
- Latest 10 commits: README/CODEBASE_INDEX/TESTING.md reconciliation,
  EN/AR parity + errors + rateLimit + corridors regression suites, lazy
  network-constant resolution, `enforce()` message fix, build-verification note.

## Repo conventions (read before your first commit)

- Commit style `type: subject` (feat/fix/test/docs/chore/ci). **No co-author
  trailers** — `CONTRIBUTING.md` forbids them.
- Visible strings change **EN and AR together**; `src/lib/i18n.test.ts` enforces
  dictionary parity.
- Tests are plain `node --test` with type stripping. Relative imports inside
  `src/lib/**` must use **explicit `.ts` extensions** or the test loader fails
  with `ERR_MODULE_NOT_FOUND` (this bit `rateLimit.ts` and `corridors.ts`
  already — see P0-1 for the remaining offender).
- `rateLimit.ts` has an injectable clock (`setClock`) for deterministic tests.
- When you add tests, update the coverage sentence in `docs/TESTING.md`.

## How to verify (after `git pull`)

```sh
cd artifacts/jisr-pay
npm test                                  # 46+ tests (plain node, no pnpm needed)
npx tsc -p tsconfig.json --noEmit        # typecheck
PORT=3000 BASE_PATH=/ node node_modules/vite/bin/vite.js build --config vite.config.ts
```

Notes: `pnpm` is not on PATH in the dev sandbox — use `npm test` inside the
package or invoke node directly. The build **requires** `PORT` and `BASE_PATH`
env vars (`vite.config.ts` throws otherwise; the old "esbuild EPERM" note in
TESTING.md was a misdiagnosis of `PORT=0` coming from the sandbox).

---

## P0 — small, do first

1. **Normalize remaining extensionless imports in `src/lib/stellar.ts`**
   (lines 23–27: `./corridors`, `./logger`, `./errors`, `./amount`,
   `./settlement`). Same latent trap that broke two other modules under the
   test loader. Acceptance: `grep -rnE "from '\./[a-z-]+'" src/lib` returns
   nothing; `npm test` + typecheck green.

2. **Chunk-load-failure recovery.** `docs/TESTING.md` browser-acceptance step 6
   asks testers to "test PDF download with a blocked lazy-loaded chunk, then
   retry" — but there is no automatic recovery. Add a global listener
   (`window.addEventListener('error')` filtering chunk-load errors, or
   `unhandledrejection`) that shows a "Reload to continue" toast/banner.
   Files: `src/App.tsx` (global handlers already log there), reuse
   `use-toast`. EN+AR strings.

## P1 — test coverage gaps

3. **`errors.test.ts`: cover every `FRIENDLY` code** (currently samples ~8 of
   13). One line per code: assert `toUserMessage(AppError(code, 'x'))` hits the
   friendly copy, not the raw message.

4. **`receipt.ts` data assembly** — the jsPDF call needs jsdom, but the
   receipt *payload* (hash truncation, savings math, filename) is pure. Extract
   or test the pure parts; filename pattern is asserted in AgentPipeline toast
   (`jisr-pay-receipt-${hash.slice(0,8)}.pdf`) — pin it.

5. **`settlement.test.ts` response variants** — read the existing file first;
   extend toward: succeeded-but-failed-tx, missing fields, future ledger,
   malformed JSON. All mock `fetch`; keep the "never fabricate success" rule.

6. **`amount.ts` stroop boundary** — check rounding at the smallest
   representable stroop amounts and max i128; add cases if uncovered.

## P1 — product polish

7. **Social share metadata (verified missing).** `index.html` has title,
   description, favicon — but **no `og:*` / `twitter:card` tags**. Add
   og:title/description/image/url, `twitter:card=summary_large_image`, and
   create `public/og-image.png` (1200×630, brand violet on near-black).
   Matters for a hackathon entry being shared.

8. **Quiet the bundle warning.** `vite.config.ts`: `build.rollupOptions
   .output.manualChunks` splitting `three`/`@react-three/*` and `jspdf` into
   their own chunks (both are already lazy-friendly). Verify build output
   afterwards; revert if chunks get *worse*.

## P2 — bigger bets (scope before starting)

9. **Component tests for the AgentPipeline state machine**
   (idle → scan → review → submit → settle). Requires a rendering layer
   decision: vitest + jsdom + @testing-library/react as new devDependencies —
   respect `pnpm-workspace.yaml` `minimumReleaseAge` supply-chain policy when
   adding them. Highest-value test target in the repo (829-line core).

10. **Break up `AgentPipeline.tsx`** into per-step components + hooks, no
    behavior change. Do *after* #9 lands so the refactor is guarded.

11. **Federation proxy behind real rate limiting.** The client-side limiter in
    `lib/rateLimit.ts` can't protect the free Railway directory API across
    users. `artifacts/api-server` is an unused Express scaffold — either use it
    or delete it; document the decision in `CODEBASE_INDEX.md`.

12. **Delete the four stale remote branches** on origin (owner action):
    `git push origin --delete OTimileyin-patch-1 OTimileyin-patch-1-1
    claude/repo-state-assessment-27m0lv docs/codebase-index-update`.

## Explicitly not done, on purpose

- No commit-padding to reach an arbitrary count. History grows with honest
  work; 10 real commits shipped Sept 11 rather than 50 synthetic ones.
