import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { TutorChat } from "@/components/TutorChat";
import { supabase } from "@/integrations/supabase/client";

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
const TABLE = "enem_tutor";
const REQUEST_TIMEOUT_MS = 12_000;

type QuestionRow = {
  id: string;
  area: string;
  topic: string;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
};

async function fetchRandomQuestion(area: AreaFilter): Promise<QuestionRow | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let query = supabase.from(TABLE).select("*").abortSignal(controller.signal);
    if (area !== "Todas") query = query.eq("area", area);

    const { data, error, count, status, statusText } = await query;

    console.info(`[Simulado] Consulta direta à tabela ${TABLE}`, {
      area,
      status,
      statusText,
      linhasRetornadas: data?.length ?? count ?? 0,
    });

    if (error) {
      const details = `code: ${error.code ?? "n/a"}, details: ${error.details ?? "n/a"}, hint: ${error.hint ?? "n/a"}`;
      console.error(`[Simulado] Falha ao consultar ${TABLE}`, error);
      throw new Error(`Erro ao ler a tabela "${TABLE}": ${error.message} (${details})`);
    }

    if (!data || data.length === 0) return null;

    const selected = data[Math.floor(Math.random() * data.length)];
    if (!selected) return null;

    const requiredFields = ["id", "area", "topic", "enunciado", "opcao_a", "opcao_b", "opcao_c", "opcao_d", "opcao_e"] as const;
    const missingFields = requiredFields.filter((field) => typeof selected[field] !== "string" || selected[field].trim() === "");
    if (missingFields.length > 0) {
      const message = `A linha retornada por "${TABLE}" possui campos ausentes ou vazios: ${missingFields.join(", ")}.`;
      console.error(`[Simulado] Dados inválidos recebidos do banco`, { id: selected.id, missingFields });
      throw new Error(message);
    }

    return selected;
  } catch (cause) {
    if (controller.signal.aborted) {
      const message = `A consulta à tabela "${TABLE}" excedeu ${REQUEST_TIMEOUT_MS / 1000} segundos.`;
      console.error(`[Simulado] ${message}`);
      throw new Error(message);
    }
    throw cause;
  } finally {
    window.clearTimeout(timeout);
  }
}

function SimuladoPage() {
  const [area, setArea] = useState<AreaFilter>("Todas");
  const [choice, setChoice] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["random-question", area],
    queryFn: () => fetchRandomQuestion(area),
    retry: false,
  });

  const current = data ?? null;
  const options = current
    ? [current.opcao_a, current.opcao_b, current.opcao_c, current.opcao_d, current.opcao_e]
    : [];

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
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  Buscando questão na tabela {TABLE}…
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-border/60" />
                  <div className="h-4 w-full animate-pulse rounded bg-border/60" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-border/60" />
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/40 bg-card p-6 md:p-9">
                <p className="text-sm font-medium text-destructive">Não foi possível carregar a questão.</p>
                <p className="mt-2 break-words text-sm text-destructive/80">{(error as Error).message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Detalhes completos no console do navegador (procure por "[Simulado]").
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
                  {current.enunciado.split("\n\n").map((p, i) => (
                    <p key={i} className="text-[17px] leading-8 tracking-[0.01em] text-foreground/90">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  {options.map((opt, i) => (
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
                      question={current.enunciado}
                      options={options}
                      area={current.area}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    O tutor dá pistas progressivas — a resposta final fica por sua conta.
                  </p>
                </div>
              </article>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-9">
                <p className="text-foreground">
                  Nenhuma questão encontrada na tabela <span className="font-mono text-primary">{TABLE}</span>
                  {area !== "Todas" ? (
                    <>
                      {" "}para a área <span className="font-medium">{area}</span>
                    </>
                  ) : (
                    ""
                  )}
                  .
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A consulta foi executada com sucesso, mas a tabela retornou 0 linhas. Insira questões na tabela e
                  tente novamente.
                </p>
                <button
                  onClick={drawAnother}
                  className="mt-4 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/20"
                >
                  Recarregar
                </button>
              </div>
            )}
          </div>

          {chatOpen && current && (
            <div className="lg:sticky lg:top-8">
              <TutorChat
                key={current.id}
                open
                onOpenChange={setChatOpen}
                question={current.enunciado}
                options={options}
                area={current.area}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
