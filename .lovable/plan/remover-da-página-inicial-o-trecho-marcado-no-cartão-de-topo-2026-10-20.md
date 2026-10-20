Remover da página inicial ("/") o trecho marcado no cartão de topo:

- Frase "Estudo Adaptativo. Nota Máxima."
- Texto "Um treino inteligente que evolui com você."
- Botões "Iniciar simulado" e "Corrigir redação"

O selo "Tutor de IA · Online agora" e o logo "nexem" continuam no cartão, e o espaço sobrando embaixo será ajustado para o cartão ficar mais compacto. Nada mais na página muda.

Detalhes técnicos: editar só `src/routes/index.tsx` (linhas ~58–82) e tirar imports que não forem mais usados.
