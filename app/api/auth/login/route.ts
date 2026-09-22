import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { createSessionToken } from "@/lib/session-token";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    // Busca o usuário no Neon
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    // Compara a senha digitada com a criptografada no banco
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    // Faz o login (Cria a sessão)
    await createSessionToken(user.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro no login:", error);
    return Response.json({ error: "Erro ao fazer login." }, { status: 500 });
  }
}