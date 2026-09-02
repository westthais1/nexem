# Filtros por área no Simulado

## Implementação
- Adicionar quatro abas no topo: Ciências da Natureza, Ciências Humanas, Matemática e Linguagens.
- Manter a área selecionada no estado da página e destacar visualmente a aba ativa.
- Incluir a área selecionada na chave da consulta para recarregar automaticamente ao trocar de aba.
- Consultar exclusivamente a tabela externa `enem_tutor`, filtrando pela coluna de área antes do sorteio aleatório.
- Limpar alternativa selecionada e fechar o tutor ao mudar de matéria.
- Preservar os estados reais de carregamento, erro e ausência de questões, sem dados locais de fallback.

## Detalhe técnico
A tabela externa acessível pelo app atualmente expõe a coluna como `area_conhecimento` (não `area`), com valores exatamente iguais aos nomes das quatro abas. A consulta usará `.eq("area_conhecimento", materiaSelecionada)` para funcionar com o schema real atualizado.