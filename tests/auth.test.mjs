import {test} from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import {makeAuthHandler} from '../lib/auth-http.ts';
import {issueSession,verifySession,passwordVersion,SESSION_SECONDS} from '../lib/session-token.ts';
import {createFinanceStore} from '../lib/finance-store.ts';
const secret='synthetic-secret-used-in-unit-tests-only';
const firstId='caaaaaaaaaaaaaaaaaaaaaaaa';
const secondId='cbbbbbbbbbbbbbbbbbbbbbbbb';
function repository(){const rows=[];return {rows,async findByEmail(email){return rows.find(u=>u.email===email)??null;},async create(email,password){const user={id:rows.length?secondId:firstId,email,password};rows.push(user);return user;}};}
function request(input,origin='http://localhost'){return new Request('http://localhost/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:typeof input==='string'?input:JSON.stringify(input)});}
test('register hashes password, normalizes email and sets a user-specific cookie; login accepts that hash',async()=>{
 process.env.SESSION_SECRET=secret;const repo=repository();const register=makeAuthHandler('register',repo);const login=makeAuthHandler('login',repo);
 const password='Senha-de-teste-123';let result=await register(request({email:' TEST@example.invalid ',password}));assert.equal(result.status,201);
 const body=await result.json();assert.deepEqual(body,{success:true,user:{id:firstId,email:'test@example.invalid'}});assert.equal(body.password,undefined);
 assert.notEqual(repo.rows[0].password,password);assert.equal(await bcrypt.compare(password,repo.rows[0].password),true);
 const cookie=result.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);const token=cookie.split(';')[0].split('=')[1];assert.equal(verifySession(token,secret).userId,firstId);
 result=await login(request({email:'TEST@example.invalid',password}));assert.equal(result.status,200);assert.ok(result.headers.get('set-cookie'));
 assert.equal((await login(request({email:'test@example.invalid',password:'incorrect'}))).status,401);
 assert.equal((await register(request({email:'test@example.invalid',password}))).status,409);
});
test('invalid requests, cross-origin calls, long UTF-8 passwords and legacy plain-text records fail safely',async()=>{
 process.env.SESSION_SECRET=secret;const repo=repository();const register=makeAuthHandler('register',repo);const login=makeAuthHandler('login',repo);
 for(const input of ['{invalid',{email:'invalid',password:'12345678'},{email:'a@example.invalid',password:'short'},{email:'a@example.invalid',password:'🔐'.repeat(19)},{email:'a@example.invalid',password:12345678}])assert.equal((await register(request(input))).status,400);
 assert.equal(repo.rows.length,0);
 assert.equal((await register(request({email:'a@example.invalid',password:'12345678'},'https://other.invalid'))).status,403);
 repo.rows.push({id:firstId,email:'legacy@example.invalid',password:'plaintext-password'});
 assert.equal((await login(request({email:'legacy@example.invalid',password:'plaintext-password'}))).status,401);
 delete process.env.SESSION_SECRET;
 assert.equal((await register(request({email:'a@example.invalid',password:'12345678'}))).status,503);
 assert.equal(repo.rows.length,1);
});
test('duplicate registration race returns 409 and never emits a session',async()=>{
 process.env.SESSION_SECRET=secret;
 const register=makeAuthHandler('register',{findByEmail:async()=>null,create:async()=>{throw {code:'P2002'};}});
 const result=await register(request({email:'a@example.invalid',password:'password-test-123'}));assert.equal(result.status,409);assert.equal(result.headers.get('set-cookie'),null);
});
test('session keeps string cuid, rejects forgery, expiration, old format and changed credentials',()=>{
 const now=Date.now();const user={id:firstId,password:'bcrypt-hash-placeholder'};const token=issueSession(user,secret,now);const session=verifySession(token,secret,now);
 assert.equal(session.userId,firstId);assert.equal(typeof session.userId,'string');
 assert.equal(verifySession(token+'x',secret,now),null);assert.equal(verifySession(token,secret,now+SESSION_SECONDS*1000),null);assert.equal(verifySession(token,secret+'rotated',now),null);
 assert.notEqual(session.passwordVersion,passwordVersion('new-hash',secret));assert.throws(()=>issueSession({id:123,password:'x'},secret));assert.equal(verifySession('old.session',secret),null);
});
test('each account uses its own private financial file',async()=>{
 process.env.BLOB_READ_WRITE_TOKEN='synthetic-token-only';const paths=[];const sdk={get:async(path)=>{paths.push(path);return null;},put:async()=>{throw Error('not used');}};
 await createFinanceStore(firstId,sdk).read();await createFinanceStore(secondId,sdk).read();assert.notEqual(paths[0],paths[1]);assert.ok(paths[0].includes(firstId));assert.ok(paths[1].includes(secondId));assert.throws(()=>createFinanceStore('../outside',sdk));delete process.env.BLOB_READ_WRITE_TOKEN;
});
