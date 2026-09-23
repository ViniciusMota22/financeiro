import type {Entry,PaymentMethod} from './finance';

export type Imported=Pick<Entry,'name'|'description'|'date'|'total'|'kind'|'method'|'category'|'importKey'>;

function dateValue(raw:string){
 const value=raw.trim();
 const brazil=value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
 if(brazil)return `${brazil[3]}-${brazil[2].padStart(2,'0')}-${brazil[1].padStart(2,'0')}`;
 const iso=value.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
 return iso?`${iso[1]}-${iso[2]}-${iso[3]}`:'';
}
function validDate(value:string){const parsed=Date.parse(`${value}T12:00:00Z`);return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value;}
function paymentMethod(text:string):PaymentMethod{
 if(/pix/i.test(text))return 'pix';
 if(/cart[aã]o|cr[eé]dito/i.test(text))return 'credit_card';
 if(/d[eé]bito/i.test(text))return 'debit_card';
 if(/boleto/i.test(text))return 'boleto';
 return 'bank_transfer';
}
export function suggestCategory(text:string){
 const value=text.toLocaleLowerCase('pt-BR');
 if(/mercado|supermercado|restaurante|ifood|lanche|padaria|alimento/.test(value))return 'Alimentação';
 if(/uber|99app|combust[ií]vel|posto|transporte|metr[oô]|[oô]nibus/.test(value))return 'Transporte';
 if(/farm[aá]cia|hospital|consulta|plano de sa[uú]de/.test(value))return 'Saúde';
 if(/aluguel|energia|[aá]gua|condom[ií]nio|internet|luz/.test(value))return 'Casa';
 if(/netflix|spotify|streaming|assinatura/.test(value))return 'Assinaturas';
 if(/escola|faculdade|curso|livro/.test(value))return 'Educação';
 if(/cinema|teatro|viagem|hotel/.test(value))return 'Lazer';
 if(/loja|shopping|compra|cart[aã]o/.test(value))return 'Compras';
 return 'Outros';
}
function amountValue(raw:string){
 let value=raw.replace(/[^\d,.-]/g,'');
 if(value.includes(',')&&value.includes('.'))value=value.lastIndexOf(',')>value.lastIndexOf('.')?value.replaceAll('.','').replace(',','.'):value.replaceAll(',','');
 else if(value.includes(','))value=value.replace(',','.');
 return Number(value);
}
function tag(block:string,key:string){return (block.match(new RegExp(`<${key}>([^<\\r\\n]+)`,'i'))?.[1]||'').trim();}
function parseOfx(text:string):Imported[]{
 const blocks=text.split(/<STMTTRN>/i).slice(1);
 return blocks.map((block,index)=>{
  const amount=amountValue(tag(block,'TRNAMT'));
  const name=tag(block,'NAME')||tag(block,'MEMO')||'Movimentação bancária';
  const date=dateValue(tag(block,'DTPOSTED'));
  const memo=tag(block,'MEMO');
  const fitid=tag(block,'FITID');
  return {name,description:memo,date,total:Math.round(Math.abs(amount)*100),kind:amount>=0?'income' as const:'expense' as const,method:paymentMethod(`${name} ${memo}`),category:suggestCategory(`${name} ${memo}`),importKey:fitid?`ofx:${fitid}`:`ofx:${date}:${amount}:${name}:${index}`};
 }).filter(row=>validDate(row.date)&&Number.isFinite(row.total)&&row.total>0);
}
function csvRows(text:string,separator:string){
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let index=0;index<text.length;index++){
  const char=text[index];
  if(char==='"'){if(quoted&&text[index+1]==='"'){cell+='"';index++;}else quoted=!quoted;}
  else if(char===separator&&!quoted){row.push(cell.trim());cell='';}
  else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
  else cell+=char;
 }
 row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 return rows;
}
function parseCsv(text:string):Imported[]{
 const clean=text.replace(/^\uFEFF/,'');
 const headerLine=clean.split(/\r?\n/,1)[0]||'';
 const separator=(headerLine.match(/;/g)?.length||0)>(headerLine.match(/,/g)?.length||0)?';':',';
 const rows=csvRows(clean,separator);
 const headers=(rows.shift()||[]).map(value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 const column=(names:string[])=>headers.findIndex(header=>names.some(name=>header.includes(name)));
 const dateColumn=column(['data','date']),nameColumn=column(['descricao','historico','description','titulo','name']),amountColumn=column(['valor','amount']),typeColumn=column(['tipo','natureza']),idColumn=column(['identificador','transaction_id','fitid']);
 if(dateColumn<0||nameColumn<0||amountColumn<0)throw Error('Colunas obrigatórias ausentes');
 const occurrences=new Map<string,number>();
 return rows.map(row=>{
  const date=dateValue(row[dateColumn]||''),amount=amountValue(row[amountColumn]||''),name=row[nameColumn]||'Movimentação bancária';
  const type=row[typeColumn]||'';
  const kind=/d[eé]bito|sa[ií]da|expense/i.test(type)||amount<0?'expense' as const:'income' as const;
  const fingerprint=`${date}:${Math.round(Math.abs(amount)*100)}:${kind}:${name.toLowerCase()}`;
  const sequence=(occurrences.get(fingerprint)||0)+1;occurrences.set(fingerprint,sequence);
  const id=row[idColumn]||'';
  return {name,description:'Importado de extrato',date,total:Math.round(Math.abs(amount)*100),kind,method:paymentMethod(`${name} ${type}`),category:suggestCategory(name),importKey:id?`csv:${id}`:`csv:${fingerprint}:${sequence}`};
 }).filter(row=>validDate(row.date)&&Number.isFinite(row.total)&&row.total>0);
}
export function parseStatement(text:string,fileName:string):Imported[]{
 const name=fileName.toLowerCase();
 if(name.endsWith('.ofx'))return parseOfx(text);
 if(name.endsWith('.csv'))return parseCsv(text);
 throw Error('Formato não suportado');
}
