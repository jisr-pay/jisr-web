# @workspace/jisr-sdk

Reusable Stellar payment primitives for Jisr Pay: exact decimal amounts,
typed errors, the transfer journal, settlement lookups, network configuration
and rate limiting — with their regression tests.

## Boundaries

- **No browser assumptions.** Storage is injected through the `HistoryStorage`
  interface; there is no `localStorage`, `window` or Vite `import.meta.env`
  access anywhere in the package.
- **No wallet code.** Freighter and other browser wallets stay in `jisr-web`.
  Payment submission takes a `PaymentWallet` port (`assertNetwork`,
  `signTransaction`) so any Node-compatible signer can be plugged in.
- **Injected network configuration.** Operations take a `NetworkConfig`
  produced by `resolveNetworkConfig(env)`; the SDK never reads environment
  variables itself and the host decides which keys feed it.
- **Injectable logging.** Logs go through `setLogSink`; the default sink only
  touches `console` when one exists.

## Usage

```ts
import {
  parseAmountToStroops,
  resolveNetworkConfig,
  fetchSettlement,
  readTransfers,
  type HistoryStorage,
} from '@workspace/jisr-sdk';

const config = resolveNetworkConfig(process.env);
const settlement = await fetchSettlement(config.horizonUrl, txHash); // read-only

// Journal a transfer against any storage backend:
const storage: HistoryStorage = {
  getItem: (key) => db.get(key),
  setItem: (key, value) => db.set(key, value),
};
const transfers = readTransfers(storage);
```

## Tests

```bash
pnpm --filter @workspace/jisr-sdk test
```

Tests run with `node --experimental-strip-types --test` — no browser, no DOM.

## October 9 submission preparation

See the [scoped engineering backlog](docs/WAVE_BACKLOG.md). The organization
[maintainer record](https://github.com/jisr-pay/.github/blob/main/MAINTAINERS.md)
tracks ownership and remaining confirmations.

## Stellar Wave submission preparation

See the [submission brief](docs/SUBMISSION.md), [verification record](docs/VERIFICATION_OCT09.md),
[maintainers](MAINTAINERS.md), and [focused contributor backlog](docs/WAVE_BACKLOG.md).

## Router verification in 0.4.0

`buildAndSubmitVerifiedPayment` checks exact successful payment evidence before returning success. `fetchRouterPaymentEvidence` verifies one route_payment invocation, routed event, recipient net and treasury fee; `fetchVerifiedRouterSettlement` supports safe history recovery. Unknown or mismatched observations stay pending. `buildAndSubmitPayment` remains a lower-level transaction submission API: transaction success alone is not payment identity verification.

Default configuration references the October 8 synthetic Testnet router and disposable treasury. Configure a maintained router/treasury/fee policy for operator use. See docs/ROUTER_INTEGRATION.md and docs/sdk-router-payment-2026-10-08.json. Reproduce the optional Node-signer demo with `npm run build` followed by `node scripts/testnet-router-demo.mjs`; it uses only process-memory disposable keys and Testnet funds.
