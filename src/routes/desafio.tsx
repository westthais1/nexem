import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DailyFoxPath, PATH_QUERY_KEY } from "@/components/DailyFoxPath";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Flame, Sparkles } from "lucide-react";
import { TutorChat } from '@/components/TutorChat';
import { Button } from '@/components/ui/button';

import { awardXp, XP_REWARDS } from "@/lib/xp";
import { useXp } from "@/hooks/use-xp";
import { DailyFoxQuestion } from "@/components/DailyFoxQuestion";
import {
  DAILY_TOTAL,
  applyVelocity,
  buildDailySetFromDb,
  fetchAnsweredQuestionIds,
  recordAnsweredQuestion,
  diffOf,
  fetchDailyPool,
  gradeDaily,
  phaseOf,
  pushHistory,
  readHistory,
  readSession,
  rollingAccuracy,
  todayKey,
  writeSession,
  writeTheta,
  type DailyQuestion,
  type DailySession,
} from "@/lib/daily-challenge";

import {
  MASTERY_TARGET,
  TRACKS,
  TRACK_LABEL,
  averageTheta,
  defaultProgress,
  defaultTracks,
  deviceUserId,
  fetchProgress,
  setCachedProgress,
  trackOf,
  type UserProgress,
} from "@/lib/progress";

