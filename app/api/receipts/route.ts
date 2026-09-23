import {get,put,del} from '@vercel/blob';
import {getSessionUser,isSameOrigin} from '@/lib/auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const maxSize=5*1024*1024;
const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const path=(userId:string,id:string)=>`registro-financeiro/users/${userId}/receipts/${id}`;

export async function POST(request:Request){
 if(!isSameOrigin(request))return response({error:'Origem inválida.'},403);
 const user=await getSessionUser();
 if(!user)return response({error:'Entre para anexar comprovantes.'},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return response({error:'Armazenamento indisponível.'},503);
 try{
  const form=await request.formData();
  const file=form.get('file');
  if(!(file instanceof File)||!allowed.has(file.type)||file.size<1||file.size>maxSize)return response({error:'Envie PDF, JPG, PNG ou WebP com até 5 MB.'},400);
  const id=crypto.randomUUID();
  await put(path(user.id,id),file,{token:process.env.BLOB_READ_WRITE_TOKEN,access:'private',addRandomSuffix:false,contentType:file.type});
  return response({id,name:file.name.slice(0,120)});
 }catch(error){console.error('receipt upload:',error instanceof Error?error.name:'UnknownError');return response({error:'Não foi possível anexar o comprovante.'},503);}
}

export async function GET(request:Request){
 const user=await getSessionUser();
 if(!user)return response({error:'Entre para ver o comprovante.'},401);
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!/^[0-9a-f-]{36}$/i.test(id))return response({error:'Comprovante inválido.'},400);
 try{
  const result=await get(path(user.id,id),{token:process.env.BLOB_READ_WRITE_TOKEN,access:'private',useCache:false});
  if(!result||result.statusCode!==200||!result.stream)return response({error:'Comprovante não encontrado.'},404);
  return new Response(result.stream,{headers:{'Content-Type':result.blob.contentType||'application/octet-stream','Content-Disposition':'inline','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){console.error('receipt read:',error instanceof Error?error.name:'UnknownError');return response({error:'Não foi possível abrir o comprovante.'},503);}
}

export async function DELETE(request:Request){
 if(!isSameOrigin(request))return response({error:'Origem inválida.'},403);
 const user=await getSessionUser();
 if(!user)return response({error:'Entre para excluir comprovantes.'},401);
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!/^[0-9a-f-]{36}$/i.test(id))return response({error:'Comprovante inválido.'},400);
 try{await del(path(user.id,id),{token:process.env.BLOB_READ_WRITE_TOKEN});return response({ok:true});}
 catch{return response({error:'Não foi possível excluir o comprovante.'},503);}
}
