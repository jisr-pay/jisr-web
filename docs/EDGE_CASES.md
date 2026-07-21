# Edge cases & resilience

Jisr Pay is a static frontend that talks to external services (Freighter
wallet, Soroban RPC, Horizon, and the stellar-tags federation API). There is no
backend of our own, so hardening lives on the client. This documents the edge
cases that could break the app and how each is handled.

## Wallet / Freighter

| Case | Handling |
|------|----------|
| Freighter not installed | Connect calls `requestAccess()` directly; if it fails, a clear "install Freighter" message is shown. |
| Freighter locked | Classified as `WALLET_LOCKED` → "unlock the extension and try again." |
| User rejects the connection | `connectFreighter()` returns null → friendly prompt to approve. |
| User rejects the signature | Classified as `USER_REJECTED` → "You declined the request in Freighter." |
| Wallet on the wrong network (Mainnet) | `assertTestnetNetwork()` reads the network before signing and stops with `WRONG_NETWORK` if it isn't testnet. Best-effort: if the network can't be read, signing still targets testnet. |

## Payment amount

| Case | Handling |
|------|----------|
| Empty / zero / negative | Submit button disabled + guard in `handleStart`. |
| Non-numeric / `NaN` / `Infinity` | `parseAmountToStroops` rejects non-finite values. |
| More than 7 decimal places | Rejected (Stellar supports 7 dp). |
| Absurdly large value | Rejected above a sane i128 ceiling. |
| Scientific notation (`1e-3`) | Parsed via `Number()` and validated the same way. |

## Recipient / federation

| Case | Handling |
|------|----------|
| Valid `G…` address | Accepted directly via `StrKey` validation. |
| Federation name (`alice*jisr.pay`) | Looked up against the real stellar-tags API. |
| Name not found (404) | `RECIPIENT_NOT_FOUND` → clear message, **no hardcoded fallback wallet**. |
| Federation API down / Railway asleep | Retried with backoff, then `DIRECTORY_UNAVAILABLE` → "paste the recipient's G… address instead." |
| Malformed / unreadable API response | Rejected rather than trusted. |
| Injection in the query string | `encodeURIComponent` + `StrKey` validation of the returned account. |

## Network / RPC

| Case | Handling |
|------|----------|
| Sender account not funded | `NOT_FUNDED` → message with a friendbot link. |
| Transient RPC/Horizon failure or 429 | `withRetry` retries read calls (getAccount, prepareTransaction, federation, Horizon poll) with exponential backoff. |
| Transaction fails on-chain | `CONTRACT_FAILED` → surfaced, never reported as success. |
| Confirmation times out (network lag) | `TIMEOUT` → "may still have gone through — check the explorer before retrying." Never a fake success. |
| Insufficient token balance | Surfaced from the contract error (`INSUFFICIENT_BALANCE`). |

## UI / lifecycle

| Case | Handling |
|------|----------|
| Double-click "Find the Best Route" | Rate limited (`findRoute`: 1s gap) + previous scan interval cleared so intervals can't stack. |
| Double-click "Sign & Submit" | `isSubmitting` guard + rate limit (`submitPayment`: 3s gap, max 5/min). |
| Rapid repeat payments | Client-side rate limiter throttles and shows a wait message. |
| Component unmounts mid-scan / mid-poll | `mountedRef` guards every post-await `setState`; the scan interval is cleared on unmount. |
| A 3D/WebGL resource fails | `HeroScene` uses procedural lighting (no external HDR) and an error boundary that falls back to a gradient. |
| Any uncaught render error | `RootErrorBoundary` shows a recoverable "reload" screen instead of a blank page. |
| Clipboard API blocked (insecure context) | Copy falls back to a `textarea` + `execCommand`, with a toast either way. |

## Logging

All diagnostics go through a single leveled logger (`lib/logger.ts`). In
production only `warn`/`error` are emitted; `debug`/`info` are suppressed to keep
the console clean. A global `error` / `unhandledrejection` listener logs anything
that escapes React. The logger is the single seam to later forward logs to a
real sink (e.g. Sentry) without touching call sites.
