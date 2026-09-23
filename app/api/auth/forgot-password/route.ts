import {isSameOrigin} from '@/lib/request-origin';
import {requestPasswordReset} from '@/lib/password-reset';
import {AuthError} from '@/lib/auth-service';

export async function POST(request:Request){
  if(!isSameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  try{
    const body=await request.json();
    await requestPasswordReset(body?.email,new URL(request.url).origin);
    return Response.json({message:'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.'});
  }catch(error){
    if(error instanceof AuthError)return Response.json({error:error.message},{status:error.status});
    console.error('Password reset request failed',error instanceof Error?error.name:'UnknownError');
    return Response.json({error:'Não foi possível processar a solicitação.'},{status:503});
  }
}
