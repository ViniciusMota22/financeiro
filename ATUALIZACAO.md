# Atualização completa

Substitua o conteúdo do repositório pelos arquivos deste pacote. No GitHub, exclua manualmente estes arquivos antigos caso ainda apareçam:

- `lib/password-reset.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/redefinir-senha/page.tsx`
- `prisma/password-reset.sql`

Esses arquivos não fazem parte da versão atual. A permanência de `lib/password-reset.ts` causa erro de build porque o modelo de recuperação foi removido do Prisma.

Não envie `.env`, `.env.local`, `.next`, `node_modules` ou `tsconfig.tsbuildinfo`.
