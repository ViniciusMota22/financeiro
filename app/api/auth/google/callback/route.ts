import {prisma} from '@/lib/db';
import {GOOGLE_STATE_COOKIE,googleConfig,googleStateCookie,safeEqual} from '@/lib/google-oauth';
import {issueSession,sessionCookie,sessionSecret} from '@/lib/session-token';

function cookieValue(request:Request,name:string){return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1)||'';}
const fail=(origin:string)=>new Response(null,{status:302,headers:{Location:`${origin}/entrar?google=erro`,'Set-Cookie':googleStateCookie('',0),'Cache-Control':'no-store'}});
export async function GET(request:Request){
  const url=new URL(request.url),origin=url.origin,config=googleConfig(),secret=sessionSecret();
  const code=url.searchParams.get('code')||'',state=url.searchParams.get('state')||'',saved=cookieValue(request,GOOGLE_STATE_COOKIE);
  if(!config||!secret||!code||!state||!saved||!safeEqual(state,saved))return fail(origin);
  try{
    const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:`${origin}/api/auth/google/callback`,grant_type:'authorization_code'}),cache:'no-store'});
    if(!tokenResponse.ok)return fail(origin);
    const tokens=await tokenResponse.json() as {access_token?:string};if(!tokens.access_token)return fail(origin);
    const profileResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`},cache:'no-store'});
    if(!profileResponse.ok)return fail(origin);
    const profile=await profileResponse.json() as {sub?:string;email?:string;email_verified?:boolean};
    if(!profile.sub||!profile.email||profile.email_verified!==true)return fail(origin);
    const email=profile.email.trim().toLowerCase();
    let user=await prisma.user.findUnique({where:{googleId:profile.sub},select:{id:true,email:true,password:true,googleId:true}});
    if(!user){
      const emailUser=await prisma.user.findUnique({where:{email},select:{id:true,email:true,password:true,googleId:true}});
      if(emailUser?.googleId)return fail(origin);
      if(emailUser)user=await prisma.user.update({where:{id:emailUser.id},data:{googleId:profile.sub},select:{id:true,email:true,password:true,googleId:true}});
    }
    if(!user)user=await prisma.user.create({data:{email,googleId:profile.sub,password:null},select:{id:true,email:true,password:true,googleId:true}});
    const headers=new Headers({Location:`${origin}/`,'Cache-Control':'no-store'});
    headers.append('Set-Cookie',sessionCookie(issueSession(user,secret)));
    headers.append('Set-Cookie',googleStateCookie('',0));
    return new Response(null,{status:302,headers});
  }catch(error){console.error('Google authentication failed',error instanceof Error?error.name:'UnknownError');return fail(origin);}
}
