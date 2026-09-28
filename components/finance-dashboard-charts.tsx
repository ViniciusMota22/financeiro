'use client';

import {motion, useReducedMotion} from 'motion/react';
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {addMonths, monthLabel, money, summary, type State} from '@/lib/finance';


type Props={data:State;month:string;categoryTotals:{category:string;total:number}[];hidden:boolean};

export default function FinanceDashboardCharts({data,month,hidden}:Props){
 const reduced=useReducedMotion();
 const months=Array.from({length:6},(_,index)=>{const date=addMonths(month,index-5),totals=summary(data,date);return {month:monthLabel(date).split(' ')[0],fullMonth:monthLabel(date),income:totals.income/100,expense:totals.expense/100,balance:totals.balance/100};});
 const averageExpense=Math.round(months.reduce((sum,item)=>sum+item.expense,0)/months.length*100);
 const currentMonth=months[months.length-1],expenseShare=currentMonth.income>0?Math.round(currentMonth.expense/currentMonth.income*100):null;
 const tooltipValue=(value:number|string|undefined)=>hidden?'R$ ••••':money(Math.round(Number(value||0)*100));
 return <div className="rf-history-chart grid gap-5 xl:grid-cols-[1.4fr_1fr]">
  <motion.section initial={reduced?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.35}} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
   <div className="mb-1 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Evolução financeira</h2><p className="mt-1 text-sm text-slate-500">Entradas e saídas nos últimos seis meses</p></div><div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#1F9D6F]"/>Entradas</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E4572E]"/>Saídas</span></div></div>
   {hidden?<div className="mt-5 grid h-64 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500 sm:h-72">Mostre os valores para consultar o gráfico.</div>:<div role="img" aria-label="Gráfico de barras com entradas e saídas dos últimos seis meses" className="mt-5 h-64 w-full sm:h-72"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:320,height:288}}><BarChart data={months} margin={{top:8,right:6,left:-18,bottom:0}} barGap={4}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}} tickFormatter={value=>value>=1000?`${Math.round(value/1000)} mil`:String(value)}/><Tooltip formatter={value=>tooltipValue(value as number)} labelFormatter={(_,payload)=>payload?.[0]?.payload?.fullMonth||''} contentStyle={{background:'var(--rf-surface)',color:'var(--rf-text)',borderRadius:14,border:'1px solid var(--rf-border)',boxShadow:'0 12px 28px rgba(15,23,42,.12)'}}/><Bar dataKey="income" name="Entradas" fill="#1F9D6F" radius={[6,6,0,0]} maxBarSize={32} isAnimationActive={!reduced}/><Bar dataKey="expense" name="Saídas" fill="#E4572E" radius={[6,6,0,0]} maxBarSize={32} isAnimationActive={!reduced}/></BarChart></ResponsiveContainer></div>}
   <div className="mt-3 grid gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2"><p>Gasto médio em 6 meses <b className="ml-1 text-slate-900">{hidden?'R$ ••••':money(averageExpense)}</b></p><p>Renda comprometida neste mês <b className="ml-1 text-slate-900">{hidden?'•••':expenseShare===null?'Sem renda definida':`${expenseShare}%`}</b></p></div>
   <div className="sr-only"><table><caption>Entradas e saídas dos últimos seis meses</caption><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>{months.map(item=><tr key={item.fullMonth}><td>{item.fullMonth}</td><td>{tooltipValue(item.income)}</td><td>{tooltipValue(item.expense)}</td><td>{tooltipValue(item.balance)}</td></tr>)}</tbody></table></div>
  </motion.section>
 </div>;
}
