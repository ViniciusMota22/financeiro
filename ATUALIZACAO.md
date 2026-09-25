# Atualização completa

Substitua o conteúdo do repositório pelos arquivos deste pacote. No GitHub, exclua manualmente estes arquivos antigos caso ainda apareçam:

- `lib/password-reset.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/redefinir-senha/page.tsx`
- `prisma/password-reset.sql`

Esses arquivos não fazem parte da versão atual. A permanência de `lib/password-reset.ts` causa erro de build porque o modelo de recuperação foi removido do Prisma.

## Correção do erro 409 ao salvar

Esta versão remove a condição de revisão do Vercel Blob que estava produzindo conflitos falsos. Cada conta continua usando um arquivo privado exclusivo, e o lançamento agora é gravado por substituição atômica no mesmo caminho. Não é necessário executar SQL no Neon para aplicar essa correção.

Depois de substituir os arquivos, faça um novo deploy na Vercel sem reutilizar o cache do build.

## Erro `Module not found: Can't resolve 'motion/react'`

Os componentes do dashboard usam a biblioteca Motion. Envie **também** `package.json` e `package-lock.json` atualizados para a raiz do repositório GitHub, no mesmo nível da pasta `app`. Ambos precisam conter `motion` nas dependências. Se o GitHub ainda mostrar uma versão antiga desses arquivos, o build da Vercel não instalará a biblioteca e falhará ao importar `motion/react`.

Confirme que a configuração **Root Directory** do projeto Vercel aponta para a pasta que contém esse `package.json`. Depois faça um novo deploy sem reutilizar o cache. Não é preciso criar nenhuma variável de ambiente para o Motion.

## Esta versão

- Lançamentos agrupados e marcados pela cor do cartão; botão de novo lançamento concentrado nessa aba.
- Tema claro, escuro e automático; percentual de reserva visível; valor total e parcela aproximada no formulário.
- Alerta vermelho quando as despesas previstas passam da renda e fechamento mensal na visão geral.
- Importação OFX/CSV com revisão, categorias sugeridas, identificadores de duplicidade e seleção do que salvar.
- Comprovantes privados, dívidas, lembretes, tela guiada, lançamento rápido e modo offline criptografado.
- Dashboard ampliado com evolução de entradas e saídas dos últimos seis meses, distribuição das despesas por categoria, gasto médio e percentual da renda comprometida. Os gráficos também são ocultados pelo controle de privacidade.
- Transições suaves com Motion em indicadores, painéis, ações e janelas, respeitando a preferência do dispositivo por movimento reduzido.
- Resumo com faturas de cada cartão e contas bancárias anotadas manualmente. O saldo manual permanece separado do saldo previsto e não é sincronizado com bancos.
- Relatórios detalhados com balanço do mês, despesas acumuladas por dia comparadas ao mês anterior, categorias com valores e percentuais e filtros de despesas recorrentes.
- Estilo visual opcional **Verde natural**, inspirado nas referências, disponível em Configurações > Preferências. O estilo original continua disponível, assim como os modos claro, escuro e automático.
- Novos painéis em Transações, Contas, Metas e Relatórios: resumo de entradas e saídas, patrimônio manual separado das faturas, progresso total das metas e comparação de receitas e despesas dos últimos seis meses.
- Nova página de Configurações para escolher o visual, consultar categorias, avisos, backup e modo offline. Os campos de foto, telefone, troca de senha e autenticação em duas etapas exibidos nas referências não foram simulados: exigiriam armazenamento e fluxos de segurança próprios.

Não há migração SQL adicional. O mesmo token do Vercel Blob privado é usado para os comprovantes. Teste o modo offline no dispositivo depois do redeploy, com a sessão ativa, e guarde a senha criada no próprio dispositivo.

Não envie `.env`, `.env.local`, `.next`, `node_modules` ou `tsconfig.tsbuildinfo`.
