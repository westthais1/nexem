import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { questionsSupabase } from "@/lib/external-supabase";
import { registrarTentativa } from "@/lib/attempts.functions";

export const Route = createFileRoute("/full-simulado")({
  head: () => ({
    meta: [
      { title: "Simulado Adaptativo por Área — Nexem" },
      {
        name: "description",
        content:
          "Trilha adaptativa da Nexem: a dificuldade sobe ou desce a cada resposta, no estilo TRI, com placar final e detecção de padrão errático.",
      },
      { property: "og:title", content: "Simulado Adaptativo por Área — Nexem" },
      {
        property: "og:description",
        content: "Motor de progressão de habilidade em tempo real inspirado na TRI do ENEM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FullSimuladoPage,
});

/* ---------------------------------- dados --------------------------------- */

type AdaptiveQuestion = {
  id: number | string;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
  resposta_correta: string;
  area_conhecimento: string | null;
  materia: string | null;
  dificuldade: number | null;
  explicacao: string | null;
  imagem_url: string | null;
};

const COLUMNS =
  "id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,area_conhecimento,materia,dificuldade,explicacao,imagem_url";

async function fetchAdaptivePool(): Promise<AdaptiveQuestion[]> {
  const { data, error } = await questionsSupabase.from("enem_provas").select(COLUMNS);
  if (error) throw new Error(`Erro ao carregar as questões: ${error.message}`);
  return (data ?? []) as AdaptiveQuestion[];
}

/* --------------------------------- motor ---------------------------------- */

const START_DIFFICULTY = 50;
const BASE_WINDOW = 10;
const WINDOW_STEP = 5;
const HIGH_STEP = 12;
const LOW_STEP = 6;
const HISTORY_SIZE = 5;
const LETTERS = ["A", "B", "C", "D", "E"] as const;

type Outcome = { question: AdaptiveQuestion; letra: string; correto: boolean; dificuldade: number };

function diffOf(q: AdaptiveQuestion): number {
  const d = Number(q.dificuldade);
  return Number.isFinite(d) ? Math.min(100, Math.max(1, d)) : START_DIFFICULTY;
}

/** Passo de dificuldade conforme a consistência das últimas 5 respostas. */
export function nextTarget(target: number, correto: boolean, history: boolean[]): number {
  const recent = history.slice(-HISTORY_SIZE);
  const acertos = recent.filter(Boolean).length;
  const erros = recent.length - acertos;
  let step: number;
  if (correto) step = acertos >= 4 ? HIGH_STEP : LOW_STEP;
  else step = erros >= 4 ? -HIGH_STEP : -LOW_STEP;
  return Math.min(100, Math.max(1, target + step));
}

/** Sorteia a próxima questão dentro da janela alvo, alargando de 5 em 5 se preciso. */
function pickQuestion(
  pool: AdaptiveQuestion[],
  usedIds: Set<string>,
  target: number,
): AdaptiveQuestion | null {
  const remaining = pool.filter((q) => !usedIds.has(String(q.id)));
  if (remaining.length === 0) return null;
  for (let w = BASE_WINDOW; w <= 120; w += WINDOW_STEP) {
    const inRange = remaining.filter((q) => {
      const d = diffOf(q);
      return d >= target - w && d <= target + w;
    });
    if (inRange.length > 0) return inRange[Math.floor(Math.random() * inRange.length)]!;
  }
  return remaining[0]!;
}

/** Placar final: pesos pela dificuldade e penalização de 40% em padrão errático. */
function gradeSession(outcomes: Outcome[]) {
  const acertosAvancados = outcomes.filter((o) => o.correto && o.dificuldade > 75);
  const errosBasicos = outcomes.filter((o) => !o.correto && o.dificuldade < 40);
  const erratico = acertosAvancados.length > 0 && errosBasicos.length > 0;

  let pontos = 0;
  let pontosPossiveis = 0;
  for (const o of outcomes) {
    const peso = o.dificuldade;
    pontosPossiveis += peso;
    if (!o.correto) continue;
    pontos += erratico && o.dificuldade > 75 ? peso * 0.6 : peso;
  }

  const nota = pontosPossiveis > 0 ? Math.round((pontos / pontosPossiveis) * 1000) : 0;
  return {
    nota,
    pontos: Math.round(pontos),
    pontosPossiveis: Math.round(pontosPossiveis),
    erratico,
    acertosAvancados: acertosAvancados.length,
    errosBasicos: errosBasicos.length,
    acertos: outcomes.filter((o) => o.correto).length,
    total: outcomes.length,
  };
}

/* --------------------------------- página --------------------------------- */

function FullSimuladoPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["enem_provas", "adaptativo"],
    queryFn: fetchAdaptivePool,
  });

  const pool = useMemo(() => data ?? [], [data]);

  const areas = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of pool) {
      const a = q.area_conhecimento?.trim() || "Sem área";
      map.set(a, (map.get(a) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [pool]);

  const [area, setArea] = useState<string | null>(null);
  const [target, setTarget] = useState(START_DIFFICULTY);
  const [history, setHistory] = useState<boolean[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [current, setCurrent] = useState<AdaptiveQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [finished, setFinished] = useState(false);

  const areaPool = useMemo(
    () => (area ? pool.filter((q) => (q.area_conhecimento?.trim() || "Sem área") === area) : []),
    [pool, area],
  );

  const startBlock = useCallback(
    (novaArea: string) => {
      const blocoPool = pool.filter(
        (q) => (q.area_conhecimento?.trim() || "Sem área") === novaArea,
      );
      setArea(novaArea);
      setTarget(START_DIFFICULTY);
      setHistory([]);
      setOutcomes([]);
      setFinished(false);
      setSelected(null);
      setConfirmed(false);
      const first = pickQuestion(blocoPool, new Set(), START_DIFFICULTY);
      setCurrent(first);
      setUsedIds(new Set(first ? [String(first.id)] : []));
    },
    [pool],
  );

  const confirmar = useCallback(() => {
    if (!current || !selected || confirmed) return;
    const correto = selected === current.resposta_correta?.trim().toUpperCase();
    const dificuldade = diffOf(current);

    setConfirmed(true);
    setOutcomes((o) => [...o, { question: current, letra: selected, correto, dificuldade }]);
    setTarget((t) => nextTarget(t, correto, history));
    setHistory((h) => [...h, correto].slice(-HISTORY_SIZE));

    void registrarTentativa({
      data: {
        question_id: String(current.id),
        dificuldade_questao: String(dificuldade),
        materia_questao: current.materia ?? current.area_conhecimento ?? null,
        foi_correto: correto,
      },
    }).catch((e) => console.error("[Adaptativo] Falha ao registrar tentativa", e));
  }, [current, selected, confirmed, history]);

  const proxima = useCallback(() => {
    const next = pickQuestion(areaPool, usedIds, target);
    if (!next) {
      setFinished(true);
      return;
    }
    setUsedIds((s) => new Set(s).add(String(next.id)));
    setCurrent(next);
    setSelected(null);
    setConfirmed(false);
  }, [areaPool, usedIds, target]);

  const scorecard = useMemo(() => gradeSession(outcomes), [outcomes]);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando o banco de questões...
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {(error as Error).message}
        </div>
      </Shell>
    );
  }

  if (!area) {
    return (
      <Shell>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Escolha uma área para iniciar uma trilha adaptativa. Cada bloco começa em dificuldade 50 e
          sobe ou desce conforme a consistência das suas últimas 5 respostas — do mesmo jeito que a
          TRI enxerga o seu desempenho.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {areas.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nenhuma questão cadastrada ainda.
            </div>
          )}
          {areas.map(([nome, total]) => (
            <button
              key={nome}
              type="button"
              onClick={() => startBlock(nome)}
              className="rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-[0_0_28px_-10px_var(--neon)]"
            >
              <p className="text-base font-semibold text-foreground">{nome}</p>
              <p className="mt-1 text-sm text-muted-foreground">{total} questões disponíveis</p>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  const semQuestoes = !current;

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-2xl border border-border bg-card p-6 card-glow">
          {finished || semQuestoes ? (
            <Scorecard card={scorecard} outcomes={outcomes} onRestart={() => setArea(null)} />
          ) : (
            current && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Questão {outcomes.length + 1} · nível {diffOf(current)}/100
                  </span>
                  <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                    {current.area_conhecimento}
                    {current.materia ? ` · ${current.materia}` : ""}
                  </span>
                </div>

                <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground">
                  {current.enunciado}
                </p>

                {current.imagem_url && (
                  <div className="mt-5 flex justify-center">
                    <img
                      src={current.imagem_url}
                      alt="Imagem de apoio da questão"
                      loading="lazy"
                      className="max-h-[420px] w-auto max-w-full rounded-xl border border-border bg-background/40"
                    />
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {LETTERS.map((letter) => {
                    const isSelected = selected === letter;
                    const isCorrect = current.resposta_correta?.trim().toUpperCase() === letter;
                    let cls = "border-border bg-background/40 hover:border-primary/40";
                    if (confirmed) {
                      if (isCorrect) cls = "border-success/60 bg-success/10";
                      else if (isSelected) cls = "border-destructive/60 bg-destructive/10";
                    } else if (isSelected) {
                      cls = "border-accent bg-accent/10";
                    }
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={confirmed}
                        onClick={() => setSelected(letter)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm text-foreground transition-colors disabled:cursor-default ${cls}`}
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold">
                          {letter}
                        </span>
                        <span>{optionText(current, letter)}</span>
                      </button>
                    );
                  })}
                </div>

                {confirmed && (
                  <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      💡 Explicação Detalhada do Gabarito
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Resposta correta:{" "}
                      <strong className="text-foreground">{current.resposta_correta}</strong>.{" "}
                      {current.explicacao ?? "Esta questão ainda não tem explicação cadastrada."}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {!confirmed ? (
                    <button
                      type="button"
                      onClick={confirmar}
                      disabled={!selected}
                      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
                    >
                      Confirmar resposta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={proxima}
                      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                    >
                      Próxima questão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFinished(true)}
                    disabled={outcomes.length === 0}
                    className="rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10 disabled:opacity-40"
                  >
                    Encerrar e ver resultado
                  </button>
                </div>
              </>
            )
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 card-glow">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nível alvo
            </p>
            <p className="mt-1 text-4xl font-semibold text-foreground text-glow-neon">{target}</p>
            <div className="mt-3 h-2 w-full rounded-full bg-background/60">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${target}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Busca entre {Math.max(1, target - BASE_WINDOW)} e {Math.min(100, target + BASE_WINDOW)}{" "}
              — a janela alarga sozinha se acabarem as questões.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Últimas 5 respostas</p>
            <div className="mt-3 flex gap-2">
              {Array.from({ length: HISTORY_SIZE }).map((_, i) => {
                const v = history[i];
                return (
                  <span
                    key={i}
                    className={`h-8 flex-1 rounded-md border text-center text-xs leading-8 ${
                      v === undefined
                        ? "border-border bg-background/40 text-muted-foreground"
                        : v
                          ? "border-success/60 bg-success/15 text-foreground"
                          : "border-destructive/50 bg-destructive/10 text-foreground"
                    }`}
                  >
                    {v === undefined ? "–" : v ? "✓" : "✕"}
                  </span>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {history.filter(Boolean).length >= 4
                ? "Alta consistência: cada acerto sobe +12."
                : history.length - history.filter(Boolean).length >= 4
                  ? "Base frágil: cada erro desce −12."
                  : "Ritmo misto: passos de ±6 pontos."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Progresso do bloco</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {outcomes.filter((o) => o.correto).length} acertos em {outcomes.length} respondidas ·{" "}
              {areaPool.length - usedIds.size} restantes
            </p>
            <button
              type="button"
              onClick={() => setArea(null)}
              className="mt-4 w-full rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
            >
              Trocar de área
            </button>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Scorecard({
  card,
  outcomes,
  onRestart,
}: {
  card: ReturnType<typeof gradeSession>;
  outcomes: Outcome[];
  onRestart: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Resultado da trilha</h2>
      <div className="mt-4 flex flex-wrap gap-8">
        <div>
          <p className="text-sm text-muted-foreground">Nota estimada</p>
          <p className="text-4xl font-semibold text-foreground text-glow-neon">{card.nota}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Acertos</p>
          <p className="text-4xl font-semibold text-foreground">
            {card.acertos}/{card.total}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pontos ponderados</p>
          <p className="text-4xl font-semibold text-foreground">
            {card.pontos}
            <span className="text-base text-muted-foreground">/{card.pontosPossiveis}</span>
          </p>
        </div>
      </div>

      {card.erratico && (
        <div className="mt-5 rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-sm leading-relaxed text-foreground">
          <strong>Padrão errático detectado.</strong> Você acertou {card.acertosAvancados} questão(ões)
          de nível avançado (acima de 75) mas errou {card.errosBasicos} de base (abaixo de 40). Na TRI
          isso indica chute, então o peso dessas questões avançadas foi reduzido em 40%.
        </div>
      )}

      <div className="mt-6 space-y-2">
        {outcomes.map((o, i) => (
          <div
            key={`${o.question.id}-${i}`}
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm ${
              o.correto
                ? "border-success/50 bg-success/10"
                : "border-destructive/40 bg-destructive/10"
            }`}
          >
            <span className="line-clamp-1 text-foreground">
              {i + 1}. {o.question.materia ?? o.question.area_conhecimento}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              nível {o.dificuldade} · sua resposta {o.letra} · gabarito {o.question.resposta_correta}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
      >
        Iniciar nova trilha
      </button>
    </div>
  );
}

function optionText(q: AdaptiveQuestion, letter: string): string {
  switch (letter) {
    case "A":
      return q.opcao_a;
    case "B":
      return q.opcao_b;
    case "C":
      return q.opcao_c;
    case "D":
      return q.opcao_d;
    default:
      return q.opcao_e;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Simulado Adaptativo</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">
          Motor de progressão de habilidade em tempo real, no estilo TRI.
        </p>
        {children}
      </div>
    </main>
  );
}
