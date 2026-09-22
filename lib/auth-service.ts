import bcrypt from 'bcrypt';
import {z} from 'zod';
import {issueSession} from './session-token.ts';
export type AuthUser={id:string;email:string;password:string};
export type UserRepository={findByEmail(email:string):Promise<AuthUser|null>;create(email:string,passwordHash:string):Promise<AuthUser>};
export class AuthError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status;}
}
const credentials=z.object({
  email:z.string().trim().toLowerCase().email().max(254),
  password:z.string().min(1).max(72).refine(value=>Buffer.byteLength(value,'utf8')<=72,'A senha pode ter até 72 bytes.')
});
export function createAuthService(users:UserRepository){return {
 async authenticate(mode:'login'|'register',input:unknown,secret:string){
  if(secret.length<32)throw new AuthError('O acesso ainda não foi configurado.',503);
  const parsed=credentials.safeParse(input);
  if(!parsed.success)throw new AuthError('Informe um e-mail válido e uma senha com até 72 bytes.',400);
  const {email,password}=parsed.data;
  let user:AuthUser|null;
  if(mode==='register'){
    if(password.length<8)throw new AuthError('Use uma senha com pelo menos 8 caracteres.',400);
    if(await users.findByEmail(email))throw new AuthError('Este e-mail já está cadastrado.',409);
    const hash=await bcrypt.hash(password,12);
    try{user=await users.create(email,hash);}
    catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='P2002')throw new AuthError('Este e-mail já está cadastrado.',409);throw error;}
  }else{
    user=await users.findByEmail(email);
    // A dummy hash makes unknown-user attempts perform the same bcrypt work.
    const hash=user&&/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password)?user.password:'$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    const valid=await bcrypt.compare(password,hash);
    if(!user||!valid||hash!==user.password)throw new AuthError('E-mail ou senha incorretos.',401);
  }
  return {user:{id:user.id,email:user.email},token:issueSession(user,secret)};
 }
};}
