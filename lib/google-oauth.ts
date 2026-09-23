import {randomBytes,timingSafeEqual} from 'node:crypto';

export const GOOGLE_STATE_COOKIE='google_oauth_state';
export function googleConfig(){
  const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  return clientId&&clientSecret?{clientId,clientSecret}:null;
}
export const newGoogleState=()=>randomBytes(32).toString('base64url');
export function safeEqual(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export function googleStateCookie(value:string,maxAge=600){return `${GOOGLE_STATE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
