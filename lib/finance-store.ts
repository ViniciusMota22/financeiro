import {get,put,del,BlobPreconditionFailedError} from '@vercel/blob';
import {emptyState} from './finance.ts';
import type {State} from './finance.ts';
import {financeSchema} from './finance-schema.ts';
import {isUserId} from './session-token.ts';
export class RevisionConflict extends Error {}
export function financePath(userId:string){if(!isUserId(userId))throw new Error('Invalid user ID');return 'registro-financeiro/users/'+userId+'/finances.json';}
export async function deleteFinanceData(userId:string){const token=process.env.BLOB_READ_WRITE_TOKEN;if(!token)throw new Error('BLOB_READ_WRITE_TOKEN não configurado');await del(financePath(userId),{token});}
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
    async write(data:State,revision:string|null){
      try{
        const result=await storage.put(pathname,JSON.stringify(data),{...options(),contentType:'application/json',addRandomSuffix:false,allowOverwrite:revision!==null,ifMatch:revision??undefined,cacheControlMaxAge:60});
        return result.etag;
      }catch(error){
        if(error instanceof BlobPreconditionFailedError||(error instanceof Error&&error.name==='BlobAlreadyExistsError'))throw new RevisionConflict('Os registros foram alterados em outra aba. Recarregue antes de salvar.');
        throw error;
      }
    }
  };
}

