import {createAuthService,AuthError} from './auth-service.ts';
import type {UserRepository} from './auth-service.ts';
import {sessionSecret,sessionCookie} from './session-token.ts';
import {isSameOrigin} from './request-origin.ts';
const respond=(body:unknown,status:number,cookie?:string)=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
export function makeAuthHandler(mode:'login'|'register',repository:UserRepository){
 const service=createAuthService(repository);
 return async function POST(request:Request){
   if(!isSameOrigin(request))return respond({error:'Origem inválida.'},403);
   const secret=sessionSecret();if(!secret)return respond({error:'O acesso ainda não foi configurado.'},503);
   let input:unknown;
   try{const raw=await request.text();if(raw.length>4096)return respond({error:'Dados inválidos.'},400);input=JSON.parse(raw);}catch{return respond({error:'Dados inválidos.'},400);}
   try{const result=await service.authenticate(mode,input,secret);return respond({success:true,user:result.user},mode==='register'?201:200,sessionCookie(result.token));}
   catch(error){
     if(error instanceof AuthError)return respond({error:error.message},error.status);
     // Do not log Prisma errors in full: they may include connection details or input.
     console.error('Authentication request failed',error instanceof Error?error.name:'UnknownError');
     return respond({error:'Não foi possível acessar o banco de dados. Tente novamente.'},503);
   }
 };
}
