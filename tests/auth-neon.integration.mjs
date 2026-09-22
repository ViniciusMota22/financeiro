// Run explicitly: node --env-file=.env --env-file=.env.local tests/auth-neon.integration.mjs
// All inserts are inside a transaction deliberately rolled back at the end.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';
import {makeAuthHandler} from '../lib/auth-http.ts';
import {verifySession} from '../lib/session-token.ts';
const db=new PrismaClient();const rollback=new Error('Intentional test rollback');const email=`codex-auth-test-${randomUUID()}@example.invalid`;const password='Synthetic-test-password-123';const secret='synthetic-neon-test-session-secret-not-for-production';
process.env.SESSION_SECRET=secret;
const request=input=>new Request('http://localhost/api/auth/login',{method:'POST',headers:{Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify(input)});
try{
 try{
  await db.$transaction(async tx=>{
   const repository={findByEmail:email=>tx.user.findUnique({where:{email}}),create:(email,password)=>tx.user.create({data:{email,password}})};
   const register=makeAuthHandler('register',repository);const login=makeAuthHandler('login',repository);
   const registered=await register(request({email,password}));assert.equal(registered.status,201);const body=await registered.json();assert.equal(typeof body.user.id,'string');assert.match(body.user.id,/^c[a-z0-9]{24}$/);
   const stored=await tx.user.findUnique({where:{id:body.user.id}});assert.notEqual(stored.password,password);assert.equal(await bcrypt.compare(password,stored.password),true);
   const signedIn=await login(request({email,password}));assert.equal(signedIn.status,200);const cookie=signedIn.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);const session=verifySession(cookie.split(';')[0].split('=')[1],secret);assert.equal(session.userId,stored.id);
   assert.equal((await login(request({email,password:'wrong-password'}))).status,401);
   assert.equal((await register(request({email,password}))).status,409);
   throw rollback;
  },{timeout:30000,maxWait:10000});
 }catch(e){if(e!==rollback)throw e;}
 assert.equal(await db.user.count({where:{email}}),0);
 console.log('PASS Neon: cadastro, hash Bcrypt, login, cookie com cuid string, senha incorreta e duplicidade; transação revertida, nenhuma conta de teste persistida.');
}finally{await db.$disconnect();}
