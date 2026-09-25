import {addMonths,amountAt,type Entry,type State} from './finance.ts';

export type ExpenseFilter='all'|'recurring'|'other';

export function expenseCategories(state:State,month:string,filter:ExpenseFilter='all'){
 const totals=new Map<string,number>();
 for(const entry of state.entries){
  if(entry.kind!=='expense'||(filter==='recurring'&&!entry.recurring)||(filter==='other'&&entry.recurring))continue;
  const amount=amountAt(entry,month);
  if(amount>0)totals.set(entry.category,(totals.get(entry.category)||0)+amount);
 }
 return [...totals].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
}

function dueDay(entry:Entry,state:State){
 const card=state.cards.find(item=>item.id===entry.cardId);
 return card?card.due:Number(entry.date.slice(8,10));
}

export function dailyExpenseComparison(state:State,month:string){
 const previous=addMonths(month,-1);
 const days=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
 const previousDays=new Date(Number(previous.slice(0,4)),Number(previous.slice(5,7)),0).getDate();
 const currentAmounts=Array(days+1).fill(0) as number[];
 const previousAmounts=Array(previousDays+1).fill(0) as number[];
 for(const entry of state.entries){
  if(entry.kind!=='expense')continue;
  const day=dueDay(entry,state);
  const currentAmount=amountAt(entry,month),previousAmount=amountAt(entry,previous);
  if(currentAmount>0)currentAmounts[Math.min(days,Math.max(1,day))]+=currentAmount;
  if(previousAmount>0)previousAmounts[Math.min(previousDays,Math.max(1,day))]+=previousAmount;
 }
 let currentTotal=0,previousTotal=0;
 const previousCumulative=previousAmounts.map(amount=>(previousTotal+=amount));
 return Array.from({length:days},(_,index)=>{
  const day=index+1;
  currentTotal+=currentAmounts[day];
  return {day,current:currentTotal,previous:previousCumulative[Math.min(day,previousDays)]};
 });
}
