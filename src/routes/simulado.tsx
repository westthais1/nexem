import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { TutorChat } from "@/components/TutorChat";
import { getRandomQuestion, type Question } from "@/lib/questions.functions";

export const Route = createFileRoute("/simulado")({
  head: () => ({
    meta: [
      { title: "Simulado — ENEM AI Tutor" },
      {
        name: "description",
        content:
          "Pratique questões do ENEM por área e peça dicas a um tutor de IA socrático que orienta sem entregar a resposta.",
      },
      { property: "og:title", content: "Simulado — ENEM AI Tutor" },
      {
        property: "og:description",
        content: "Questões do ENEM por área com tutor de IA socrático que dá dicas, não respostas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimuladoPage,
});

const AREAS = ["Exatas", "Humanas", "Natureza", "Linguagens"] as const;
type Area = (typeof AREAS)[number];
type AreaFilter = Area | "Todas";

const LETTERS = ["A", "B", "C", "D", "E"];

function SimuladoPage() {
  const [area, setArea] = useState<AreaFilter>("Todas");
  const [choice, setChoice] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchQuestion = useServerFn(getRandomQuestion);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["random-question", area],
    queryFn: () => fetchQuestion({ data: { area } }),
  });

  const current = data ?? null;

  function pickArea(next: AreaFilter) {
    setArea(next);
    setChoice(null);
    setChatOpen(false);
  }

  function drawAnother() {
    setChoice(null);
    setChatOpen(false);
    refetch();
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Simulado adaptativo</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Pratique questão por questão</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Filtre por área, leia com calma e, se travar, chame o tutor de IA — ele orienta com pistas, sem entregar a
            resposta.
          </p>
        </header>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          {(["Todas", ...AREAS] as const).map((a) => (
            <button
              key={a}
              onClick={() => pickArea(a)}
              aria-pressed={area === a}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                area === a
                  ? "border-primary/50 bg-primary/15 text-foreground border-glow-neon"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            {isFetching ? (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-9">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                  Sorteando uma questão…
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-border/60" />
                  <div className="h-4 w-full animate-pulse rounded bg-border/60" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-border/60" />
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-9">
                <p className="text-sm text-destructive">
                  Não foi possível carregar a questão. {(error as Error).message}
                </p>
                <button
                  onClick={drawAnother}
                  className="mt-4 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/20"
                >
                  Tentar novamente
                </button>
              </div>
            ) : current ? (
              <article className="rounded-2xl border border-border bg-card p-6 card-glow md:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                    {current.area}
                  </span>
                  <span className="text-xs text-muted-foreground">{current.topic}</span>
                </div>

                <div className="mt-6 space-y-5">
                  {current.statement.split("\n\n").map((p, i) => (
                    <p key={i} className="text-[17px] leading-8 tracking-[0.01em] text-foreground/90">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  {current.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setChoice(i)}
                      className={`flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        choice === i
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-background/30 hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                          choice === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="text-[15px] leading-7 text-foreground/90">{opt}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  <button
                    onClick={drawAnother}
                    className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-primary/20"
                  >
                    Sortear outra questão
                  </button>
                  {!chatOpen && (
                    <TutorChat
                      key={`${current.id}-btn`}
                      open={false}
                      onOpenChange={setChatOpen}
                      question={current.statement}
                      options={current.options}
                      area={current.area}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    O tutor dá pistas progressivas — a resposta final fica por sua conta.
                  </p>
                </div>
              </article>
            ) : (
              <p className="text-muted-foreground">Nenhuma questão encontrada nesta área.</p>
            )}
          </div>

          {chatOpen && current && (
            <div className="lg:sticky lg:top-8">
              <TutorChat
                key={current.id}
                open
                onOpenChange={setChatOpen}
                question={current.statement}
                options={current.options}
                area={current.area}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
