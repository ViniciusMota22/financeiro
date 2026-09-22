import {cookies} from 'next/headers';
import {authConfig,SESSION_COOKIE,verifySession} from './session-token';
export async function isAuthenticated(){
  const config=authConfig();if(!config)return false;
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  return !!token&&verifySession(token,config.password,config.secret);
}
export function isSameOrigin(request:Request){
  if(request.headers.get('sec-fetch-site')==='cross-site')return false;
  const origin=request.headers.get('origin');
  return origin!==null&&origin===new URL(request.url).origin;
}
