# Registro financeiro — Next.js, Prisma e Neon

## Correção de cadastro e login

- O frontend e as duas rotas usam `{ email, password }`.
- Cadastro: `app/api/auth/register/route.ts` (o arquivo anterior `rout.ts` não era reconhecido como rota).
- O schema Prisma corresponde à tabela existente no Neon: `id String @default(cuid())`, `email @unique` e `password String`. Não há conversão do ID para número.
- O cadastro normaliza o e-mail, valida os campos e salva somente `bcrypt.hash(password, 12)`.
- O login utiliza `bcrypt.compare`. Senhas legadas em texto plano são rejeitadas; não existe fallback para comparação em texto plano.
- As respostas nunca incluem a senha ou seu hash.
- Cadastro e login gravam o cookie de sessão `registro_session`, HttpOnly, SameSite=Strict e Secure em produção, com validade de 12 horas.
- O token assinado contém o cuid do usuário. O servidor verifica assinatura, validade, existência do usuário e versão do hash da senha. Trocar senha ou SESSION_SECRET invalida sessões anteriores.
- Logout expira o cookie. Tokens antigos do modelo de senha única não são aceitos.
- O arquivo financeiro privado é separado por cuid. A autenticação de múltiplos usuários não abre acesso ao antigo arquivo global.

## Variáveis na Vercel

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL fornecida pelo Neon, com SSL; use a conexão com pool recomendada pelo Neon para a aplicação |
| `SESSION_SECRET` | Segredo aleatório de pelo menos 32 caracteres, somente no servidor |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob privado, para os registros financeiros já usados pelo aplicativo |
| `RESEND_API_KEY` | Chave da API Resend usada somente no servidor para enviar o link de redefinição |
| `PASSWORD_RESET_FROM_EMAIL` | Remetente verificado, por exemplo `Registro Financeiro <contato@seudominio.com>` |

`APP_PASSWORD` não é mais utilizada. Não use prefixo `NEXT_PUBLIC_` nas credenciais. Configure as variáveis nos ambientes desejados e faça um novo deploy. O cadastro de usuários utiliza o Neon; o armazenamento financeiro existente continua no Blob privado.

## Redefinição de senha

Execute `prisma/password-reset.sql` uma vez no SQL Editor do Neon. Depois configure `RESEND_API_KEY` e `PASSWORD_RESET_FROM_EMAIL` na Vercel. O link enviado expira em 30 minutos, guarda apenas o hash do token no banco e deixa de funcionar depois do primeiro uso. A resposta da solicitação é igual para e-mails cadastrados e desconhecidos.

Para gerar um novo segredo localmente:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O schema local foi alinhado à estrutura consultada no Neon; nenhuma alteração de tabela foi necessária. Não execute reset do banco. A chave única de e-mail protege cadastros concorrentes; conflitos são retornados como HTTP 409.

## Deploy na Vercel

- Framework: Next.js.
- Build: `npm run build`.
- Install: `npm ci` (o postinstall executa `prisma generate`).
- Output: padrão `.next`.
- Root Directory: pasta que contém `package.json`.
- Node.js: 22.x ou 24.x.

Envie os arquivos atualizados, inclusive `prisma/schema.prisma`, `package.json`, `package-lock.json` e as novas rotas. Não envie `.env`, `.env.local`, `node_modules` ou `.next`.

## Desenvolvimento e testes

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Use `.env.example` como modelo para sua configuração local. Os testes comuns usam um repositório de usuários simulado com Bcrypt real e não acessam o Neon.

O teste de integração explícito acessa o Neon configurado, cria uma conta fictícia em uma transação e reverte a transação, verificando que a conta não persistiu:

```sh
node --env-file=.env --env-file=.env.local tests/auth-neon.integration.mjs
```

## Validação desta correção

Oito testes passaram, cobrindo cadastro/login, hash Bcrypt, cookie, validação, duplicidade, corrida de cadastro, assinatura e expiração da sessão, cuid string, isolamento dos registros financeiros e cálculos de parcelas. O teste real com Neon também passou, sem deixar conta de teste salva. O build Next.js foi concluído com as três rotas de autenticação.

Os dados financeiros do antigo arquivo único não são atribuídos automaticamente a uma conta: o código conserva esse arquivo sem expô-lo a usuários recém-cadastrados. Uma migração desses dados deve identificar explicitamente a conta proprietária.
