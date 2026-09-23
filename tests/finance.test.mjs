import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueSession,verifySession,SESSION_SECONDS} from '../lib/session-token.ts';
import {amountAt,addMonths,firstInvoice,summary,demoState,emptyState,normalizeState} from '../lib/finance.ts';
import {financeSchema} from '../lib/finance-schema.ts';
import {createFinanceStore} from '../lib/finance-store.ts';
import {parseStatement} from '../lib/statement-import.ts';
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
test('legacy data is upgraded and Pix Crédito and borrowed-card purchases are preserved',()=>{
 const old=demoState('2026-09');delete old.budgets;delete old.goals;delete old.debts;delete old.customCategories;for(const entry of old.entries){delete entry.method;delete entry.borrower;delete entry.subscription;delete entry.tags;}
 const upgraded=normalizeState(old);assert.deepEqual(upgraded.budgets,[]);assert.deepEqual(upgraded.goals,[]);assert.deepEqual(upgraded.debts,[]);assert.deepEqual(upgraded.customCategories,[]);assert.deepEqual(upgraded.entries[0].tags,[]);assert.equal(upgraded.entries[0].method,'credit_card');
 const pixCredit={...upgraded.entries[0],id:'pix-credit',cardId:'',method:'pix_credit',borrower:'Carlos',installments:18,total:180001,start:'2026-09'};
 const parsed=financeSchema.safeParse({revision:null,data:{...upgraded,entries:[...upgraded.entries,pixCredit]}});assert.equal(parsed.success,true);assert.equal(amountAt(pixCredit,'2026-09')+amountAt(pixCredit,'2026-10')*17,180001);
});
test('OFX and CSV statement imports preserve dates, cents and transaction direction',()=>{
 const ofx='<OFX><STMTTRN><TRNAMT>-12.34<DTPOSTED>20260923120000<NAME>PIX MERCADO</STMTTRN><STMTTRN><TRNAMT>80.50<DTPOSTED>20260924<NAME>PIX RECEBIDO</STMTTRN></OFX>';
 const fromOfx=parseStatement(ofx,'extrato.ofx');assert.equal(fromOfx.length,2);assert.deepEqual(fromOfx.map(x=>[x.date,x.total,x.kind,x.method]),[['2026-09-23',1234,'expense','pix'],['2026-09-24',8050,'income','pix']]);
 const csv='Data;Descrição;Valor\n23/09/2026;Compra no cartão;-1.234,56\n24/09/2026;PIX recebido;90,00';
 const fromCsv=parseStatement(csv,'extrato.csv');assert.equal(fromCsv.length,2);assert.deepEqual(fromCsv.map(x=>[x.total,x.kind]),[[123456,'expense'],[9000,'income']]);
});
test('private storage read/write, overwrite, and unavailable storage',async()=>{
 process.env.BLOB_READ_WRITE_TOKEN='synthetic-token-used-only-by-test-double';
 let stored=null;let etag=null;let serial=0;
 const sdk={
   async get(path,options){assert.equal(options.access,'private');assert.equal(options.useCache,false);return stored===null?null:{statusCode:200,stream:new Blob([stored]).stream(),blob:{etag}};},
   async put(path,body,options){assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);assert.equal(options.allowOverwrite,true);assert.equal(options.ifMatch,undefined);stored=body;etag=`etag-${++serial}`;return {etag};}
 };
 const store=createFinanceStore('caaaaaaaaaaaaaaaaaaaaaaaa',sdk);assert.deepEqual(await store.read(),{data:emptyState,revision:null});
 const data=demoState('2026-09');const first=await store.write(data,null);assert.equal(first,'etag-1');assert.deepEqual((await store.read()).data,data);
 const second=await store.write({...data,salary:700000},first);assert.equal(second,'etag-2');
 assert.equal((await store.read()).data.salary,700000);
 const failing=createFinanceStore('caaaaaaaaaaaaaaaaaaaaaaaa',{...sdk,get:async()=>{throw Error('offline');}});await assert.rejects(failing.read(),/offline/);
 delete process.env.BLOB_READ_WRITE_TOKEN;await assert.rejects(store.read(),/não configurado/);
});

