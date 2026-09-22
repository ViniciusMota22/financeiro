import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const SESSION_COOKIE='registro_session';
export const SESSION_SECONDS=60*60*12;
export function authConfig(){
  const password=process.env.APP_PASSWORD??'';
  const secret=process.env.SESSION_SECRET??'';
  if(password.length<16||secret.length<32)return null;
  return {password,secret};
}
function signature(value:string,secret:string){return createHmac('sha256',secret).update(value).digest('base64url');}
export function passwordMatches(input:string,password:string,secret:string){
  return timingSafeEqual(Buffer.from(signature(input,secret)),Buffer.from(signature(password,secret)));
}
export function issueSession(password:string,secret:string,now=Date.now()){
  const body=Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+SESSION_SECONDS,version:signature(password,secret),nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return `${body}.${signature(body,secret)}`;
}
export function verifySession(token:string,password:string,secret:string,now=Date.now()){
  try{
    if(token.length>2048)return false;
    const parts=token.split('.');if(parts.length!==2)return false;
    const [body,sig]=parts;const expected=signature(body,secret);
    if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;
    const value=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    return Number.isInteger(value.exp)&&value.exp>Math.floor(now/1000)&&value.exp<=Math.floor(now/1000)+SESSION_SECONDS&&value.version===signature(password,secret);
  }catch{return false;}
}

export function createSessionToken(password?: string, secret?: string) {
  const config = authConfig();
  if (!config) throw new Error("Auth config missing");
  return issueSession(password || config.password, secret || config.secret);
}
