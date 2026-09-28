'use client';

import {useState} from 'react';
import {CreditCard} from 'lucide-react';
import Image from 'next/image';

/** Verified PNG assets copied locally from logos-bancos-br for offline display. */
const ispb:Record<string,string>={
 'Nubank':'18236120','PicPay':'22896431','Banco do Brasil':'00000000',
 'Caixa Econômica Federal':'00360305','Santander':'90400888','Itaú':'60701190',
 'Bradesco':'60746948','Inter':'00416968','C6 Bank':'31872495',
 'BTG Pactual':'30306294','Mercado Pago':'10573521',
 'Sicredi':'01181521','Sicoob':'04891850','Banrisul':'92702067',
};

export function bankLogoUrl(bank:string){const id=ispb[bank];return id?`/banks/${id}.png`:null;}

export default function BankLogo({bank,size=36}:{bank:string;size?:number}){
 const [failed,setFailed]=useState(false),url=bankLogoUrl(bank);
 return <span aria-label={`Logo de ${bank}`} className="rf-bank-logo inline-grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-500" style={{width:size,height:size}}>
  {url&&!failed?<Image src={url} alt="" unoptimized width={size-7} height={size-7} className="max-h-full max-w-full object-contain" onError={()=>setFailed(true)}/>:<CreditCard size={Math.round(size*.5)} aria-hidden="true"/>}
 </span>;
}

export function BankSelector({name='bank',selected='Nubank',banks}:{name?:string;selected?:string;banks:string[]}){
 return <fieldset><legend className="mb-2 text-sm font-medium text-slate-700">Instituição</legend><div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-3">{banks.map(bank=><label key={bank} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2 text-xs hover:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"><input type="radio" name={name} value={bank} defaultChecked={bank===selected} className="sr-only"/><BankLogo bank={bank} size={30}/><span className="min-w-0 truncate">{bank}</span></label>)}</div></fieldset>;
}

export function CardPicker({cards,selected='',onSelect}:{cards:{id:string;bank:string;name:string}[];selected?:string;onSelect?:(id:string)=>void}){
 return <fieldset><legend className="mb-2 text-sm font-medium text-slate-700">Cartão usado</legend>{cards.length?<div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">{cards.map(card=><label key={card.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm hover:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"><input type="radio" name="cardId" value={card.id} defaultChecked={card.id===selected} onChange={()=>onSelect?.(card.id)} required className="accent-indigo-600"/><BankLogo bank={card.bank} size={34}/><span className="min-w-0 truncate">{card.bank}{card.name?` — ${card.name}`:''}</span></label>)}</div>:<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Cadastre um cartão antes de registrar uma compra no crédito.</p>}</fieldset>;
}
