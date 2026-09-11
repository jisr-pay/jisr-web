# Contributing to Jisr Pay

Use Node.js 22.13 or newer and the pnpm version pinned in `package.json`.
Run `pnpm install --frozen-lockfile`, then `pnpm dev` from the repository root.
The dashboard is at `/app`. Optional public frontend settings are documented
in `artifacts/jisr-pay/.env.example`.

Before opening a pull request, run `pnpm test` and `pnpm build`.
Explain the user-visible problem, the resulting behavior, and any checks you
could not run. Keep related changes together and avoid unrelated lockfile edits.

Payments currently support native XLM on Stellar Testnet. Never use real funds
to validate a change. A timeout must leave a transfer pending until a network
response establishes its outcome. Persist the signed transaction hash before
broadcast; failure to save it must stop submission. Do not record secret keys,
signed transaction payloads, or wallet credentials in logs or browser storage.

Update both English and Arabic copy when introducing visible text. Check RTL,
keyboard access, mobile layouts, and recovery after reload for affected flows.
Fee comparisons are illustrative USD examples, not executable exchange quotes.

Commit authorship must reflect the person responsible for the work. Do not add
automated co-author trailers unless the repository owner requests them. Keep
local assistant metadata, environment files, and history backups out of commits.
