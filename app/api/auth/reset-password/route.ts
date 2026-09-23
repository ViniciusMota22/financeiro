import {isSameOrigin} from '@/lib/request-origin';
import {resetPassword} from '@/lib/password-reset';
import {AuthError} from '@/lib/auth-service';

export async function POST(request:Request){
  if(!isSameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  try{
    const body=await request.json();
    await resetPassword(body?.token,body?.password);
    return Response.json({message:'Senha redefinida com sucesso.'});
  }catch(error){
    if(error instanceof AuthError)return Response.json({error:error.message},{status:error.status});
    console.error('Password reset failed',error instanceof Error?error.name:'UnknownError');
    return Response.json({error:'Não foi possível redefinir a senha.'},{status:503});
  }
}
