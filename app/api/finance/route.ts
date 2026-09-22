import {getSessionUser,isSameOrigin} from '@/lib/auth';
import {createFinanceStore,RevisionConflict} from '@/lib/finance-store';
import {financeSchema} from '@/lib/finance-schema';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
  try{
    const user=await getSessionUser();
    if(!user)return response({error:'Entre para acessar seus registros.'},401);
    if(!process.env.BLOB_READ_WRITE_TOKEN)return response({error:'O armazenamento ainda não foi conectado. Configure o Vercel Blob privado antes de salvar registros.'},503);
    return response(await createFinanceStore(user.id).read());
  }catch(e){console.error('finance load:',e instanceof Error?e.name:'UnknownError');return response({error:'Não foi possível carregar seus registros. Tente novamente.'},503);}
}
export async function PUT(request:Request){
  if(!isSameOrigin(request))return response({error:'Origem inválida.'},403);
  try{
    const user=await getSessionUser();
    if(!user)return response({error:'Entre para salvar seus registros.'},401);
    let body:unknown;
    try{const raw=await request.text();if(raw.length>4000000)return response({error:'Limite de registros excedido.'},413);body=JSON.parse(raw);}
    catch{return response({error:'Formato de dados inválido.'},400);}
    const parsed=financeSchema.safeParse(body);
    if(!parsed.success)return response({error:'Confira os valores e as datas informados.'},400);
    return response({revision:await createFinanceStore(user.id).write(parsed.data.data,parsed.data.revision)});
  }catch(e){if(e instanceof RevisionConflict)return response({error:e.message},409);console.error('finance save:',e instanceof Error?e.name:'UnknownError');return response({error:'Não foi possível salvar. Seus campos foram preservados; tente novamente.'},503);}
}
