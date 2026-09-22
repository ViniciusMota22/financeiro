import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { createSessionToken } from "@/lib/session-token";
// Presumindo que sua função de token no arquivo lib/session-token.ts se chame createSessionToken

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return Response.json({ error: "E-mail já cadastrado." }, { status: 400 });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva no banco de dados
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword 
      },
    });

    // Cria o token de login para já logar direto
    await createSessionToken(user.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro no registro:", error);
    return Response.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}