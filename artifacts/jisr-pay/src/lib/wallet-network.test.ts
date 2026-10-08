import test from 'node:test';
import assert from 'node:assert/strict';
import { assertWalletNetwork } from './wallet-network.ts';
const passphrase='Test SDF Network ; September 2015';
test('wallet network must be positively established before signing',()=>{
 assert.doesNotThrow(()=>assertWalletNetwork({networkPassphrase:passphrase},passphrase));
 for(const details of [undefined,null,{}, {networkPassphrase:''},{error:'unavailable',networkPassphrase:passphrase}])assert.throws(()=>assertWalletNetwork(details,passphrase),e=>e instanceof Error && 'code' in e && e.code==='NETWORK');
 assert.throws(()=>assertWalletNetwork({networkPassphrase:'Public Global Stellar Network ; September 2015'},passphrase),e=>e instanceof Error && 'code' in e && e.code==='WRONG_NETWORK');
});
