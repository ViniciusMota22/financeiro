import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueSession,verifySession,SESSION_SECONDS} from '../lib/session-token.ts';
import {amountAt,addMonths,firstInvoice,nextInvoiceMonth,purchasesInMonth,invoicesInMonth,upsertCard,withoutCustomCategory,summary,demoState,emptyState,normalizeState} from '../lib/finance.ts';
import {financeSchema} from '../lib/finance-schema.ts';
import {createFinanceStore} from '../lib/finance-store.ts';
import {parseStatement} from '../lib/statement-import.ts';
import {mergeOffline} from '../lib/offline-merge.ts';
import {reminders} from '../lib/reminders.ts';
import {dailyExpenseComparison,expenseCategories} from '../lib/financial-insights.ts';
const password='synthetic-password-for-tests';const secret='synthetic-secret-at-least-32-characters';

test('installments preserve cents over 80 months and year boundaries',()=>{
 const base=demoState('2026-09').entries[0];
 for(const count of [1,3,12,80]){const e={...base,total:80001,installments:count,start:'2026-12'};let total=0;for(let i=0;i<count;i++)total+=amountAt(e,addMonths(e.start,i));assert.equal(total,80001);assert.equal(amountAt(e,addMonths(e.start,count)),0);}
 const card=demoState('2026-09').cards[0];assert.equal(firstInvoice('2026-12-26',card),'2027-02');
 assert.equal(summary({...demoState('2026-09'),salary:0},'2026-09').investment,0);
});
test('closing on 27 and due on 5 assigns purchases to the payable invoice',()=>{
 const card={id:'c',bank:'Nubank',name:'',closing:27,due:5,limit:100000,color:'#820ad1'};
 assert.equal(firstInvoice('2026-09-18',card),'2026-10');
 assert.equal(firstInvoice('2026-09-27',card),'2026-11');
 assert.equal(firstInvoice('2026-09-28',card),'2026-11');
 assert.equal(nextInvoiceMonth('2026-09-18',5),'2026-10');
 assert.equal(nextInvoiceMonth('2026-10-01',5),'2026-10');
 assert.equal(nextInvoiceMonth('2026-10-06',5),'2026-11');
 const entry={...demoState('2026-09').entries[0],id:'sep18',date:'2026-09-18',start:firstInvoice('2026-09-18',card),cardId:card.id,total:12345,installments:1};
 const state={...emptyState,cards:[card],entries:[entry]};
 assert.deepEqual(purchasesInMonth(state,'2026-09').map(item=>item.id),['sep18']);
 assert.equal(invoicesInMonth(state,'2026-09').length,0);
 assert.deepEqual(invoicesInMonth(state,'2026-10').map(item=>item.id),['sep18']);
 const revised=upsertCard(state,{...card,closing:15});
 assert.equal(revised.entries[0].start,'2026-11');
});
test('removing a custom category preserves purchases and moves them to Outros',()=>{
 const original=demoState('2026-09');const state={...original,customCategories:['Reforma'],entries:[{...original.entries[0],category:'Reforma'}],budgets:[{id:'b',category:'Reforma',limit:10000}]};
 const result=withoutCustomCategory(state,'Reforma');
 assert.equal(result.entries[0].total,state.entries[0].total);
 assert.equal(result.entries[0].category,'Outros');
 assert.deepEqual(result.customCategories,[]);
 assert.deepEqual(result.budgets,[]);
});
test('detailed reports use installment amounts and card due dates without inventing bank balances',()=>{
 const state=demoState('2026-09');
 const categories=expenseCategories(state,'2026-09');
 assert.equal(categories.find(item=>item.name==='Educação').value,40000);
 assert.equal(expenseCategories(state,'2026-09','recurring').find(item=>item.name==='Casa').value,150000);
 const timeline=dailyExpenseComparison(state,'2026-09');
 assert.equal(timeline.length,30);
 assert.equal(timeline[3].current,0);
 assert.equal(timeline[4].current,230000);
 assert.equal(timeline.at(-1).current,summary(state,'2026-09').expense);
 assert.equal(timeline.at(-1).previous,summary(state,'2026-08').expense);
});
test('manual bank balances remain separate from projected cash flow and merge offline',()=>{
 const base=demoState('2026-09');
 const account={id:'manual-account',bank:'Nubank',name:'Principal',balance:-12500,color:'#820ad1',updatedAt:'2026-09-25'};
 const local={...base,accounts:[account]};
 assert.equal(financeSchema.safeParse({revision:null,data:local}).success,true);
 assert.equal(summary(local,'2026-09').balance,summary(base,'2026-09').balance);
 assert.deepEqual(mergeOffline(base,local,base).accounts,[account]);
});
test('invalid dates and orphan cards are rejected',()=>{
 const data=demoState('2026-09');assert.equal(financeSchema.safeParse({data,revision:null}).success,true);
 assert.equal(financeSchema.safeParse({data:{...data,entries:[{...data.entries[0],date:'2026-02-31'}]},revision:null}).success,false);
 assert.equal(financeSchema.safeParse({data:{...data,cards:[]},revision:null}).success,false);
 assert.equal(financeSchema.safeParse({data,revision:0}).success,false);
});
test('legacy data is upgraded and Pix Crédito and borrowed-card purchases are preserved',()=>{
 const old=demoState('2026-09');delete old.accounts;delete old.budgets;delete old.goals;delete old.debts;delete old.customCategories;for(const entry of old.entries){delete entry.method;delete entry.borrower;delete entry.subscription;delete entry.tags;}
 const upgraded=normalizeState(old);assert.deepEqual(upgraded.accounts,[]);assert.deepEqual(upgraded.budgets,[]);assert.deepEqual(upgraded.goals,[]);assert.deepEqual(upgraded.debts,[]);assert.deepEqual(upgraded.customCategories,[]);assert.deepEqual(upgraded.entries[0].tags,[]);assert.equal(upgraded.entries[0].method,'credit_card');
 const pixCredit={...upgraded.entries[0],id:'pix-credit',cardId:'',method:'pix_credit',borrower:'Carlos',installments:18,total:180001,start:'2026-09'};
 const parsed=financeSchema.safeParse({revision:null,data:{...upgraded,entries:[...upgraded.entries,pixCredit]}});assert.equal(parsed.success,true);assert.equal(amountAt(pixCredit,'2026-09')+amountAt(pixCredit,'2026-10')*17,180001);
});
test('OFX and CSV statement imports preserve dates, cents and transaction direction',()=>{
 const ofx='<OFX><STMTTRN><TRNAMT>-12.34<DTPOSTED>20260923120000<NAME>PIX MERCADO</STMTTRN><STMTTRN><TRNAMT>80.50<DTPOSTED>20260924<NAME>PIX RECEBIDO</STMTTRN></OFX>';
 const fromOfx=parseStatement(ofx,'extrato.ofx');assert.equal(fromOfx.length,2);assert.deepEqual(fromOfx.map(x=>[x.date,x.total,x.kind,x.method]),[['2026-09-23',1234,'expense','pix'],['2026-09-24',8050,'income','pix']]);
 const csv='Data;Descrição;Valor\n23/09/2026;Compra no cartão;-1.234,56\n24/09/2026;PIX recebido;90,00';
 const fromCsv=parseStatement(csv,'extrato.csv');assert.equal(fromCsv.length,2);assert.deepEqual(fromCsv.map(x=>[x.total,x.kind]),[[123456,'expense'],[9000,'income']]);
 assert.equal(fromCsv[0].category,'Compras');
 assert.equal(fromCsv[1].method,'pix');
 assert.notEqual(fromCsv[0].importKey,fromCsv[1].importKey);
});
test('offline reconciliation keeps independent server and local changes',()=>{
 const base=demoState('2026-09');
 const local={...base,entries:[...base.entries,{...base.entries[0],id:'local-entry',name:'Compra offline'}]};
 const remote={...base,entries:[...base.entries,{...base.entries[0],id:'remote-entry',name:'Compra de outra aba'}]};
 const merged=mergeOffline(base,local,remote);
 assert.equal(merged.entries.length,base.entries.length+2);
 assert.ok(merged.entries.some(entry=>entry.id==='local-entry'));
 assert.ok(merged.entries.some(entry=>entry.id==='remote-entry'));
});
test('reminders include negative balance, upcoming invoice, budget and overdue goal',()=>{
 const state=demoState('2026-09');state.salary=0;
 const alerts=reminders(state,'2026-09','2026-09-24');
 assert.ok(alerts.some(alert=>alert.id==='negative'&&alert.severity==='danger'));
 assert.ok(alerts.some(alert=>alert.id==='card:nu:fechamento'));
 assert.ok(alerts.some(alert=>alert.id.startsWith('budget:'))===false);
 state.budgets[0].category='Casa';state.budgets[0].limit=100000;
 assert.ok(reminders(state,'2026-09','2026-09-24').some(alert=>alert.id==='budget:b1'));
 state.goals[0].deadline='2026-08';
 assert.ok(reminders(state,'2026-09','2026-09-24').some(alert=>alert.id==='goal:g1'));
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

