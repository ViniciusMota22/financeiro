'use client';

import {useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {Area,AreaChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {CreditCard,TrendingDown,TrendingUp,Wallet} from 'lucide-react';
import {addMonths,amountAt,money,monthLabel,summary,type State} from '@/lib/finance';
import {dailyExpenseComparison,expenseCategories,type ExpenseFilter} from '@/lib/financial-insights';

const colors=['#4f46e5','#ec4899','#06b6d4','#10b981','#f59e0b','#8b5cf6','#f43f5e'];
const axisLabel=(value:number)=>value>=100000?`${(value/100000).toLocaleString('pt-BR',{maximumFractionDigits:1})} mil`:String(Math.round(value/100));
type Props={data:State;month:string;hidden:boolean};

export default function FinancialReportDetails({data,month,hidden}:Props){
 const reduced=useReducedMotion();
 const [filter,setFilter]=useState<ExpenseFilter>('all');
 const totals=summary(data,month),previous=summary(data,addMonths(month,-1));
 const cardBill=data.entries.filter(entry=>entry.kind==='expense'&&entry.cardId).reduce((sum,entry)=>sum+amountAt(entry,month),0);
 const categories=expenseCategories(data,month,filter);
 const categoryTotal=categories.reduce((sum,item)=>sum+item.value,0);
 const chartCategories=categories.slice(0,6);
 const other=categories.slice(6).reduce((sum,item)=>sum+item.value,0);
 if(other)chartCategories.push({name:'Outras',value:other});
 const daily=dailyExpenseComparison(data,month);
 const format=(cents:number)=>hidden?'R$ ••••':money(cents);
 const difference=totals.expense-previous.expense;
 const metrics=[
  {label:'Entradas previstas',value:totals.income,icon:TrendingUp,tone:'text-emerald-700 bg-emerald-50'},
  {label:'Despesas previstas',value:totals.expense,icon:TrendingDown,tone:'text-rose-700 bg-rose-50'},
  {label:'Faturas dos cartões',value:cardBill,icon:CreditCard,tone:'text-indigo-700 bg-indigo-50'},
  {label:'Saldo previsto',value:totals.balance,icon:Wallet,tone:totals.balance<0?'text-red-700 bg-red-50':'text-sky-700 bg-sky-50'},
 ];
 return <div className="space-y-6">
  <section className="overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-xl sm:p-8">
   <p className="text-sm text-slate-300">Balanço de {monthLabel(month)}</p>
   <strong className="mt-2 block text-3xl tracking-tight sm:text-4xl">{format(totals.balance)}</strong>
   <p className="mt-2 max-w-2xl text-sm text-slate-300">Saldo previsto com base na renda e nos lançamentos cadastrados. Não representa o saldo bancário nem confirma pagamentos.</p>
   <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-slate-300">Entradas</p><b className="mt-1 block text-xl">{format(totals.income)}</b></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-slate-300">Saídas</p><b className="mt-1 block text-xl">{format(totals.expense)}</b></div></div>
  </section>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({label,value,icon:Icon,tone},index)=><motion.article key={label} initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.28,delay:index*.04}} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={20}/></div><p className="text-sm text-slate-500">{label}</p><b className="mt-1 block text-xl">{format(value)}</b></motion.article>)}</div>
  <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
   <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-semibold">Despesas ao longo do mês</h2><p className="mt-1 text-sm text-slate-500">Acumulado previsto por dia, comparado ao mês anterior</p>
    {hidden?<div className="mt-5 grid h-64 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">Mostre os valores para consultar o gráfico.</div>:<div role="img" aria-label="Gráfico de despesas acumuladas no mês atual e anterior" className="mt-5 h-64 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:320,height:256}}><AreaChart data={daily} margin={{top:8,right:8,left:-18,bottom:0}}><defs><linearGradient id="expense-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={.3}/><stop offset="100%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}} tickFormatter={axisLabel}/><Tooltip formatter={value=>money(Number(value||0))} labelFormatter={day=>`Dia ${day}`} contentStyle={{borderRadius:12,border:'1px solid #e2e8f0'}}/><Area dataKey="previous" name="Mês anterior" type="stepAfter" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" isAnimationActive={!reduced}/><Area dataKey="current" name="Mês selecionado" type="stepAfter" stroke="#f43f5e" strokeWidth={3} fill="url(#expense-area)" isAnimationActive={!reduced}/></AreaChart></ResponsiveContainer></div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm"><span className="text-slate-600">{hidden?'Comparação oculta':difference>0?'Despesas maiores que no mês anterior':difference<0?'Despesas menores que no mês anterior':'Despesas iguais às do mês anterior'}</span><b className={hidden?'text-slate-500':difference>0?'text-rose-600':'text-emerald-600'}>{hidden?'R$ ••••':`${difference>0?'+':''}${format(difference)}`}</b></div>
    <div className="sr-only"><table><caption>Despesas acumuladas por dia</caption><thead><tr><th>Dia</th><th>Mês selecionado</th><th>Mês anterior</th></tr></thead><tbody>{daily.map(item=><tr key={item.day}><td>{item.day}</td><td>{format(item.current)}</td><td>{format(item.previous)}</td></tr>)}</tbody></table></div>
   </section>
   <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-semibold">Gastos por categoria</h2><p className="mt-1 text-sm text-slate-500">Veja onde as despesas estão concentradas</p><div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar categorias">{([['all','Todas'],['recurring','Recorrentes'],['other','Outras']] as const).map(([value,label])=><button key={value} onClick={()=>setFilter(value)} aria-pressed={filter===value} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter===value?'bg-indigo-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div>
    {hidden?<div className="mt-5 grid h-48 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">Mostre os valores para consultar as categorias.</div>:categories.length?<><div className="relative mx-auto mt-3 h-44 max-w-56" role="img" aria-label="Distribuição das despesas por categoria"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:224,height:176}}><PieChart><Pie data={chartCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={49} outerRadius={73} paddingAngle={2} stroke="none" isAnimationActive={!reduced}>{chartCategories.map((item,index)=><Cell key={item.name} fill={colors[index]}/>)}</Pie><Tooltip formatter={value=>money(Number(value||0))} contentStyle={{borderRadius:12,border:'1px solid #e2e8f0'}}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><small className="text-slate-500">Total</small><b>{money(categoryTotal)}</b></div></div><ul className="mt-2 max-h-72 overflow-y-auto">{categories.map((item,index)=><li key={item.name} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:colors[index%colors.length]}}/><span className="truncate">{item.name}</span><small className="text-slate-500">{Math.round(item.value/categoryTotal*100)}%</small></span><b className="whitespace-nowrap">{money(item.value)}</b></li>)}</ul></>:<p className="mt-12 text-center text-sm text-slate-500">Nenhuma despesa neste filtro.</p>}
   </section>
  </div>
 </div>;
}
