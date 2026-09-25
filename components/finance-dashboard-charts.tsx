'use client';

import {motion, useReducedMotion} from 'motion/react';
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {addMonths, monthLabel, money, summary, type State} from '@/lib/finance';

const palette=['#4f46e5','#06b6d4','#10b981','#f59e0b','#f43f5e','#8b5cf6'];

type Props={data:State;month:string;categoryTotals:{category:string;total:number}[];hidden:boolean};

export default function FinanceDashboardCharts({data,month,categoryTotals,hidden}:Props){
 const reduced=useReducedMotion();
 const months=Array.from({length:6},(_,index)=>{const date=addMonths(month,index-5),totals=summary(data,date);return {month:monthLabel(date).split(' ')[0],fullMonth:monthLabel(date),income:totals.income/100,expense:totals.expense/100,balance:totals.balance/100};});
 const averageExpense=Math.round(months.reduce((sum,item)=>sum+item.expense,0)/months.length*100);
 const currentMonth=months[months.length-1],expenseShare=currentMonth.income>0?Math.round(currentMonth.expense/currentMonth.income*100):null;
 const total=categoryTotals.reduce((sum,item)=>sum+item.total,0);
 const slices=categoryTotals.slice(0,5).map(item=>({name:item.category,value:item.total}));
 const rest=categoryTotals.slice(5).reduce((sum,item)=>sum+item.total,0);
 if(rest>0)slices.push({name:'Outras categorias',value:rest});
 const tooltipValue=(value:number|string|undefined)=>hidden?'R$ ••••':money(Math.round(Number(value||0)*100));
 return <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
  <motion.section initial={reduced?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.35}} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
   <div className="mb-1 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Evolução financeira</h2><p className="mt-1 text-sm text-slate-500">Entradas e saídas nos últimos seis meses</p></div><div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>Entradas</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500"/>Saídas</span></div></div>
   {hidden?<div className="mt-5 grid h-64 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500 sm:h-72">Mostre os valores para consultar o gráfico.</div>:<div role="img" aria-label="Gráfico de barras com entradas e saídas dos últimos seis meses" className="mt-5 h-64 w-full sm:h-72"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:320,height:288}}><BarChart data={months} margin={{top:8,right:6,left:-18,bottom:0}} barGap={4}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}} tickFormatter={value=>value>=1000?`${Math.round(value/1000)} mil`:String(value)}/><Tooltip formatter={value=>tooltipValue(value as number)} labelFormatter={(_,payload)=>payload?.[0]?.payload?.fullMonth||''} contentStyle={{borderRadius:14,border:'1px solid #e2e8f0',boxShadow:'0 12px 28px rgba(15,23,42,.12)'}}/><Bar dataKey="income" name="Entradas" fill="#10b981" radius={[6,6,0,0]} maxBarSize={32} isAnimationActive={!reduced}/><Bar dataKey="expense" name="Saídas" fill="#4f46e5" radius={[6,6,0,0]} maxBarSize={32} isAnimationActive={!reduced}/></BarChart></ResponsiveContainer></div>}
   <div className="mt-3 grid gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2"><p>Gasto médio em 6 meses <b className="ml-1 text-slate-900">{hidden?'R$ ••••':money(averageExpense)}</b></p><p>Renda comprometida neste mês <b className="ml-1 text-slate-900">{hidden?'•••':expenseShare===null?'Sem renda definida':`${expenseShare}%`}</b></p></div>
   <div className="sr-only"><table><caption>Entradas e saídas dos últimos seis meses</caption><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>{months.map(item=><tr key={item.fullMonth}><td>{item.fullMonth}</td><td>{tooltipValue(item.income)}</td><td>{tooltipValue(item.expense)}</td><td>{tooltipValue(item.balance)}</td></tr>)}</tbody></table></div>
  </motion.section>
  <motion.section initial={reduced?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.35,delay:.08}} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
   <h2 className="font-semibold">Distribuição das despesas</h2><p className="mt-1 text-sm text-slate-500">Categorias de {monthLabel(month)}</p>
   {hidden?<div className="mt-5 grid h-52 place-items-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">Mostre os valores para consultar as categorias.</div>:slices.length?<><div role="img" aria-label="Gráfico de rosca com despesas por categoria" className="relative mx-auto mt-2 h-48 max-w-64"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:256,height:192}}><PieChart><Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none" isAnimationActive={!reduced}>{slices.map((item,index)=><Cell key={item.name} fill={palette[index]}/>)}</Pie><Tooltip formatter={value=>money(Number(value||0))} contentStyle={{borderRadius:14,border:'1px solid #e2e8f0'}}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-slate-500">Total</span><b className="text-lg">{money(total)}</b></div></div><ul className="mt-2 grid gap-2">{slices.map((item,index)=><li key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:palette[index]}}/><span className="truncate">{item.name}</span></span><b className="whitespace-nowrap">{Math.round(item.value/total*100)}%</b></li>)}</ul></>:<div className="grid h-52 place-items-center text-center text-sm text-slate-500">Registre uma despesa para ver a distribuição.</div>}
  </motion.section>
 </div>;
}
