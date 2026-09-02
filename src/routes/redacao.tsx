import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { corrigirRedacao, type EssayCorrection } from "@/lib/essay.functions";


export const Route = createFileRoute("/redacao")({
  head: () => ({
    meta: [
      { title: "Redação Inteligente — ENEM AI Tutor" },
      {
        name: "description",
        content:
          "Escreva sua redação do ENEM e receba correção competência por competência com o Professor Claude.",
      },
      { property: "og:title", content: "Redação Inteligente — ENEM AI Tutor" },
      {
        property: "og:description",
        content: "Correção inteligente de redação para o ENEM com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedacaoPage,
});

const THEME_OF_THE_WEEK =
  "Os caminhos para combater a intolerância religiosa no Brasil";
const MAX_LINES = 30;
const MIN_LINES_TO_SEND = 8;

const ESSAY_INSTRUCTIONS: { title: string; body: string }[] = [
  {
    title: "Estrutura",
    body:
      "Texto dissertativo-argumentativo em prosa, com 30 linhas no máximo e 8 no mínimo.",
  },
  {
    title: "Competências",
    body:
      "São avaliadas 5 competências: domínio da norma culta, compreensão da proposta, argumentação, coesão e proposta de intervenção.",
  },
  {
    title: "Proposta de intervenção",
    body:
      "Apresente uma solução completa: agente, ação, meio, fim e detalhamento.",
  },
  {
    title: "Repertório",
    body:
      "Inclua repertório sociocultural (exemplos, dados, citações) que dialogue com o tema.",
  },
];

const COMPETENCIAS: { key: "c1" | "c2" | "c3" | "c4" | "c5"; label: string }[] = [
  { key: "c1", label: "C1 · Norma culta" },
  { key: "c2", label: "C2 · Compreensão do tema" },
  { key: "c3", label: "C3 · Defesa de ponto de vista" },
  { key: "c4", label: "C4 · Mecanismos coesivos" },
  { key: "c5", label: "C5 · Proposta de intervenção" },
];

function RedacaoPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EssayCorrection | null>(null);
  const corrigir = useServerFn(corrigirRedacao);

  // Conta linhas com base em quebras reais (\n) — simula as linhas da folha do ENEM.
  const lineCount = useMemo(() => {
    const raw = text.split("\n");
    let count = 0;
    for (const line of raw) {
      if (!line) count += 1;
      else count += Math.max(1, Math.ceil(line.length / 90));
    }
    return Math.min(MAX_LINES, count);
  }, [text]);

  const canSend =
    status !== "sending" && lineCount >= MIN_LINES_TO_SEND && text.trim().length >= 200;

  async function handleSubmit() {
    if (!canSend) return;
    setStatus("sending");
    setError(null);
    setFeedback(null);
    try {
      const result = await corrigir({
        data: { tema: THEME_OF_THE_WEEK, texto: text.trim() },
      });
      setFeedback(result);
      setStatus("done");
    } catch (err) {
      console.error("[Redação] Erro na correção:", err);
      setError(
        err instanceof Error ? err.message : "Não foi possível corrigir sua redação agora.",
      );
      setStatus("idle");
    }
  }


  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-accent">
            Redação Inteligente
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            Escreva. Corrija. Evolua.
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Escreva sua redação seguindo o tema da semana e envie para o Professor
            Claude corrigir competência por competência.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Coluna esquerda — tema + instruções */}
          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card card-glow">
              <div className="bg-aurora absolute inset-0 opacity-60" />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
              <div className="relative p-6 md:p-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-accent backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Tema da Semana
                </span>
                <h2 className="mt-4 text-2xl font-semibold leading-snug text-foreground">
                  {THEME_OF_THE_WEEK}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Redija um texto dissertativo-argumentativo sobre o tema acima,
                  com base na situação-problema e nos textos motivadores.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <h3 className="text-sm font-semibold text-foreground">
                Instruções da redação ENEM
              </h3>
              <ul className="mt-4 space-y-4">
                {ESSAY_INSTRUCTIONS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      ›
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Coluna direita — textarea + envio + feedback */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <div className="flex items-center justify-between">
                <label htmlFor="essay" className="text-sm font-medium text-foreground">
                  Sua redação
                </label>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    lineCount >= MAX_LINES
                      ? "text-destructive"
                      : lineCount >= MIN_LINES_TO_SEND
                        ? "text-accent"
                        : "text-muted-foreground"
                  }`}
                >
                  {lineCount} / {MAX_LINES} linhas
                </span>
              </div>

              <textarea
                id="essay"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva sua redação aqui, uma ideia por linha, simulando as 30 linhas da folha do ENEM…"
                className="mt-3 h-80 w-full resize-none rounded-lg border border-input bg-background/40 p-4 font-sans text-[15px] leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Trilha de linhas simulada */}
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: MAX_LINES }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 min-w-[6px] rounded-full transition-colors ${
                      i < lineCount
                        ? lineCount >= MAX_LINES
                          ? "bg-destructive/70"
                          : "bg-gradient-to-r from-accent to-primary"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {lineCount < MIN_LINES_TO_SEND
                  ? `Mínimo de ${MIN_LINES_TO_SEND} linhas para enviar. Faltam ${MIN_LINES_TO_SEND - lineCount}.`
                  : lineCount >= MAX_LINES
                    ? "Você atingiu o limite de 30 linhas."
                    : `${MAX_LINES - lineCount} linhas restantes.`}
              </p>

              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  O Professor Claude analisa as 5 competências do ENEM.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 hover:shadow-[0_0_24px_-6px_var(--electric)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Sparkles className="h-4 w-4" />
                  Enviar para Correção da IA
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Estado de envio / carregamento */}
            {status === "sending" && (
              <div className="rounded-2xl border border-accent/40 bg-card p-6 card-glow">
                <div className="flex items-center gap-3 text-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="text-sm font-medium">
                    O Professor Claude está analisando sua redação…
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-full animate-pulse rounded bg-border/60"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resultado da correção */}
            {status === "done" && feedback && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-6 card-glow">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold text-foreground text-glow-electric">
                      {feedback.nota_total}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">
                      / 1000
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nota atribuída pelo Professor Claude
                  </p>
                  {feedback.comentario && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      {feedback.comentario}
                    </p>
                  )}
                  <div className="mt-5 space-y-3">
                    {COMPETENCIAS.map((row) => (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium text-foreground">
                            {feedback[row.key]}/200
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                            style={{ width: `${(feedback[row.key] / 200) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 card-glow">
                  <h3 className="text-sm font-semibold text-foreground">
                    Dicas do Professor Claude
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {feedback.dicas.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="text-accent">›</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </main>
  );
}
