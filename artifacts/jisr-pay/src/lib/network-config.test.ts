import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNetworkConfig, TESTNET_PASSPHRASE, TESTNET_XLM_TOKEN } from './network-config.ts';

test('defaults consistently describe native Testnet XLM', () => {
  const config = resolveNetworkConfig({});
  assert.equal(config.network, 'TESTNET');
  assert.equal(config.networkPassphrase, TESTNET_PASSPHRASE);
  assert.equal(config.tokenAddress, TESTNET_XLM_TOKEN);
  assert.deepEqual(resolveNetworkConfig({ VITE_HORIZON_URL: '  ' }), config);
});

test('rejects a network or asset that signing and receipts cannot support', () => {
  assert.throws(() => resolveNetworkConfig({ VITE_NETWORK_PASSPHRASE: 'Public Global Stellar Network ; September 2015' }), /Testnet only/);
  assert.throws(() => resolveNetworkConfig({ VITE_TOKEN_ADDRESS: 'C' + 'A'.repeat(55) }), /native Testnet XLM/);
});

test('custom endpoints require HTTPS and cannot embed secrets or query parameters', () => {
  for (const endpoint of ['http://example.com', 'https://user:secret@example.com', 'https://example.com?key=secret', 'https://example.com#fragment']) {
    assert.throws(() => resolveNetworkConfig({ VITE_SOROBAN_RPC_URL: endpoint }), /HTTPS endpoint/);
  }
  assert.equal(resolveNetworkConfig({ VITE_SOROBAN_RPC_URL: ' https://example.com/rpc/// ' }).rpcUrl, 'https://example.com/rpc');
});

test('configuration rejects malformed account and contract addresses', () => {
  assert.throws(() => resolveNetworkConfig({ VITE_TREASURY_ADDRESS: 'not-an-account' }), /VITE_TREASURY_ADDRESS/);
  assert.throws(() => resolveNetworkConfig({ VITE_CONTRACT_ID: 'G' + 'A'.repeat(55) }), /VITE_CONTRACT_ID/);
});
