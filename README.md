# Registro financeiro — versão Vercel

Esta versão corrige a incompatibilidade do pacote anterior: o build agora usa Next.js e gera `.next/routes-manifest.json`. O armazenamento D1 e o login do Sites foram substituídos por Vercel Blob privado e senha pessoal.

## Atualizar o projeto que falhou

1. Extraia este ZIP e substitua os arquivos do projeto pelos desta pasta. O arquivo `package.json` deve estar na raiz selecionada na Vercel. Substitua também `package-lock.json` e inclua `vercel.json`.
2. Em **Settings → Build and Deployment**, configure:
   - Framework Preset: **Next.js**.
   - Build Command: **npm run build**.
   - Install Command: **npm ci**.
   - Output Directory: **.next** (ou deixe o padrão do Next.js, sem um override antigo como `dist`).
   - Root Directory: a pasta que contém este `package.json`.
3. Configure Node.js **22.x** ou **24.x**.
4. Faça um novo deploy sem reutilizar o cache antigo de build.

Não envie a pasta `.next` manualmente: a Vercel a gera ao compilar. Não renomeie a pasta `dist` para `.next`; o conteúdo também precisa ser compatível.

## Ativar login e salvamento

O build e a demonstração funcionam sem credenciais. Para salvar dados reais:

1. No painel da Vercel, abra **Storage**, crie um **Blob store com acesso Private** e conecte ao projeto. Use um armazenamento exclusivo para este aplicativo. Confirme que `BLOB_READ_WRITE_TOKEN` foi disponibilizado no ambiente Production.
2. Em **Settings → Environment Variables**, adicione:

| Variável | Valor |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Token fornecido pela conexão com o Blob privado |
| `APP_PASSWORD` | Sua senha pessoal, forte e exclusiva, com pelo menos 16 caracteres |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres |

Para gerar o segredo, execute localmente:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Não use prefixo `NEXT_PUBLIC_` nessas variáveis. Não inclua seus valores no repositório ou no ZIP. Após configurá-las, faça um novo deploy e entre em `/entrar` usando sua senha.

Este app tem **um único espaço financeiro pessoal** por instalação. Quem souber a senha terá acesso a esse espaço. A sessão expira após 12 horas; trocar a senha ou o segredo invalida as sessões anteriores. Os dados ficam em um Blob privado e são acessados somente pelas rotas autenticadas. O modo demonstração não salva.

O login inclui um limite local de tentativas por instância. Para limitar tentativas também entre instâncias, configure uma regra de rate limiting para `/api/auth/login` no Firewall da Vercel.

Se usar Preview, conecte outro armazenamento e outras credenciais para não misturar registros de testes com os seus dados de produção. A versão antiga com D1 não é migrada automaticamente.

## Rodar localmente

```sh
npm ci
npm run dev
```

Abra o endereço mostrado no terminal. Sem variáveis, a interface abre com dados fictícios. Para salvar, copie `.env.example` para `.env.local` e configure as três variáveis com um Blob privado de desenvolvimento.

## Verificar

```sh
npm test
npm run typecheck
npm run build
```

A correção foi validada por um build Next.js completo, com `.next/routes-manifest.json` gerado, e testes de sessão, parcelas, validação e armazenamento com SDK simulado. A conexão com um Blob real e o deploy na sua conta dependem da configuração acima e não foram executados neste ambiente.

As gravações usam ETags para impedir que uma aba sobrescreva alterações de outra. Os valores permanecem em centavos inteiros. O saldo previsto considera os registros cadastrados; não é uma leitura do saldo bancário. As funcionalidades de cartões, parcelamento de 1 a 80 vezes, renda, categorias, reserva e projeções foram preservadas.

## Referências oficiais

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/vercel-blob/using-blob-sdk
