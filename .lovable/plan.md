# Página "Nexem Pro" na landing

## O que o aluno vai ver
Uma nova página pública **/nexem-pro**, aberta pelo menu da landing (desktop e celular) com o item "Nexem Pro", no mesmo visual das páginas TRI, Guia e FAQ.

Conteúdo:
1. **Topo** — título "Nexem Pro: seu próximo nível no ENEM", frase curta e botão "Começar grátis".
2. **Vantagens** — cartões explicando o que o Pro desbloqueia:
   - Níveis de Maestria completos (15 trilhas, 3 níveis cada)
   - Prova Completa nos dois dias, com cartão-resposta e correção TRI
   - Tutor Nex ilimitado (pistas socráticas sem limite)
   - Desafio Diário continua grátis para todos
3. **Comparação Grátis x Pro** — tabela lado a lado:
   | Recurso | Grátis | Pro |
   |---|---|---|
   | Desafio Diário (10 questões) | Sim | Sim |
   | Tutor Nex | 3 consultas a cada 24h | Ilimitado |
   | Níveis de Maestria | Não | Sim |
   | Prova Completa (2 dias, 180 questões) | Não | Sim |
   | Redação, Raio-X e Estatísticas | Sim | Sim |
   No celular, a tabela vira cartões empilhados.
4. **Preços** — Mensal R$ 29,90/mês e Anual R$ 14,90/mês (R$ 178,80 de uma vez, economia de 50%), com selo "Mais Popular" no anual.
5. **Perguntas rápidas** — cancelar quando quiser, o que continua grátis, etc.
6. **Chamada final** — "Comece grátis hoje" abrindo o cadastro da landing.

Como os pagamentos ainda não estão ativos, os botões levam ao cadastro/entrada, sem cobrança.

## Detalhes técnicos
- Nova rota `src/routes/nexem-pro.tsx` dentro de `PublicPageShell`, com `head()` próprio (título, descrição, og, twitter:card).
- Preços lidos de `PRO_PLANS` em `src/lib/subscription.ts` para não divergir do modal.
- Adicionar `{ to: "/nexem-pro", label: "Nexem Pro" }` à lista de links compartilhada em `landing.tsx`.
- Liberar `/nexem-pro` no guard de sessão do `__root.tsx`, como as outras páginas públicas.
- Cores via tokens existentes (estilos `pro-*` já definidos).
- Atualizar a regra de navegação da landing no AGENTS/conhecimento do projeto.
