import type {State} from './finance';

const changed=(a:unknown,b:unknown)=>JSON.stringify(a)!==JSON.stringify(b);
function mergeById<T extends {id:string}>(base:T[],local:T[],remote:T[]){
 const before=new Map(base.map(item=>[item.id,item]));
 const localIds=new Set(local.map(item=>item.id));
 const next=remote.filter(item=>!(before.has(item.id)&&!localIds.has(item.id)));
 for(const item of local){const previous=before.get(item.id);if(previous&& !changed(previous,item))continue;const index=next.findIndex(candidate=>candidate.id===item.id);if(index<0)next.push(item);else next[index]=item;}
 return next;
}
export function mergeOffline(base:State,local:State,remote:State):State{
 return {
  ...remote,
  cards:mergeById(base.cards,local.cards,remote.cards),
  accounts:mergeById(base.accounts,local.accounts,remote.accounts),
  entries:mergeById(base.entries,local.entries,remote.entries),
  budgets:mergeById(base.budgets,local.budgets,remote.budgets),
  goals:mergeById(base.goals,local.goals,remote.goals),
  debts:mergeById(base.debts,local.debts,remote.debts),
  salary:changed(base.salary,local.salary)?local.salary:remote.salary,
  reserve:changed(base.reserve,local.reserve)?local.reserve:remote.reserve,
  incomeStart:changed(base.incomeStart,local.incomeStart)?local.incomeStart:remote.incomeStart,
  paid:changed(base.paid,local.paid)?local.paid:remote.paid,
  customCategories:Array.from(new Set([...remote.customCategories,...local.customCategories]))
 };
}
