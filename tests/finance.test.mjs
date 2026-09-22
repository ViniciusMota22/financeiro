import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueSession,verifySession,SESSION_SECONDS} from '../lib/session-token.ts';
import {amountAt,addMonths,firstInvoice,summary,demoState,emptyState} from '../lib/finance.ts';
import {financeSchema} from '../lib/finance-schema.ts';
import {createFinanceStore,RevisionConflict} from '../lib/finance-store.ts';
import {BlobPreconditionFailedError} from '@vercel/blob';
const password='synthetic-password-for-tests';const secret='synthetic-secret-at-least-32-characters';

test('installments preserve cents over 80 months and year boundaries',()=>{
 const base=demoState('2026-09').entries[0];
 for(const count of [1,3,12,80]){const e={...base,total:80001,installments:count,start:'2026-12'};let total=0;for(let i=0;i<count;i++)total+=amountAt(e,addMonths(e.start,i));assert.equal(total,80001);assert.equal(amountAt(e,addMonths(e.start,count)),0);}
 const card=demoState('2026-09').cards[0];assert.equal(firstInvoice('2026-12-26',card),'2027-02');
 assert.equal(summary({...demoState('2026-09'),salary:0},'2026-09').investment,0);
});
test('invalid dates and orphan cards are rejected',()=>{
 const data=demoState('2026-09');assert.equal(financeSchema.safeParse({data,revision:null}).success,true);
 assert.equal(financeSchema.safeParse({data:{...data,entries:[{...data.entries[0],date:'2026-02-31'}]},revision:null}).success,false);
 assert.equal(financeSchema.safeParse({data:{...data,cards:[]},revision:null}).success,false);
 assert.equal(financeSchema.safeParse({data,revision:0}).success,false);
});
test('private storage read/write, conditional concurrency, and unavailable storage',async()=>{
 process.env.BLOB_READ_WRITE_TOKEN='synthetic-token-used-only-by-test-double';
 let stored=null;let etag=null;let serial=0;
 const sdk={
   async get(path,options){assert.equal(options.access,'private');assert.equal(options.useCache,false);return stored===null?null:{statusCode:200,stream:new Blob([stored]).stream(),blob:{etag}};},
   async put(path,body,options){assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);if(stored!==null&&(!options.allowOverwrite||options.ifMatch!==etag))throw new BlobPreconditionFailedError();stored=body;etag=`etag-${++serial}`;return {etag};}
 };
 const store=createFinanceStore('caaaaaaaaaaaaaaaaaaaaaaaa',sdk);assert.deepEqual(await store.read(),{data:emptyState,revision:null});
 const data=demoState('2026-09');const first=await store.write(data,null);assert.equal(first,'etag-1');assert.deepEqual((await store.read()).data,data);
 await assert.rejects(store.write(data,null),RevisionConflict);
 const second=await store.write({...data,salary:700000},first);assert.equal(second,'etag-2');await assert.rejects(store.write(data,first),RevisionConflict);
 assert.equal((await store.read()).data.salary,700000);
 const failing=createFinanceStore('caaaaaaaaaaaaaaaaaaaaaaaa',{...sdk,get:async()=>{throw Error('offline');}});await assert.rejects(failing.read(),/offline/);
 delete process.env.BLOB_READ_WRITE_TOKEN;await assert.rejects(store.read(),/não configurado/);
});

