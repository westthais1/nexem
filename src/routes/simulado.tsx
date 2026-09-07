import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { TutorChat } from "@/components/TutorChat";
import { questionsSupabase } from "@/lib/external-supabase";
import { registrarTentativa } from "@/lib/attempts.functions";

type SimuladoSearch = { area?: string; dificuldade?: string };

export const Route = createFileRoute("/simulado")({
  validateSearch: (search: Record<string, unknown>): SimuladoSearch => ({
    ...(typeof search['area'] === "string" ? { area: search['area'] } : {}),
    ...(typeof search['dificuldade'] === "string" ? { dificuldade: search['dificuldade'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Simulado — ENEM AI Tutor" },
      {
        name: "description",
        content:
          "Pratique questões do ENEM e peça dicas a um tutor de IA socrático que orienta sem entregar a resposta.",
      },
      { property: "og:title", content: "Simulado — ENEM AI Tutor" },
      {
        property: "og:description",
        content: "Questões do ENEM com tutor de IA socrático que dá dicas, não respostas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimuladoPage,
});

const LETTERS = ["A", "B", "C", "D", "E"];
const TABLE = "enem_tutor";
const SELECT_COLUMNS =
  "id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,explicacao,dificuldade,materia";
const REQUEST_TIMEOUT_MS = 12_000;

const ALL_AREAS = "Ver Todas";
const ENEM_AREAS = [
  "Ciências da Natureza",
  "Ciências Humanas",
  "Linguagens",
  "Matemática",
] as const;

type QuestionRow = {
  id: number | string;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
  resposta_correta: string;
  explicacao: string | null;
  dificuldade: string | null;
  materia: string | null;
};

type HistoryRow = {
  id: number | string;
  enunciado: string;
  area_conhecimento: string | null;
  materia: string | null;
};

async function fetchAllQuestions(): Promise<HistoryRow[]> {
  const { data, error } = await questionsSupabase
    .from(TABLE)
    .select("id,enunciado,area_conhecimento,materia")
    .order("materia", { ascending: true });

  if (error) {
    console.error(`[Simulado] Falha ao listar histórico de ${TABLE}`, error);
    throw new Error(`Erro ao listar o histórico da tabela "${TABLE}": ${error.message}`);
  }
  return (data ?? []) as HistoryRow[];
}

async function fetchRandomQuestion(
  materia: string,
  forcedId: number | string | null,
  dificuldade: string | null,
  excludeIds: Array<number | string> = [],
): Promise<QuestionRow | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Busca apenas as colunas necessárias. Filtra pela área do conhecimento
    // usando a coluna `area_conhecimento` (ou traz tudo em "Ver Todas").
    let query = questionsSupabase.from(TABLE).select(SELECT_COLUMNS);
    if (forcedId !== null) {
      query = query.eq("id", forcedId);
    } else if (materia !== ALL_AREAS) {
      query = query.ilike("area_conhecimento", `${materia}%`);
    }
    const { data, error, status, statusText } = await query.abortSignal(controller.signal);

    console.info(`[Simulado] Consulta direta à tabela ${TABLE} (Supabase externo)`, {
      materia,
      dificuldade,
      status,
      statusText,
      linhasRetornadas: data?.length ?? 0,
    });

    if (error) {
      const details = `code: ${error.code ?? "n/a"}, details: ${error.details ?? "n/a"}, hint: ${error.hint ?? "n/a"}`;
      console.error(`[Simulado] Falha ao consultar ${TABLE}`, error);
      throw new Error(`Erro ao ler a tabela "${TABLE}": ${error.message} (${details})`);
    }

    if (!data || data.length === 0) return null;

    const rows = data as QuestionRow[];
    let pool = rows;
    if (forcedId === null) {
      // 1) roteamento adaptativo: prioriza a dificuldade alvo e questões inéditas
      const unseen = pool.filter((r) => !excludeIds.includes(r.id));
      const base = unseen.length > 0 ? unseen : pool;
      const byLevel = dificuldade
        ? base.filter((r) => (r.dificuldade ?? "").trim().toLowerCase() === dificuldade.toLowerCase())
        : [];
      pool = byLevel.length > 0 ? byLevel : base;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    if (!selected) return null;

    const requiredFields = ["enunciado", "opcao_a", "opcao_b", "opcao_c", "opcao_d", "opcao_e", "resposta_correta"] as const;
    const missingFields = requiredFields.filter(
      (field) => typeof selected[field] !== "string" || selected[field].trim() === "",
    );
    if (missingFields.length > 0) {
      const message = `A linha retornada por "${TABLE}" possui campos ausentes ou vazios: ${missingFields.join(", ")}.`;
      console.error(`[Simulado] Dados inválidos recebidos do banco`, { id: selected.id, missingFields });
      throw new Error(message);
    }
    const answer = (selected.resposta_correta as string).trim().toUpperCase();
    if (!LETTERS.includes(answer)) {
      const message = `A coluna "resposta_correta" da linha ${selected.id} contém um valor inválido: "${selected.resposta_correta}". Esperado: A, B, C, D ou E.`;
      console.error(`[Simulado] resposta_correta inválida`, { id: selected.id, valor: selected.resposta_correta });
      throw new Error(message);
    }

    return { ...selected, resposta_correta: answer };
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

// ————— Motor de estimativa TRI da sessão —————
const START_LEVEL = "Média";
const LEVEL_POINTS: Record<string, number> = { fácil: 100, facil: 100, média: 200, media: 200, difícil: 300, dificil: 300 };
const MAX_LEVEL_POINTS = 300;
const GUESSING_PENALTY = 0.4;

type SessionAttempt = { level: string; correct: boolean };

function levelPoints(level: string | null): number {
  return LEVEL_POINTS[(level ?? "Média").trim().toLowerCase()] ?? 200;
}

function computeTri(attempts: SessionAttempt[]) {
  if (attempts.length === 0) {
    return { score: 0, earned: 0, possible: 0, inconsistent: false, accuracy: 0 };
  }
  let earned = 0;
  let possible = 0;
  for (const a of attempts) {
    const pts = levelPoints(a.level);
    possible += pts;
    if (a.correct) earned += pts;
  }
  // Padrão inconsistente (indício de chute): acerta questões difíceis
  // enquanto erra questões fáceis.
  const hitHard = attempts.some((a) => a.correct && levelPoints(a.level) === MAX_LEVEL_POINTS);
  const missEasy = attempts.some((a) => !a.correct && levelPoints(a.level) === 100);
  const inconsistent = hitHard && missEasy;

  const raw = possible > 0 ? earned / possible : 0;
  const adjusted = inconsistent ? raw * (1 - GUESSING_PENALTY) : raw;
  return {
    score: Math.round(adjusted * 1000),
    earned,
    possible,
    inconsistent,
    accuracy: attempts.filter((a) => a.correct).length / attempts.length,
  };
}


function SimuladoPage() {
  const search = Route.useSearch();
  const missionDifficulty = search.dificuldade ?? null;
  const [choice, setChoice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [materia, setMateria] = useState<string>(search.area ?? ALL_AREAS);
  const [forcedId, setForcedId] = useState<number | string | null>(null);
  // Roteamento adaptativo: toda trilha começa em "Média".
  const [targetLevel, setTargetLevel] = useState<string>(missionDifficulty ?? START_LEVEL);
  const [seenIds, setSeenIds] = useState<Array<number | string>>([]);
  const [attempts, setAttempts] = useState<SessionAttempt[]>([]);
  const [round, setRound] = useState(0);

  const effectiveLevel = missionDifficulty ?? targetLevel;
  const tri = computeTri(attempts);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["random-question", "external", materia, forcedId, effectiveLevel, round],
    queryFn: () => fetchRandomQuestion(materia, forcedId, effectiveLevel, seenIds),
    retry: false,
    staleTime: 0,
  });

  const historyQuery = useQuery({
    queryKey: ["question-history", "external"],
    queryFn: fetchAllQuestions,
    retry: false,
    staleTime: 60_000,
  });
  const history = historyQuery.data ?? [];
  const subjects: string[] = [ALL_AREAS, ...ENEM_AREAS];

  const current = data ?? null;
  const options = current
    ? [current.opcao_a, current.opcao_b, current.opcao_c, current.opcao_d, current.opcao_e]
    : [];
  const correctIndex = current ? LETTERS.indexOf(current.resposta_correta) : -1;

  function confirmAnswer() {
    setConfirmed(true);
    if (!current || choice === null) return;
    const acertou = choice === correctIndex;
    const level = current.dificuldade ?? effectiveLevel;

    setAttempts((prev) => [...prev, { level, correct: acertou }]);
    setSeenIds((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
    // Acertou → sobe para Difícil; errou → desce para Fácil.
    if (!missionDifficulty) setTargetLevel(acertou ? "Difícil" : "Fácil");

    // Registro em segundo plano: nunca bloqueia nem quebra a tela.
    void registrarTentativa({
      data: {
        question_id: current.id,
        dificuldade_questao: current.dificuldade,
        materia_questao: current.materia,
        foi_correto: acertou,
      },
    }).catch((cause) => {
      console.error("[Simulado] Falha ao registrar tentativa", cause);
    });
  }

  function drawAnother() {
    setChoice(null);
    setConfirmed(false);
    setChatOpen(false);
    setForcedId(null);
    setRound((r) => r + 1);
  }

  function resetTrail() {
    setChoice(null);
    setConfirmed(false);
    setChatOpen(false);
    setForcedId(null);
    setAttempts([]);
    setSeenIds([]);
    setTargetLevel(missionDifficulty ?? START_LEVEL);
    setRound((r) => r + 1);
  }

  function selectMateria(next: string) {
    setChoice(null);
    setConfirmed(false);
    setChatOpen(false);
    setForcedId(null);
    setMateria(next);
    setRound((r) => r + 1);
  }


  function answerThis(row: HistoryRow) {
    setChoice(null);
    setConfirmed(false);
    setChatOpen(false);
    if (row.area_conhecimento) {
      setMateria(row.area_conhecimento);
    }
    setForcedId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Simulado adaptativo</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Pratique questão por questão</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Escolha uma área do conhecimento, sorteie uma questão e, se travar, chame o tutor de IA — ele
            orienta com pistas, sem entregar a resposta.
          </p>
        </header>

        {missionDifficulty ? (
          <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-foreground">
            <span className="font-semibold text-primary">Missão diária ativa</span>
            <span className="text-muted-foreground">
              {materia} · nível travado em {missionDifficulty}
            </span>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => selectMateria(s)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                materia === s
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {s}
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
                <div className="mt-6 space-y-5">
                  {current.enunciado.split("\n\n").map((p, i) => (
                    <p key={i} className="text-[17px] leading-8 tracking-[0.01em] text-foreground/90">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  {options.map((opt, i) => {
                    const isSelected = choice === i;
                    const isCorrectOption = i === correctIndex;
                    let optClass: string;
                    let badgeClass: string;
                    if (!confirmed) {
                      if (isSelected) {
                        optClass = "border-accent/60 bg-accent/15";
                        badgeClass = "bg-accent text-accent-foreground";
                      } else {
                        optClass = "border-border bg-background/30 hover:border-accent/40";
                        badgeClass = "bg-secondary text-muted-foreground";
                      }
                    } else if (isCorrectOption) {
                      optClass = "border-success/60 bg-success/15";
                      badgeClass = "bg-success text-success-foreground";
                    } else if (isSelected) {
                      optClass = "border-destructive/60 bg-destructive/15";
                      badgeClass = "bg-destructive text-destructive-foreground";
                    } else {
                      optClass = "border-border bg-background/30 opacity-60";
                      badgeClass = "bg-secondary text-muted-foreground";
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => !confirmed && setChoice(i)}
                        disabled={confirmed}
                        aria-pressed={isSelected}
                        className={`flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${optClass} ${
                          confirmed ? "cursor-default" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${badgeClass}`}
                        >
                          {LETTERS[i]}
                        </span>
                        <span className="text-[15px] leading-7 text-foreground/90">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  {!confirmed ? (
                    <>
                      <button
                        onClick={confirmAnswer}
                        disabled={choice === null}
                        className="rounded-lg border border-primary/50 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary/15"
                      >
                        Confirmar Resposta
                      </button>
                      {!chatOpen && (
                        <TutorChat
                          key={`${current.id}-btn`}
                          open={false}
                          onOpenChange={setChatOpen}
                          question={current.enunciado}
                          options={options}
                          area="Geral"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Selecione uma alternativa e confirme para ver o resultado.
                      </p>
                    </>
                  ) : (
                    <>
                      {choice === correctIndex ? (
                        <p className="rounded-lg border border-success/50 bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
                          ✓ Resposta correta! Mandou bem.
                        </p>
                      ) : (
                        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                          ✗ Quase! A alternativa correta é a {current.resposta_correta}.
                        </p>
                      )}
                      <button
                        onClick={drawAnother}
                        className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-primary/20"
                      >
                        Próxima Questão
                      </button>
                      {!chatOpen && (
                        <TutorChat
                          key={`${current.id}-btn`}
                          open={false}
                          onOpenChange={setChatOpen}
                          question={current.enunciado}
                          options={options}
                          area="Geral"
                        />
                      )}
                    </>
                  )}
                </div>

                {confirmed && current && (
                  <div
                    className={`mt-6 rounded-2xl border p-5 md:p-6 ${
                      choice === correctIndex
                        ? "border-primary/30 bg-primary/5"
                        : "border-warning/60 bg-warning/10"
                    }`}
                  >
                    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <span aria-hidden="true">💡</span> Explicação Detalhada do Gabarito
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-foreground/85">
                      A alternativa correta é a letra{" "}
                      <span className="font-semibold text-primary">{current.resposta_correta}</span>.
                    </p>
                    {current.explicacao ? (
                      <p className="mt-3 text-[15px] leading-7 text-foreground/85">{current.explicacao}</p>
                    ) : (
                      <p className="mt-3 text-sm italic text-muted-foreground">
                        A explicação detalhada desta questão ainda não foi cadastrada na tabela {TABLE}.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-9">
                <p className="text-foreground">
                  Nenhuma questão encontrada na tabela <span className="font-mono text-primary">{TABLE}</span>.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A consulta foi executada com sucesso, mas a tabela retornou 0 linhas. Insira questões na
                  tabela e tente novamente.
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
                area="Geral"
              />
            </div>
          )}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Histórico de Questões</h2>
            <span className="text-xs text-muted-foreground">
              {history.length} {history.length === 1 ? "questão" : "questões"} no banco
            </span>
          </div>

          {historyQuery.isFetching ? (
            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              Carregando histórico…
            </div>
          ) : historyQuery.error ? (
            <div className="mt-5">
              <p className="text-sm text-destructive">{(historyQuery.error as Error).message}</p>
              <button
                onClick={() => historyQuery.refetch()}
                className="mt-3 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/20"
              >
                Tentar novamente
              </button>
            </div>
          ) : history.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Nenhuma questão cadastrada na tabela {TABLE}.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {history.map((row) => {
                const isCurrent = current?.id === row.id;
                return (
                  <li
                    key={row.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-background/30 hover:border-primary/30"
                    }`}
                  >
                    <div className="min-w-0">
                      {row.materia && (
                        <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {row.materia}
                        </span>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-foreground/85">
                        {row.enunciado}
                      </p>
                    </div>
                    <button
                      onClick={() => answerThis(row)}
                      disabled={isCurrent}
                      className="shrink-0 rounded-lg border border-primary/50 bg-primary/15 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-primary/25 disabled:cursor-default disabled:opacity-50"
                    >
                      {isCurrent ? "Em exibição" : "Responder Esta"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
