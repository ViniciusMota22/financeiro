import {getSessionUser,isSameOrigin} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {deleteFinanceData} from '@/lib/finance-store';
import {SESSION_COOKIE} from '@/lib/session-token';

export async function DELETE(request:Request){
 if(!isSameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
 const user=await getSessionUser();if(!user)return Response.json({error:'Entre novamente.'},{status:401});
 try{const body=await request.json();if(body?.confirmation!=='EXCLUIR')return Response.json({error:'Confirmação inválida.'},{status:400});await deleteFinanceData(user.id);await prisma.user.delete({where:{id:user.id}});return Response.json({success:true},{headers:{'Set-Cookie':`${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`}});}catch(error){console.error('Account deletion failed',error instanceof Error?error.name:'UnknownError');return Response.json({error:'Não foi possível excluir a conta.'},{status:503});}
}
