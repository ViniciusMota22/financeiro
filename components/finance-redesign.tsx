'use client';

import {ArrowDownLeft,ArrowUpRight,Plus,MoreHorizontal,LayoutDashboard,CreditCard,ArrowLeftRight} from 'lucide-react';
import {money,monthLabel,type Entry} from '@/lib/finance';

const colors=['#6C3CE9','#B79BFF','#7D63AE','#D18BB5','#A994D6','#E4572E'];
export function DashboardHero({balance,income,expense,reserve,month,categories,hidden,openReports}:{balance:number;income:number;expense:number;reserve:number;month:string;categories:{category:string;total:number}[];hidden:boolean;openReports:()=>void}){
 const fmt=(v:number)=>hidden?'R$ ••••':money(v),total=categories.reduce((s,c)=>s+c.total,0);
 const plotted=categories.length>5?[...categories.slice(0,4),{category:'Demais categorias',total:categories.slice(4).reduce((sum,item)=>sum+item.total,0)}]:categories;
 const gradient=plotted.map((c,i)=>{const start=plotted.slice(0,i).reduce((sum,item)=>sum+item.total,0)/Math.max(1,total)*100,end=start+c.total/Math.max(1,total)*100;return `${colors[i%colors.length]} ${start}% ${end}%`}).join(',');
 return <div className="rf-dashboard-top"><section className="rf-balance"><div className="rf-balance-heading"><span>Seu saldo previsto</span><span className="rf-balance-month">{monthLabel(month)}</span></div><strong className="rf-balance-number">{fmt(balance)}</strong><p>O que sobra depois dos compromissos do mês.</p><div className="rf-balance-stats"><div><span><ArrowDownLeft size={16}/>Entradas</span><b>{fmt(income)}</b></div><div><span><ArrowUpRight size={16}/>Saídas</span><b>{fmt(expense)}</b></div></div><div className="rf-balance-note">Reserva planejada <b>{fmt(reserve)}</b><small>Valores previstos a partir dos seus registros.</small></div></section><section className="rf-spending"><div className="rf-section-title"><div><p>O destino do seu dinheiro</p><h2>Gastos por categoria</h2></div><button onClick={openReports}>Detalhes ↗</button></div>{hidden?<p className="rf-chart-empty">Mostre os valores para consultar as categorias.</p>:total?<div className="rf-donut-layout"><div className="rf-donut" role="img" aria-label={`Despesas totais ${money(total)}`} style={{background:`conic-gradient(${gradient})`}}><div><span>Total do mês</span><strong>{money(total)}</strong></div></div><ul>{plotted.map((c,i)=><li key={c.category}><span><i style={{background:colors[i%colors.length]}}/>{c.category}</span><b>{money(c.total)}<small>{Math.round(c.total/total*100)}%</small></b></li>)}</ul></div>:<p className="rf-chart-empty">Seu gráfico começa com a primeira despesa.</p>}</section></div>;
}

export function DashboardSummary({income,expense,balance,reserve,previous,reservePercent,hidden}:{income:number;expense:number;balance:number;reserve:number;previous:{income:number;expense:number};reservePercent:number;hidden:boolean}){
 const fmt=(v:number)=>hidden?'R$ ••••':money(v);
 const comparison=(value:number,before:number)=>hidden?'Comparação oculta':before>0?`${value>=before?'+':''}${((value-before)/before*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% em relação ao mês anterior`:'Sem base no mês anterior';
 const ratio=(value:number)=>hidden?'Percentual oculto':income>0?`${(value/income*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% das entradas do mês`:'Sem entradas para calcular percentual';
 return <section className="rf-summary-grid" aria-label="Resumo financeiro do mês">
 <article className="rf-summary-card"><span><ArrowDownLeft size={18}/>Entradas do mês</span><strong className="rf-positive">{fmt(income)}</strong><small>{comparison(income,previous.income)}</small></article>
 <article className="rf-summary-card"><span><ArrowUpRight size={18}/>Despesas do mês</span><strong className="rf-negative">{fmt(expense)}</strong><small>{comparison(expense,previous.expense)}</small><small>{ratio(expense)}</small></article>
 <article className="rf-summary-card"><span>Saldo previsto</span><strong className={balance<0?'rf-negative':''}>{fmt(balance)}</strong><small>{ratio(balance)}</small></article>
 <article className="rf-summary-card"><span>Reserva planejada</span><strong>{fmt(reserve)}</strong><small>{hidden?'Percentual oculto':`${reservePercent}% do saldo positivo`}</small></article>
 </section>;
}

export function RecentEntries({entries,hidden,open}:{entries:Entry[];hidden:boolean;open:()=>void}){
 return <section className="rf-recent"><div className="rf-section-title"><div><p>Seu dia a dia</p><h2>Últimos lançamentos</h2></div><button onClick={open}>Ver todos ↗</button></div>{entries.length?entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(e=><div className="rf-recent-row" key={e.id}><span className={`rf-flow-icon ${e.kind==='income'?'rf-positive':'rf-negative'}`}>{e.kind==='income'?<ArrowDownLeft size={20}/>:<ArrowUpRight size={20}/>}</span><div><b>{e.name}</b><small>{e.category} · {e.date.split('-').reverse().join('/')}</small></div><strong className={e.kind==='income'?'rf-positive':'rf-negative'}>{hidden?'R$ ••••':`${e.kind==='income'?'+':'−'} ${money(e.total)}`}</strong></div>):<p className="rf-chart-empty">Registre uma movimentação para começar.</p>}</section>;
}

export function MobileTabs({view,navigate,more,add}:{view:string;navigate:(view:'dashboard'|'cards'|'entries')=>void;more:()=>void;add:()=>void}){
 return <nav className="rf-mobile-tabs" aria-label="Navegação principal"><button onClick={()=>navigate('dashboard')} aria-current={view==='dashboard'?'page':undefined}><LayoutDashboard size={21}/><span>Início</span></button><button onClick={()=>navigate('cards')} aria-current={view==='cards'?'page':undefined}><CreditCard size={21}/><span>Cartões</span></button><button className="rf-new-entry" onClick={add} aria-label="Lançamento rápido" title="Lançamento rápido"><Plus size={28}/></button><button onClick={()=>navigate('entries')} aria-current={view==='entries'?'page':undefined}><ArrowLeftRight size={21}/><span>Lançamentos</span></button><button onClick={more} aria-current={!['dashboard','cards','entries'].includes(view)?'page':undefined}><MoreHorizontal size={21}/><span>Mais</span></button></nav>;
}
