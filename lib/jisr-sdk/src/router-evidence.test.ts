import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { xdr, nativeToScVal } from '@stellar/stellar-sdk';
import { verifyRouterPayment, fetchRouterPaymentEvidence } from './router-evidence.ts';
const fixture = JSON.parse(readFileSync(new URL('../test/fixtures/router-payment.json', import.meta.url), 'utf8'));
const policy = { contractId: 'CCGSUUQLWXKU6AZ6YKUNXLR7R6KLBYBG4AJGJ54XV4DC63AJ3LDVPNW4', tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', treasuryAddress: 'GBHS7NUWCDQAQSC2DFM5E7BBYRD74KVJPCVE3OVYMU7LBQDSJBY34AAP', feeBps: 125 };
const claim = { hash: fixture.txHash, contractId: policy.contractId, sender: 'GB34YRHMR75TG554F7PUUKOPNZZVNCNW3BGO3VN7N5E2C3DOC2DSXWY2', recipient: 'GBSRRMJVNL2L66LZKZNHNAZDDJ7XXOJ65HC7Z52A4HG7PT7QJG5MFP24', amount: '1' };
const copy = () => structuredClone(fixture);
test('actual Testnet invocation and transfer events prove exact total, net and fee', () => {
 assert.deepEqual(verifyRouterPayment(claim, policy, fixture), {paymentVerified: true, reason: 'ROUTER_PAYMENT_MATCH', netUnits: '9875000', feeUnits: '125000', ledger: fixture.ledger});
});
test('wrong claim or configured policy cannot verify an otherwise successful payment', () => {
 for (const altered of [{amount:'1.0000001'}, {sender:claim.recipient}, {recipient:policy.treasuryAddress}, {hash:'a'.repeat(64)}, {contractId:policy.tokenAddress}]) assert.equal(verifyRouterPayment({...claim,...altered},policy,fixture).paymentVerified,false);
 for (const altered of [{feeBps:124},{treasuryAddress:claim.recipient},{contractId:policy.tokenAddress}]) assert.equal(verifyRouterPayment(claim,{...policy,...altered},fixture).paymentVerified,false);
});
test('missing, duplicated and unrelated events never prove settlement', () => {
 for(const index of [0,1,2]) {let f=copy(); f.events.contractEventsXdr[0].splice(index,1);assert.equal(verifyRouterPayment(claim,policy,f).paymentVerified,false);}
 let f=copy();f.events.contractEventsXdr[0].push(f.events.contractEventsXdr[0][0]);assert.equal(verifyRouterPayment(claim,policy,f).paymentVerified,false);
 f=copy();f.events={diagnosticEventsXdr:fixture.events.contractEventsXdr[0]};assert.equal(verifyRouterPayment(claim,policy,f).paymentVerified,false);
});
test('a forged routed event cannot replace the actual token credit amount', () => {
 let f=copy();let e=xdr.ContractEvent.fromXDR(f.events.contractEventsXdr[0][0],'base64');e.body().v0().data(nativeToScVal(9875001n,{type:'i128'}));f.events.contractEventsXdr[0][0]=e.toXDR('base64');assert.equal(verifyRouterPayment(claim,policy,f).paymentVerified,false);
});
test('malformed envelopes/events and unknown or failed responses remain unverified', () => {
 for(const altered of [{status:'NOT_FOUND'},{status:'FAILED'},{envelopeXdr:'bad'},{ledger:0},{events:{contractEventsXdr:[['bad']]}}])assert.equal(verifyRouterPayment(claim,policy,{...fixture,...altered}).paymentVerified,false);
});
test('RPC network identity, abort policy and error responses are checked', async () => {
 const calls:any[]=[];const fetcher = async (_:any, options:any) => {calls.push(options);const req=JSON.parse(options.body);return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:req.method==='getNetwork'?{passphrase:'Test SDF Network ; September 2015'}:fixture}));};
 assert.equal((await fetchRouterPaymentEvidence('https://rpc.invalid',claim,policy,{fetcher})).paymentVerified,true);assert.equal(calls.length,2);assert.equal(calls[0].redirect,'error');assert.ok(calls[0].signal);
 await assert.rejects(fetchRouterPaymentEvidence('https://rpc.invalid',claim,policy,{fetcher:async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:{passphrase:'wrong'}}))}),/Testnet/);
 await assert.rejects(fetchRouterPaymentEvidence('https://rpc.invalid',claim,policy,{fetcher:async()=>new Response('{}',{status:429})}),/unavailable/);
});

test('history confirmation requires matching network, ledger and payment identity', async () => {
 const { fetchVerifiedRouterSettlement }=await import('./router-evidence.ts');
 for(const valid of [true,false]) {
  const fetcher=async(input:any,options:any)=>{
   if(options?.method==='POST'){const req=JSON.parse(options.body);return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:req.method==='getNetwork'?{passphrase:'Test SDF Network ; September 2015'}:fixture}));}
   return new Response(JSON.stringify(String(input).includes('/transactions/')?{hash:claim.hash,successful:true,ledger:valid?fixture.ledger:fixture.ledger+1,fee_charged:'100',created_at:'2026-10-08T13:18:10Z'}:{network_passphrase:'Test SDF Network ; September 2015'}));
  };
  const result=await fetchVerifiedRouterSettlement('https://horizon.invalid','https://rpc.invalid',claim,policy,{fetcher});assert.equal(Boolean(result),valid);
 }
});

test('one-stroop payments prove the floor-rounded zero fee without a treasury transfer', async () => {
 const {TransactionBuilder}=await import('@stellar/stellar-sdk');
 const f=copy();const env=xdr.TransactionEnvelope.fromXDR(f.envelopeXdr,'base64');const invocation=env.v1().tx().operations()[0].body().invokeHostFunctionOp().hostFunction().invokeContract();const args=invocation.args();args[4]=nativeToScVal(1n,{type:'i128'});invocation.args(args);f.envelopeXdr=env.toXDR('base64');f.txHash=TransactionBuilder.fromXDR(f.envelopeXdr,'Test SDF Network ; September 2015').hash().toString('hex');
 let event=xdr.ContractEvent.fromXDR(f.events.contractEventsXdr[0][0],'base64');event.body().v0().data(nativeToScVal(1n,{type:'i128'}));f.events.contractEventsXdr[0][0]=event.toXDR('base64');
 event=xdr.ContractEvent.fromXDR(f.events.contractEventsXdr[0][2],'base64');const values=event.body().v0().data().vec()!;values[1]=nativeToScVal(1n,{type:'i128'});values[2]=nativeToScVal(1n,{type:'i128'});values[3]=nativeToScVal(0n,{type:'i128'});event.body().v0().data(xdr.ScVal.scvVec(values));f.events.contractEventsXdr[0][2]=event.toXDR('base64');f.events.contractEventsXdr[0].splice(1,1);
 const proof=verifyRouterPayment({...claim,hash:f.txHash,amount:'0.0000001'},policy,f);assert.equal(proof.paymentVerified,true);assert.equal(proof.feeUnits,'0');assert.equal(proof.netUnits,'1');
});

test('review quotes use exact floor rounding and expose total debit versus recipient amount',async()=>{
 const {quoteRouterPayment}=await import('./router-evidence.ts');
 assert.deepEqual(quoteRouterPayment('1',125),{totalUnits:'10000000',netUnits:'9875000',feeUnits:'125000',recipientAmount:'0.9875000',routerFeePaid:'0.0125000'});
 assert.equal(quoteRouterPayment('0.0000001',125).routerFeePaid,'0.0000000');
 assert.throws(()=>quoteRouterPayment('1',1001));
});
