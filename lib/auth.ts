import {cookies} from 'next/headers';
import {sessionSecret,SESSION_COOKIE,verifySession,accountVersion} from './session-token';
import {prisma} from './db';
export {isSameOrigin} from './request-origin';
export async function getSessionUser(){
  const secret=sessionSecret();if(!secret)return null;
  const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return null;
  const session=verifySession(token,secret);if(!session)return null;
  const user=await prisma.user.findUnique({where:{id:session.userId},select:{id:true,email:true,password:true,googleId:true}});
  if(!user||accountVersion(user,secret)!==session.passwordVersion)return null;
  return {id:user.id,email:user.email};
}
export async function isAuthenticated(){return (await getSessionUser())!==null;}
