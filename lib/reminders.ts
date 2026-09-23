import {amountAt,monthLabel,summary,type State} from './finance.ts';

export type Reminder={id:string;title:string;detail:string;severity:'info'|'warning'|'danger'};
const daysBetween=(date:string,today:string)=>Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);
function nextDay(day:number,today:string){const year=Number(today.slice(0,4)),month=Number(today.slice(5,7));for(let offset=0;offset<2;offset++){const last=new Date(Date.UTC(year,month+offset,0)).getUTCDate();const value=new Date(Date.UTC(year,month-1+offset,Math.min(day,last))).toISOString().slice(0,10);if(value>=today)return value;}return today;}
export function reminders(state:State,month:string,today:string):Reminder[]{
 const notices:Reminder[]=[];
 const totals=summary(state,month);
 if(totals.balance<0)notices.push({id:'negative',title:'Saldo previsto negativo',detail:'As despesas superam as entradas em R$ '+(Math.abs(totals.balance)/100).toFixed(2)+' em '+monthLabel(month)+'.',severity:'danger'});
 for(const card of state.cards){
  for(const [kind,day] of [['fechamento',card.closing],['vencimento',card.due]] as const){const due=nextDay(day,today),distance=daysBetween(due,today);if(distance<=3)notices.push({id:'card:'+card.id+':'+kind,title:(kind==='fechamento'?'Fechamento':'Vencimento')+' da fatura — '+card.bank,detail:(distance===0?'Hoje':'Em '+distance+' dia(s)')+': '+due.split('-').reverse().join('/')+'.',severity:kind==='vencimento'?'warning':'info'});}
 }
 for(const entry of state.entries.filter(item=>item.kind==='expense'&&(item.recurring||item.subscription))){
  const date=nextDay(Number(entry.date.slice(8,10)),today),distance=daysBetween(date,today);
  if(distance<=3)notices.push({id:'entry:'+entry.id,title:(entry.subscription?'Assinatura: ':'Conta recorrente: ')+entry.name,detail:(distance===0?'Hoje':'Em '+distance+' dia(s)')+': '+date.split('-').reverse().join('/')+' · R$ '+(entry.total/100).toFixed(2)+'.',severity:'info'});
 }
 for(const budget of state.budgets){const spent=state.entries.filter(entry=>entry.kind==='expense'&&entry.category===budget.category).reduce((value,entry)=>value+amountAt(entry,month),0);if(budget.limit>0&&spent/budget.limit>=.8)notices.push({id:'budget:'+budget.id,title:'Orçamento de '+budget.category,detail:Math.round(spent/budget.limit*100)+'% do limite mensal utilizado.',severity:spent>budget.limit?'danger':'warning'});}
 for(const goal of state.goals){if(goal.deadline<month&&goal.saved<goal.target)notices.push({id:'goal:'+goal.id,title:'Meta atrasada: '+goal.name,detail:'Prazo previsto: '+monthLabel(goal.deadline)+'.',severity:'warning'});}
 return notices;
}
