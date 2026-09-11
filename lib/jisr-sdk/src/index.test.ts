// Backend-consumer contract tests: the barrel must import cleanly under
// plain Node (no browser, no bundler) and expose the interface the API
// consumes after the freeze in docs/COLLABORATION_PLAN.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sdk = await import('./index.ts');

// Runtime names the backend (and the web re-exports) rely on. A missing name
// here is a breaking change to the frozen interface.
const REQUIRED_RUNTIME_EXPORTS = [
  'parseAmountToStroops',
  'resolveNetworkConfig',
  'TESTNET_PASSPHRASE',
  'TESTNET_XLM_TOKEN',
  'AppError',
  'classifyError',
  'isUserRejection',
  'toUserMessage',
  'fetchSettlement',
  'HISTORY_KEY',
  'applySettlement',
  'isSavedTransfer',
  'readTransfers',
  'saveTransfer',
  'settlementDurationMs',
  'createLogger',
  'setLogSink',
  'enforce',
  'record',
  'retryAfter',
  'setClock',
  'RULES',
  'buildAndSubmitPayment',
  'withRetry',
] as const;

test('SDK barrel exposes the frozen runtime interface to Node consumers', () => {
  for (const name of REQUIRED_RUNTIME_EXPORTS) {
    assert.ok(name in sdk, `missing export: ${name}`);
  }
});

test('resolveNetworkConfig works from Node with an injected env record', () => {
  const config = sdk.resolveNetworkConfig({});
  assert.equal(config.network, 'TESTNET');
  assert.ok(config.horizonUrl.startsWith('https://'));
  assert.equal(sdk.parseAmountToStroops('12.0000001'), 120000001n);
});

test('SDK core stays browser-free: no Vite env, DOM, localStorage or wallet imports', () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)));
  // VITE_* appears only as validated env-key NAMES (the host decides which
  // record to pass); the access mechanism itself (import.meta) is what's banned.
  const forbidden = ['import.meta', 'localStorage', 'document.', 'window.', 'freighter-api'];
  const offenders: string[] = [];
  for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
    const text = readFileSync(join(srcDir, file), 'utf8');
    for (const token of forbidden) {
      if (text.includes(token)) offenders.push(`${file}: ${token}`);
    }
  }
  assert.deepEqual(offenders, [], `SDK core must not reference browser/bundler APIs: ${offenders.join(', ')}`);
});
