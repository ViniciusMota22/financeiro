import {googleConfig,googleStateCookie,newGoogleState} from '@/lib/google-oauth';

export async function GET(request:Request){
  const config=googleConfig();
  if(!config)return Response.json({error:'O login com Google ainda não foi configurado.'},{status:503});
  const origin=new URL(request.url).origin,state=newGoogleState();
  const params=new URLSearchParams({client_id:config.clientId,redirect_uri:`${origin}/api/auth/google/callback`,response_type:'code',scope:'openid email profile',state,prompt:'select_account'});
  return new Response(null,{status:302,headers:{Location:`https://accounts.google.com/o/oauth2/v2/auth?${params}`,'Set-Cookie':googleStateCookie(state),'Cache-Control':'no-store'}});
}
