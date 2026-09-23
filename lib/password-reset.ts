import {createHash,randomBytes} from 'node:crypto';
import bcrypt from 'bcrypt';
import {prisma} from './db';
import {AuthError} from './auth-service';

const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');

export async function requestPasswordReset(emailInput:unknown,origin:string){
  if(typeof emailInput!=='string')return;
  const email=emailInput.trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return;
  const user=await prisma.user.findUnique({where:{email},select:{id:true,email:true}});
  if(!user)return;

  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.PASSWORD_RESET_FROM_EMAIL;
  if(!apiKey||!from)throw new AuthError('O envio de e-mail ainda não foi configurado.',503);

  const token=randomBytes(32).toString('base64url');
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({where:{userId:user.id}}),
    prisma.passwordResetToken.create({data:{userId:user.id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+30*60*1000)}})
  ]);
  const url=`${origin}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({from,to:[user.email],subject:'Redefina sua senha — Registro Financeiro',html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Redefina sua senha</h2><p>Recebemos uma solicitação para alterar sua senha.</p><p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Redefinir minha senha</a></p><p>Este link expira em 30 minutos. Se você não fez a solicitação, ignore este e-mail.</p></div>`})
  });
  if(!response.ok){
    await prisma.passwordResetToken.deleteMany({where:{userId:user.id}});
    throw new AuthError('Não foi possível enviar o e-mail agora.',503);
  }
}

export async function resetPassword(tokenInput:unknown,passwordInput:unknown){
  if(typeof tokenInput!=='string'||tokenInput.length<20)throw new AuthError('Link inválido ou expirado.',400);
  if(typeof passwordInput!=='string'||passwordInput.length<8||Buffer.byteLength(passwordInput,'utf8')>72)throw new AuthError('Use uma senha com pelo menos 8 caracteres.',400);
  const record=await prisma.passwordResetToken.findUnique({where:{tokenHash:hashToken(tokenInput)}});
  if(!record||record.expiresAt<=new Date()){
    if(record)await prisma.passwordResetToken.delete({where:{id:record.id}});
    throw new AuthError('Link inválido ou expirado. Solicite um novo.',400);
  }
  const password=await bcrypt.hash(passwordInput,12);
  await prisma.$transaction([
    prisma.user.update({where:{id:record.userId},data:{password}}),
    prisma.passwordResetToken.deleteMany({where:{userId:record.userId}})
  ]);
}
