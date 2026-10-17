# Ajustes na landing: menu lateral, vídeo no celular e faixa animada

## 1. Menu lateral (gaveta)
- Ao tocar nas três linhas, o menu abre como uma gaveta deslizando pela lateral direita, por cima da página (a tela principal não encolhe nem é empurrada).
- Largura: um pouco menos da metade da tela (~45%), com mínimo confortável no celular (~280px) para os textos caberem.
- Fundo escurecido atrás; tocar fora, no X ou em um link fecha a gaveta.
- Itens: Como funciona, Entenda a TRI, Guia do ENEM, Perguntas frequentes e botão Entrar.
- As três linhas passam a aparecer também no computador (além dos links do topo), para o menu lateral estar sempre disponível.

## 2. Vídeo do topo tocando no celular
- Manter como vídeo (GIF perderia muita qualidade e ficaria pesado), mas forçar o início automático em loop no celular: sem som, inline, e uma tentativa de dar play assim que a página carrega.
- Se o celular bloquear mesmo assim (ex.: modo economia de bateria), o vídeo começa no primeiro toque em qualquer lugar da tela e continua repetindo.
- A imagem de capa continua aparecendo enquanto o vídeo não toca.

## 3. Faixa animada depois do topo
- A faixa com "Redação Inteligente, Estatísticas TRI, Simulado Completo..." passa a ter a mesma cor do fundo da página, sem as linhas em cima e embaixo. O movimento continua igual.

## Detalhes técnicos
- `src/routes/landing.tsx`: substituir o `<nav id="landing-mobile-menu">` por `Sheet` (shadcn, `side="right"`, `className="w-[45vw] min-w-[280px] sm:max-w-none"`), botão de menu sem `lg:hidden`.
- Vídeo: `ref` + `useEffect` com `video.muted = true; video.play().catch(...)`; no catch, registrar listener `pointerdown`/`touchstart` único em `document` que chama `play()`. Adicionar `preload="auto"` e atributo `webkit-playsinline`.
- Faixa: trocar `border-y border-border bg-card` por `bg-background`.