export const Route = createFileRoute("/desafio")({
  head: () => ({
    meta: [
      { title: "Desafio Diário Nexem — 10 questões em 15 minutos" },
      {
        name: "description",
        content:
          "Uma sessão travada de 10 questões por dia, calibrada no seu nível de proficiência: aquecimento, nível real e chefe final.",
      },
      { property: "og:title", content: "Desafio Diário Nexem" },
      {
        property: "og:description",
        content: "Hábito de 15 minutos por dia com 10 questões adaptadas ao seu nível e sequência de dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesafioPage,
});

const LETTERS = ["A", "B", "C", "D", "E"] as const;

function optionText(q: DailyQuestion, letter: string): string {
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
      return letter === "E" ? q.opcao_e : "";
  }
}

function DesafioPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["enem_provas", "desafio-diario"],
    queryFn: fetchDailyPool,
  });
  const pool = useMemo(() => data ?? [], [data]);
  const xp = useXp();

  const progressQuery = useQuery({
    queryKey: ["nexem_user_progress"],
    queryFn: fetchProgress,
    staleTime: 60_000,
  });
  const progress: UserProgress = progressQuery.data ?? defaultProgress();

  const [session, setSession] = useState<DailySession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [savedTracks, setSavedTracks] = useState<UserProgress["tracks"] | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [montando, setMontando] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [hintToken, setHintToken] = useState(0);

  useEffect(() => {
    setSession(readSession());
    setUserId(deviceUserId());
    setHydrated(true);
  }, []);

  // Anti-repetição: tudo que este estudante já respondeu fica travado para sempre.
  const answeredQuery = useQuery({
    queryKey: ["historico_desafios", userId],
    queryFn: () => fetchAnsweredQuestionIds(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const tracks = session?.thetas ?? progress.tracks;
  const theta = averageTheta(tracks);

  const questions = useMemo(() => {
    if (!session || pool.length === 0) return [] as DailyQuestion[];
    const byId = new Map(pool.map((q) => [String(q.id), q]));
    return session.questionIds
      .map((id) => byId.get(id))
      .filter((q): q is DailyQuestion => Boolean(q));
  }, [session, pool]);

  const answered = session?.answers.length ?? 0;
  // Índice da questão exibida: só avança quando o aluno clica em "Próxima questão".
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (hydrated) setIndex(readSession()?.answers.length ?? 0);
  }, [hydrated]);
  const current = questions[index] ?? null;
  const total = session?.questionIds.length ?? 0;
  const done = session != null && total > 0 && answered >= total && index >= total;

  const iniciar = useCallback(async () => {
    if (montando) return;
    setMontando(true);
    try {
      const base = progress.tracks;
      const jaRespondidas = [
        ...new Set([...(answeredQuery.data ?? []), ...readHistory()].map(String)),
      ];
      const set = await buildDailySetFromDb(base, jaRespondidas);

      const nova: DailySession = {
        date: todayKey(),
        theta: averageTheta(base),
        thetas: base,
        questionIds: set.map((q) => String(q.id)),
        answers: [],
        completed: false,
        rewarded: false,
        saved: false,
      };
      writeSession(nova);
      setSession(nova);
      setIndex(0);
      setSelected(null);
      setConfirmed(false);
    } finally {
      setMontando(false);
    }
  }, [answeredQuery.data, montando, progress.tracks]);

  const confirmar = useCallback(() => {
    if (!session || !current || !selected || confirmed) return;
    const correto = selected === current.resposta_correta?.trim().toUpperCase();
    const dificuldade = diffOf(current, session.theta);
    setConfirmed(true);

    const answers = [
      ...session.answers,
      {
        questionId: String(current.id),
        letra: selected,
        correto,
        dificuldade,
        track: trackOf(current.area_conhecimento),
      },
    ];
    const completed = answers.length >= session.questionIds.length;
    const next: DailySession = { ...session, answers, completed };
    writeSession(next);
    setSession(next);

    void awardXp("questao", {
      amount: 0,
      label: "Questão do Desafio Diário",
      attempts: [{
        question_id: String(current.id),
        dificuldade_questao: String(dificuldade),
        materia_questao: current.materia ?? current.area_conhecimento ?? null,
        foi_correto: correto,
      }],
    }).catch((e) => console.error("[Desafio] Falha ao registrar tentativa", e));

    // Trava permanente: a questão nunca mais aparece em sessões futuras.
    pushHistory([String(current.id)]);
    void recordAnsweredQuestion(userId, current.id, correto).then(() => {
      void answeredQuery.refetch();
    });
  }, [session, current, selected, confirmed, userId, answeredQuery]);

  const proxima = useCallback(() => {
    setTutorOpen(false);
    setHintToken(0);
    setIndex((i) => i + 1);
    setSelected(null);
    setConfirmed(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const queryClient = useQueryClient();
  const resultado = useMemo(
    () => (session ? gradeDaily(session.answers, session.theta) : null),
    [session],
  );

  // Bônus somente por alto desempenho em uma sessão completa e coerente.
  useEffect(() => {
    if (!session || !done || session.rewarded || !resultado) return;
    const base = XP_REWARDS.desafioDiario;
    writeTheta(resultado.novoTheta);

    // Calibração contínua: grava os novos níveis por trilha para o desafio de amanhã.
    const baseTracks = session.thetas ?? defaultTracks();
    const novosTracks = applyVelocity(baseTracks, session.answers);
    const hoje = todayKey();
    const proximo: UserProgress = {
      tracks: novosTracks,
      lastPlayedDate: hoje,
      triConsistencyRate: resultado.taxaConsistencia,
    };
    setSavedTracks(novosTracks);
    // Anti-repetição: as questões do dia não voltam em sessões futuras.
    pushHistory(session.questionIds);
    // Registro único: XP, sequência, dia de estudo e níveis por área na mesma chamada.
    void awardXp("desafioDiario", {
      amount: resultado.consistente ? base * 2 : base,
      label: resultado.consistente
        ? "Desafio Diário — ótimo desempenho"
        : "Desafio Diário Nexem",
      progress: proximo,
    })
      .then(() => { setCachedProgress(proximo); return progressQuery.refetch(); })
      .catch((e) => console.error("[Desafio] Falha ao salvar proficiência", e));

    void supabase
      .rpc("advance_daily_path", { p_acertos: resultado.acertos, p_day: hoje })
      .then(({ error }) => {
        if (error) console.error("[Desafio] Falha ao avançar a trilha", error.message);
        void queryClient.invalidateQueries({ queryKey: PATH_QUERY_KEY });
      });

    const marcada = { ...session, rewarded: true, completed: true, saved: true };
    writeSession(marcada);
    setSession(marcada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, done, resultado]);

  const rollingWindow = session?.answers.slice(-5) ?? [];
  const cleanHit = useMemo(() => {
    if (rollingWindow.length === 0) return false;
    const latest = rollingWindow[rollingWindow.length - 1];
    const inconsistent =
      rollingWindow.some((answer) => answer.correto && answer.dificuldade > 75) &&
      rollingWindow.some((answer) => !answer.correto && answer.dificuldade < 40);
    return Boolean(latest?.correto) && rollingAccuracy(rollingWindow) >= 0.6 && !inconsistent;
  }, [rollingWindow]);

  return (
    <main className="flex-1 overflow-y-auto motion-safe:animate-fade-in-up">
      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-semibold text-foreground md:text-4xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Desafio Diário Nexem
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              10 questões travadas por dia · cerca de 15 minutos · calibradas no seu nível {theta}/100.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <Flame className="h-4 w-4" /> {xp.streak} {xp.streak === 1 ? "dia" : "dias"}
          </span>
        </header>

        {isLoading && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Preparando o desafio de hoje...
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !isError && hydrated && !session && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-8 card-glow">
            <h2 className="text-lg font-semibold text-foreground">Sua sessão de hoje está pronta</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Questões 1–2: aquecimento (nível {Math.max(1, theta - 15)})</li>
              <li>• Questões 3–8: seu nível real ({theta})</li>
              <li>• Questões 9–10: chefe final (nível {Math.min(100, theta + 15)})</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Concluir as 10 vale +{XP_REWARDS.desafioDiario} XP — e o dobro com 9 ou 10 acertos,
              sem acertar difíceis errando as fáceis.
            </p>
            <button
              type="button"
              onClick={() => void iniciar()}
              disabled={pool.length === 0 || montando || answeredQuery.isLoading}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)] disabled:opacity-40"
            >
              {montando ? "Selecionando suas questões..." : "Começar desafio de hoje"}
            </button>
            {pool.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Nenhuma questão disponível no banco no momento.
              </p>
            )}
          </section>
        )}

        {session && !done && current && (
          <>
            <ProgressRing done={answered} total={session.questionIds.length || DAILY_TOTAL} phase={phaseOf(index)} />

            <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span>Questão {index + 1} de {session.questionIds.length}</span>
                  <span
                    key={`${answered}-${cleanHit}`}
                    className={`difficulty-badge relative isolate overflow-visible rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-all duration-500 ease-out ${cleanHit && confirmed ? "difficulty-clean-hit" : ""}`}
                  >
                    nível {diffOf(current, session.theta)}/100
                    {cleanHit && confirmed && <ParticleBurst />}
                  </span>
                </div>
                <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                  {current.area_conhecimento ?? "Geral"}
                  {current.materia ? ` · ${current.materia}` : ""}
                </span>
              </div>

              <DailyFoxQuestion
                text={current.enunciado}
                mood={
                  confirmed
                    ? selected === current.resposta_correta?.trim().toUpperCase()
                      ? "celebrating"
                      : "encouraging"
                    : selected
                      ? "thinking"
                      : "talking"
                }
              />

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

              {rollingWindow.length > 0 && (
                <RollingHistory answers={rollingWindow} />
              )}

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

              <div className="mt-6">
                <Button variant="outline" className="mb-4 mr-3" onClick={() => { setTutorOpen(true); setHintToken(value => value + 1); }}><Sparkles /> Pedir Ajuda ao Tutor Nex</Button>
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
                    {answered >= session.questionIds.length ? "Ver resultado" : "Próxima questão"}
                  </button>
                )}
              </div>
            </section>
            <TutorChat key={current.id} open={tutorOpen} onOpenChange={setTutorOpen} question={current.enunciado} options={LETTERS.map(letter => `${letter}) ${optionText(current, letter)}`)} area={current.area_conhecimento ?? 'ENEM'} explicacao={current.explicacao} hintToken={hintToken} />
          </>
        )}

        {session && done && resultado && (
          <section className="mt-8 space-y-6">
            {resultado.precisaMelhorar ? (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
                <p className="text-xl font-semibold text-foreground">
                  Tem que melhorar um pouquinho
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você acertou {resultado.acertos} de {resultado.total}. Revise as explicações e
                  pratique os assuntos em que teve dificuldade.
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in relative overflow-hidden rounded-2xl border border-success/50 bg-success/10 p-6 text-center duration-700">
                <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
                <p className="relative text-3xl">🎉</p>
                <p
                  className="relative mt-2 text-xl font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ótimo desempenho!
                </p>
                <p className="relative mt-1 text-sm text-muted-foreground">
                  {resultado.acertos} de {resultado.total} acertos — XP em dobro:
                  +{XP_REWARDS.desafioDiario * 2} XP. Continue assim!
                </p>
              </div>
            )}

            {savedTracks && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 rounded-2xl border border-primary/50 bg-primary/10 p-6 duration-500">
                <div>
                  <p
                    className="text-lg font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Progresso do Dia Salvo com Sucesso!
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seu nível base foi atualizado. Amanhã o Desafio Diário irá se adaptar a partir
                    do seu novo ponto de partida.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Meta de Domínio · {MASTERY_TARGET}/100 em cada trilha
                  </p>
                  <div className="mt-4 space-y-4">
                    {TRACKS.map((t) => {
                      const antes = (session.thetas ?? savedTracks)[t];
                      const depois = savedTracks[t];
                      const delta = depois - antes;
                      const pct = Math.min(100, Math.round((depois / MASTERY_TARGET) * 100));
                      const atingiu = depois >= MASTERY_TARGET;
                      return (
                        <div key={t}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{TRACK_LABEL[t]}</span>
                            <span className="text-muted-foreground">
                              {depois}/{MASTERY_TARGET}
                              {delta !== 0 && (
                                <span
                                  className={
                                    delta > 0 ? "ml-2 text-success" : "ml-2 text-destructive"
                                  }
                                >
                                  {delta > 0 ? "+" : ""}
                                  {delta}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                atingiu ? "bg-success" : "bg-gradient-to-r from-primary to-accent"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            <DailyFoxPath />

            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <h2 className="text-lg font-semibold text-foreground">Resumo do desafio de hoje</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Stat label="Acertos" value={`${resultado.acertos}/${resultado.total}`} />
                <Stat label="Nota estimada (TRI)" value={`${resultado.nota}`} />
                <Stat label="Novo nível" value={`${resultado.novoTheta}/100`} />
              </div>
              {resultado.possivelChute && (
                <p className="mt-5 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm text-foreground">
                  Há indícios de possíveis chutes ou dúvidas no conteúdo. Só pelas respostas não
                  dá para confirmar se você chutou; tente explicar seu raciocínio antes de escolher
                  uma alternativa.
                </p>
              )}
              {resultado.padraoInconsistente && (
                <p className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
                  Padrão inconsistente: {resultado.acertosAvancados} acerto(s) em questões difíceis
                  com {resultado.errosBasicos} erro(s) em questões fáceis. No ENEM real, a TRI reduz
                  o valor desses acertos.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  Voltar à Dashboard
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                O desafio é travado em 10 questões por dia. Um novo conjunto aparece amanhã.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProgressRing({ done, total, phase }: { done: number; total: number; phase: string }) {
  const pct = total > 0 ? done / total : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
        <circle cx="42" cy="42" r={r} className="stroke-secondary" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r={r}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 42 42)"
        />
        <text
          x="42"
          y="47"
          textAnchor="middle"
          className="fill-foreground text-[15px] font-semibold"
        >
          {done}/{total}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-foreground">{phase}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {done === 0
            ? "Comece devagar: as duas primeiras são de aquecimento."
            : done < total
              ? `Faltam ${total - done} questões para fechar o dia.`
              : "Sessão concluída!"}
        </p>
      </div>
    </div>
  );
}

function RollingHistory({ answers }: { answers: DailySession["answers"] }) {
  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Consistência · últimas 5</p>
        <span className="text-xs text-muted-foreground">
          {Math.round(rollingAccuracy(answers) * 100)}% de precisão
        </span>
      </div>
      <div className="mt-3 grid max-w-xs grid-cols-5 gap-2" aria-label="Histórico das últimas cinco respostas">
        {Array.from({ length: 5 }, (_, slot) => {
          const answer = answers[slot];
          return (
            <span
              key={`${answer?.questionId ?? "empty"}-${slot}`}
              className={`flex h-9 w-full items-center justify-center rounded-md border text-sm font-bold transition-all duration-500 ease-out ${
                answer
                  ? answer.correto
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-background/40 text-muted-foreground"
              }`}
            >
              {answer ? (answer.correto ? "✓" : "×") : "·"}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ParticleBurst() {
  return (
    <span className="pointer-events-none absolute inset-1/2" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <i key={index} className="clean-particle" />
      ))}
    </span>
  );
}
