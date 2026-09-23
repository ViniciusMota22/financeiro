import {get,put,del,list} from '@vercel/blob';
import {emptyState} from './finance.ts';
import type {State} from './finance.ts';
import {financeSchema} from './finance-schema.ts';
import {isUserId} from './session-token.ts';
export function financePath(userId:string){if(!isUserId(userId))throw new Error('Invalid user ID');return 'registro-financeiro/users/'+userId+'/finances.json';}
export async function deleteFinanceData(userId:string){const token=process.env.BLOB_READ_WRITE_TOKEN;if(!token)throw new Error('BLOB_READ_WRITE_TOKEN não configurado');let cursor:string|undefined;do{const page=await list({token,prefix:`registro-financeiro/users/${userId}/receipts/`,cursor});if(page.blobs.length)await del(page.blobs.map(blob=>blob.pathname),{token});cursor=page.hasMore?page.cursor:undefined;}while(cursor);await del(financePath(userId),{token});}
// Injected SDK methods let tests cover storage failures without real credentials.
export function createFinanceStore(userId:string,storage:Pick<typeof import('@vercel/blob'),'get'|'put'>={get,put}){
  if(!isUserId(userId))throw new Error('Invalid user ID');
  const pathname=financePath(userId);
  function options(){const token=process.env.BLOB_READ_WRITE_TOKEN;if(!token)throw new Error('BLOB_READ_WRITE_TOKEN não configurado');return {token,access:'private' as const};}
  return {
    async read(){
      const result=await storage.get(pathname,{...options(),useCache:false});
      if(!result)return {data:emptyState,revision:null};
      if(result.statusCode!==200||!result.stream)throw new Error('Resposta de armazenamento inesperada');
      const data=await new Response(result.stream).json();
      const parsed=financeSchema.safeParse({data,revision:result.blob.etag});
      if(!parsed.success)throw new Error('Dados armazenados inválidos; restaure uma cópia válida');
      return parsed.data;
    },
    async write(data:State,_revision:string|null){
      // Cada usuário possui um arquivo exclusivo. O Blob retornou ETags que não
      // eram aceitos em gravações condicionais, causando conflitos falsos mesmo
      // logo após uma leitura. A atualização atômica do mesmo pathname evita isso.
      const result=await storage.put(pathname,JSON.stringify(data),{...options(),contentType:'application/json',addRandomSuffix:false,allowOverwrite:true,cacheControlMaxAge:60});
      return result.etag;
    }
  };
}

