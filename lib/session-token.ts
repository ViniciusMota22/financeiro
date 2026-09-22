import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const SESSION_COOKIE='registro_session';
export const SESSION_SECONDS=60*60*12;
export const isUserId=(value:unknown):value is string=>typeof value==='string'&&/^c[a-z0-9]{24}$/.test(value);
export function sessionSecret(){const secret=process.env.SESSION_SECRET;return secret&&secret.length>=32?secret:null;}
function sign(value:string,secret:string){return createHmac('sha256',secret).update(value).digest('base64url');}
export function passwordVersion(passwordHash:string,secret:string){return sign(`password:${passwordHash}`,secret);}
export function issueSession(user:{id:string;password:string},secret:string,now=Date.now()){
  if(!isUserId(user.id)||secret.length<32)throw new Error('Invalid session configuration');
  const body=Buffer.from(JSON.stringify({v:2,sub:user.id,exp:Math.floor(now/1000)+SESSION_SECONDS,pv:passwordVersion(user.password,secret),nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return `${body}.${sign(body,secret)}`;
}
export function verifySession(token:string,secret:string,now=Date.now()):{userId:string;passwordVersion:string}|null{
  try{
    if(secret.length<32||token.length>2048)return null;
    const parts=token.split('.');if(parts.length!==2)return null;
    const [body,sig]=parts;const expected=sign(body,secret);const actualBytes=Buffer.from(sig);const expectedBytes=Buffer.from(expected);
    if(actualBytes.length!==expectedBytes.length||!timingSafeEqual(actualBytes,expectedBytes))return null;
    const value=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(value.v!==2||!isUserId(value.sub)||!Number.isInteger(value.exp)||value.exp<=Math.floor(now/1000)||value.exp>Math.floor(now/1000)+SESSION_SECONDS||typeof value.pv!=='string')return null;
    return {userId:value.sub,passwordVersion:value.pv};
  }catch{return null;}
}
export function sessionCookie(token:string){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
