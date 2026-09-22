import {NextResponse} from 'next/server';
import {isSameOrigin} from '@/lib/auth';
import {SESSION_COOKIE} from '@/lib/session-token';
export async function POST(request:Request){
  if(!isSameOrigin(request))return NextResponse.json({error:'Origem inválida.'},{status:403});
  const response=NextResponse.json({ok:true});
  response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
  return response;
}
