# jisr-api backend handoff (Codex first milestone)

Hands the Codex-owned backend work (docs/COLLABORATION_PLAN.md step 5) everything it needs to start against the frozen SDK interface. Lead: OTimileyin / Codex. Scope lives in `artifacts/api-server` and `lib/db` inside this workspace until the later repository split (ORG_SETUP §1).

## 1. Current state of the backend area

- `artifacts/api-server` — Express 5 scaffold: pino-http logging, CORS, `/api/healthz` only. No routes beyond health, no persistence.
- `lib/db` — Drizzle ORM + node-postgres, wired to `DATABASE_URL`; `src/schema/index.ts` is empty (zero tables).
- `lib/api-spec` — OpenAPI 3.1 YAML documenting only `/api/healthz`; Orval generates `@workspace/api-zod` and `@workspace/api-client-react` from it (`pnpm --filter @workspace/api-spec run codegen`).
- No part of this is deployed or called by the frontend today.

## 2. The SDK surface you consume (`@workspace/jisr-sdk`)

Frozen as of the extraction (2026-09-11); import from the barrel only:

| Export | Kind | Backend relevance |
|---|---|---|
| `parseAmountToStroops(amount: string)` | fn | Exact decimal → stroops; **never** store floats or re-parse amounts yourself. |
| `resolveNetworkConfig(env)` | fn | Builds a validated `NetworkConfig` from an env record; the SDK never reads env itself. Note the keys it reads are the `VITE_*` names — a backend passes `{ VITE_HORIZON_URL: process.env.HORIZON_URL, … }` or its own mapping. Testnet-only, fail-fast. |
| `NetworkConfig` | type | `{ contractId, treasuryAddress, tokenAddress, federationUrl, rpcUrl, horizonUrl, networkPassphrase, network: 'TESTNET' }` — validated HTTPS endpoints and addresses. |
| `fetchSettlement(horizonUrl, hash, fetcher?)` | fn (async) | Trusted network lookup. **This — not client-supplied status — is settlement evidence.** Returns `null` when Horizon 404s (transaction unknown → keep `pending`), a `TransferSettlement` on success, and throws a typed `AppError` (`NETWORK`, `RATE_LIMITED`) on transient failures (→ keep `unknown`, retry). Read-only; never broadcasts. |
| `TransferSettlement` | type | `{ hash, successful, feeCharged: "X.Y XLM", ledger, createdAt }` — validated against Horizon's response shape (hash match, numeric fee, sane timestamp). |
| `applySettlement(record, settlement)` | fn | Pure journal transition pending → confirmed/failed; throws if `settlement.hash !== record.hash`; fills `feePaid`/`ledger`/`confirmedAt` from network evidence. Pair with `settlementDurationMs` for reporting. |
| `SavedTransfer`, `TransferStatus`, `HistoryStorage`, `HISTORY_KEY` | types/fn | Journal model. `HistoryStorage` (`getItem`/`setItem`) is the persistence port — implement it over Postgres, **not** localStorage. |
| `AppError`, `classifyError`, `toUserMessage`, `isUserRejection`, `ErrorCode` | errors | Reuse for typed API errors instead of new error taxonomies. |
| `enforce/record/retryAfter`, `RULES` | rate limit | Server-side rate limiting primitives (client `RULES` are advisory only; enforce for real on the API). |
| `createLogger`, `setLogSink` | logging | Route logs to pino via a sink; no console dependency. |
| `buildAndSubmitPayment`, `PaymentWallet`, `PaymentCallbacks`, `withRetry` | payment | **Do not use.** Signing/broadcasting stays in the wallet flow (plan §"Codex first backend milestone"). Reconciliation is read-only. |

Freeze rule: any interface change is a reviewed PR with EthTobi sign-off before Codex code depends on it (plan §3).

## 3. Acceptance criteria → design mapping

Plan §"Codex first backend milestone" verbatim criteria, with the intended approach:

1. **Unique key (network, txHash); idempotent registration; immutable identity fields** → `transfers` table with `UNIQUE (network, tx_hash)`; `INSERT ... ON CONFLICT DO NOTHING`, then read back the stored row. Reject conflicting identity fields on re-registration (409).
2. **Client status is not evidence** → the `status` field a client sends is stored as `claimedStatus` (informational only) or not at all; DB status starts `pending`/`unknown` and changes only from `fetchSettlement` results.
3. **Verify recipient/amount/contract invocation against network evidence** → when the transaction is found, compare Horizon operation/contract-event payloads against the registered record; mark application details `verified` only on a field match. A bare success hash never flips verification.
4. **Exact decimals** → store amount as `numeric` (text-typed in Drizzle) + `stroops bigint`; validate with `parseAmountToStroops` before insert.
5. **No keys/signed payloads, no backend signing, no rebroadcast** → schema has no such columns; reconciliation reads only.
6. **Wallet ownership verification before private data / owner mutations** → out of scope for reconciliation reads; when introduced, require a signed challenge (Stellar `manageData`-style) tied to the address — a supplied public address is not auth. Define this before any owner-scoped route exists.
7. **Atomic concurrency; confirmed wins** → all status transitions in SQL transactions with `WHERE status IN ('pending','unknown')` guards; an older response can never overwrite `confirmed`/`failed`.
8. **Test matrix** → duplicate registration, conflicting identity fields, explicit network success/failure, missing transaction (stays pending), transient lookup error (stays unknown, retry), ownership checks, concurrent updates.
9. **Docs/contract** → update `lib/api-spec/openapi.yaml` (draft below) and regenerate clients when routes land.

