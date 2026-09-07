# Corrigir o carregamento das questões no Simulado

## O que está acontecendo

A tela do Simulado pede ao banco de questões várias informações que **não existem mais** lá: matéria, dificuldade e explicação. Como o banco não reconhece esses campos, ele recusa o pedido inteiro e nenhuma questão aparece — nem no sorteio, nem no histórico.

Hoje o banco de questões tem apenas: enunciado, alternativas A–E, resposta correta e área do conhecimento. E existe **apenas 1 questão cadastrada** (Caatinga, Ciências da Natureza).

## O que será feito

1. Pedir ao banco somente os campos que existem hoje, para as questões voltarem a carregar.
2. Tratar matéria, dificuldade e explicação como opcionais: se não existirem, a tela simplesmente não mostra a etiqueta de matéria nem o texto de explicação (mantendo o aviso de "explicação ainda não cadastrada").
3. Manter o registro de tentativas funcionando, enviando matéria/dificuldade em branco quando não houver.
4. Manter os filtros pelas 4 áreas do conhecimento; a área continua existindo no banco.
5. Conferir na prática que a questão aparece, que dá para responder e confirmar, e que o histórico lista a questão.

## Observação importante

Com só 1 questão cadastrada, filtrar por Ciências Humanas, Linguagens ou Matemática vai mostrar "nenhuma questão encontrada" — isso é o banco estar vazio nessas áreas, não um erro. Se quiser, posso inserir mais questões depois.

## Detalhes técnicos

- `src/routes/simulado.tsx`: reduzir `SELECT_COLUMNS` para `id,enunciado,opcao_a..opcao_e,resposta_correta,area_conhecimento`; ajustar `fetchAllQuestions` para `id,enunciado,area_conhecimento`; tornar `dificuldade`, `materia` e `explicacao` opcionais nos tipos `QuestionRow`/`HistoryRow` e nos pontos de uso (`registrarTentativa`, badge do histórico, cartão de explicação).
- Nenhuma mudança de schema nos bancos.
