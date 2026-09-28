# Registro financeiro — Next.js, Prisma e Neon

## Recursos atuais

- Interface responsiva com navegação inferior no celular/tablet e lateral no PC; faturas em carrossel no celular e grids de duas ou três colunas nas telas maiores.
- Identidade roxa própria, contraste nos modos claro/escuro/automático, Inter local na interface e Fraunces no saldo principal.

- Visão mensal, comparação com o mês anterior e projeção do saldo.
- Cartões de vários bancos com cores próprias, limite, fechamento e vencimento.
- Pix, Pix Crédito, débito, crédito, dinheiro, boleto e transferência.
- Parcelamento de 1 a 80 vezes e despesas recorrentes.
- Identificação de compras feitas por outra pessoa no cartão do titular.
- Categorias, orçamentos mensais e alertas de limite.
- Calendário financeiro, assinaturas, metas e reserva de emergência.
- Simulador de compra parcelada, relatórios anuais, CSV e backup JSON.
- Importação de extratos OFX/CSV com reconhecimento de Pix e compras, sugestão e revisão de categorias, e prevenção de duplicatas.
- Dívidas e empréstimos com previsão de quitação e comparação estimada de antecipação, categorias próprias e etiquetas nos lançamentos.
- Comprovantes PDF ou imagem de até 5 MB em armazenamento privado, vinculados aos lançamentos.
- Aplicativo instalável (PWA), modo claro, escuro ou automático, alertas de faturas, contas, assinaturas, orçamentos, metas e saldo negativo.
- Cópia offline criptografada com senha configurada no dispositivo. Lançamentos feitos sem conexão são conciliados com alterações do servidor quando a sessão e a conexão retornam.
- Tela inicial guiada, lançamento rápido no celular, lançamentos agrupados pela cor do cartão e fechamento mensal.
- Login por senha e Google, dados privados por usuário e exclusão de conta.

## Correção do salvamento no Vercel Blob

O erro HTTP 409 era um conflito falso causado pela condição de ETag usada na atualização do arquivo. Como cada usuário possui um caminho privado próprio, o app agora grava o mesmo pathname com substituição atômica. A separação por conta permanece e nenhum SQL adicional é necessário.

## Uso offline e notificações

Abra o aplicativo conectado e escolha **Modo offline** no cabeçalho. Crie uma senha local de pelo menos 8 caracteres. A cópia do dispositivo é criptografada; sem essa senha ela não pode ser aberta. Quando a conexão voltar, o app confirma a sessão e concilia as alterações locais com as alterações independentes feitas no servidor. Se o mesmo registro for alterado nos dois lugares, prevalece a versão local.

Os alertas são calculados ao abrir o aplicativo. As notificações do navegador dependem da permissão do dispositivo e do aplicativo aberto; não há servidor de envio programado quando ele estiver fechado.

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
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth Web criado no Google Auth Platform |
| `GOOGLE_CLIENT_SECRET` | Chave secreta do cliente OAuth, somente no servidor |

`APP_PASSWORD` não é mais utilizada. Não use prefixo `NEXT_PUBLIC_` nas credenciais. Configure as variáveis nos ambientes desejados e faça um novo deploy. O cadastro de usuários utiliza o Neon; o armazenamento financeiro existente continua no Blob privado.

## Login com Google

Execute `prisma/google-login.sql` uma vez no SQL Editor do Neon. No cliente OAuth Web, configure a origem `https://registro-financeiro-gamma.vercel.app` e o redirecionamento `https://registro-financeiro-gamma.vercel.app/api/auth/google/callback`. Adicione `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` na Vercel e faça um novo deploy. Uma conta existente é vinculada somente quando o Google confirma o mesmo endereço de e-mail; contas novas do Google não precisam de senha local.

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

Os testes automatizados cobrem cadastro/login, hash Bcrypt, cookie, validação, duplicidade, corrida de cadastro, assinatura e expiração da sessão, cuid string, isolamento dos registros financeiros, sobrescrita no Blob, cálculos de parcelas e faturas, relatórios, contas manuais, importação OFX/CSV, sincronização offline, remoção de categorias e lembretes. Confirme o resultado atual com `npm test` e `npm run build` antes do deploy.

Os dados financeiros do antigo arquivo único não são atribuídos automaticamente a uma conta: o código conserva esse arquivo sem expô-lo a usuários recém-cadastrados. Uma migração desses dados deve identificar explicitamente a conta proprietária.