## 4. Proposed schema (starting point, Drizzle/Postgres)

```ts
// lib/db/src/schema/transfers.ts (draft — Codex finalizes)
import { pgTable, text, bigint, timestamp, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

export const transferStatus = pgEnum('transfer_status', ['pending', 'unknown', 'confirmed', 'failed']);

export const transfers = pgTable('transfers', {
  network: text('network').notNull(),            // e.g. 'testnet'
  txHash: text('tx_hash').notNull(),
  claimedSender: text('claimed_sender'),          // unverified until (3)
  claimedRecipient: text('claimed_recipient'),
  claimedAmountStroops: bigint('claimed_amount_stroops', { mode: 'bigint' }),
  claimedStatus: text('claimed_status'),          // client-supplied, never evidence
  status: transferStatus('status').notNull().default('pending'),
  recipientVerified: text('recipient_verified'),  // 'unverified' | 'verified' | 'mismatch'
  amountVerified: text('amount_verified'),
  contractInvokedVerified: text('contract_invoked_verified'),
  ledger: bigint('ledger', { mode: 'number' }),
  settlementAt: timestamp('settlement_at', { withTimezone: true }),
  reconciliationError: text('reconciliation_error'), // last transient lookup failure
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('transfers_network_tx_hash_uq').on(t.network, t.txHash)]);
```

## 5. API contract draft (paste into `lib/api-spec/openapi.yaml` when routes are implemented)

```yaml
paths:
  /transfers:
    post:
      operationId: registerTransfer
      tags: [transfers]
      summary: Register a transfer for tracking (idempotent)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterTransferInput'
      responses:
        '201':
          description: Registered (or already present, unchanged)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransferRecord'
        '409':
          description: Same (network, txHash) with conflicting immutable identity fields
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
    get:
      operationId: listTransfers
      tags: [transfers]
      summary: List tracked transfers (paged)
      parameters:
        - in: query
          name: status
          schema: { $ref: '#/components/schemas/TransferStatus' }
      responses:
        '200':
          description: Transfers
          content:
            application/json:
              schema:
                type: object
                properties:
                  transfers:
                    type: array
                    items: { $ref: '#/components/schemas/TransferRecord' }
  /transfers/{network}/{txHash}:
    get:
      operationId: getTransfer
      tags: [transfers]
      summary: Fetch one transfer by identity
      parameters:
        - { in: path, name: network, required: true, schema: { type: string } }
        - { in: path, name: txHash, required: true, schema: { type: string } }
      responses:
        '200':
          description: Transfer
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TransferRecord' }
        '404': { description: Not found }
  /transfers/{network}/{txHash}/reconcile:
    post:
      operationId: reconcileTransfer
      tags: [transfers]
      summary: Trigger a trusted settlement lookup (read-only on-chain)
      description: >
        Looks the transaction up on the network. Client-supplied status is ignored.
        Missing transaction and transient lookup errors keep the record pending/unknown.
      parameters:
        - { in: path, name: network, required: true, schema: { type: string } }
        - { in: path, name: txHash, required: true, schema: { type: string } }
      responses:
        '200':
          description: Updated record
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TransferRecord' }
        '404': { description: Not found }

components:
  schemas:
    TransferStatus:
      type: string
      enum: [pending, unknown, confirmed, failed]
    VerificationState:
      type: string
      enum: [unverified, verified, mismatch]
    RegisterTransferInput:
      type: object
      required: [txHash, claimedAmount]
      properties:
        txHash: { type: string }
        claimedSender: { type: string }
        claimedRecipient: { type: string }
        claimedAmount: { type: string, description: decimal, e.g. "12.5" XLM }
        claimedStatus: { type: string, description: informational only, never evidence }
    TransferRecord:
      type: object
      required: [network, txHash, status, claimedAmountStroops, createdAt]
      properties:
        network: { type: string }
        txHash: { type: string }
        claimedSender: { type: string, nullable: true }
        claimedRecipient: { type: string, nullable: true }
        claimedAmountStroops: { type: string, description: decimal-string to stay exact }
        claimedStatus: { type: string, nullable: true }
        status: { $ref: '#/components/schemas/TransferStatus' }
        recipientVerified: { $ref: '#/components/schemas/VerificationState' }
        amountVerified: { $ref: '#/components/schemas/VerificationState' }
        contractInvokedVerified: { $ref: '#/components/schemas/VerificationState' }
        ledger: { type: integer, nullable: true }
        settlementAt: { type: string, format: date-time, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    ErrorResponse:
      type: object
      properties:
        code: { type: string }
        message: { type: string }
```

Conventions to keep: the OpenAPI title line must not change (Orval import paths break — see the comment in `lib/api-spec/openapi.yaml`); run `pnpm --filter @workspace/api-spec run codegen` after editing; amounts cross the API as decimal strings, never JSON numbers.

## 6. Environment & coordination notes

- New env vars for jisr-api: `DATABASE_URL` (exists in `lib/db`), plus a `NETWORK`/config value feeding `resolveNetworkConfig` — no `VITE_*` keys; those are web-only.
- Coordinate manifest/lockfile edits with EthTobi if `lib/db` or `api-server` gains `@workspace/jisr-sdk` as a dependency (plan §"Sequence" — shared lockfile).
- Suggested split: `jisr-api` keeps using the workspace package until ORG_SETUP §7 promotes it to its own checkout.

Related: docs/COLLABORATION_PLAN.md (acceptance criteria source of truth), lib/jisr-sdk/README.md (SDK boundaries).
