# Histórico de Questões no Simulado

## O que vamos construir

Adicionar uma seção de histórico no final da página **Simulado**, listando todas as questões da tabela externa `enem_tutor`, cada uma com um botão **"Responder Esta"** que carrega a questão específica na área principal (sem depender do sorteio aleatório).

## Mudanças

### 1. Nova consulta — listar todas as questões
- Nova função `fetchAllQuestions()` em `src/routes/simulado.tsx` que busca `id, enunciado, area_conhecimento` de `enem_tutor` via `questionsSupabase` (cliente externo já existente), ordenada por área.
- Sem fallback/mock: erro ou tabela vazia exibem mensagem clara, seguindo o padrão atual da página.

### 2. Seção de histórico no final da página
- Cartão "Histórico de Questões" abaixo do conteúdo principal, listando cada questão com:
  - badge da área (`area_conhecimento`),
  - trecho do enunciado (truncado em ~2 linhas),
  - botão **"Responder Esta"**.
- Destaque visual sutil na questão atualmente carregada.

### 3. Carregar questão específica
- Ao clicar em "Responder Esta": a página passa a exibir aquela questão (buscando a linha completa pelo `id`, incluindo `resposta_correta` e `explicacao`), limpa seleção/confirmação/chat, ajusta a aba de área correspondente e rola a tela para o topo da questão.
- Implementação: `refetch()` passa a aceitar um `id` opcional; quando presente, `fetchRandomQuestion` busca por `.eq("id", id)` em vez de sortear.

## Detalhes técnicos
- Apenas `src/routes/simulado.tsx` é alterado; nenhuma mudança de banco ou de estilos globais (reuso dos tokens existentes).
- Consulta de histórico via `useQuery` com chave `["question-history"]`, invalidada/atualizada junto com as demais.
- Continua valendo: nenhum dado falso local — tudo vem do Supabase externo.
- Validação final com Playwright: lista renderiza com as questões reais e "Responder Esta" carrega a questão correta.
