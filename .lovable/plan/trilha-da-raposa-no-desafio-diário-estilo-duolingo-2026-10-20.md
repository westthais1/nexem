# Trilha da Raposa no Desafio Diário (estilo Duolingo)

## O que o aluno vai ver
- Uma nova caixa "Trilha do Desafio" na página inicial, logo abaixo do card do Desafio Diário, e também no resumo final do Desafio.
- Um caminho vertical em zigue-zague de caixas redondas (como no Duolingo), agrupadas em níveis: Bronze, Prata, Ouro, Diamante, Mestre ENEM (5 caixas por nível).
- A raposa (a mesma do Desafio Diário) fica em cima da caixa atual. Caixas já vencidas ficam coloridas com check; as próximas ficam cinzas com cadeado; o fim de cada nível tem um baú/troféu.
- Ao terminar o Desafio com boa nota, a raposa pula da caixa atual para as próximas, com animação de salto e brilho na caixa conquistada. Ao completar 5 caixas, aparece "Nível liberado!".

## Regra de pulos (por desafio concluído)
- 9 ou 10 acertos: pula 2 caixas
- 7 ou 8 acertos: pula 1 caixa
- 6 ou menos: fica na mesma caixa (mensagem "Tem que melhorar um pouquinho")
- Só conta uma vez por dia (o primeiro desafio concluído do dia).

## Onde o progresso fica salvo
- Na conta do aluno, para ser o mesmo no celular e no computador; aluno novo começa na primeira caixa.

## Detalhes técnicos
- Tabela `daily_path_progress` (user_id, position, last_awarded_day) com RLS só do dono; atualização por função atômica no banco que aplica a regra acima e ignora repetições no mesmo dia.
- Regra de pulos em módulo puro compartilhado (`src/lib/daily-path.ts`) com testes (10→+2, 8→+1, 6→0, mesmo dia não conta).
- Componente `DailyFoxPath` com a imagem da raposa existente, animação de salto via CSS (keyframes em styles.css, tokens de cor do tema).
- Chamada ao finalizar o Desafio em `desafio.tsx`, junto do salvamento já existente.
