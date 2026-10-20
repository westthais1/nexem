import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Loader2, Lock, Sparkles, Trophy } from "lucide-react";

import { TutorChat } from "@/components/TutorChat";
import { useServerFn } from '@tanstack/react-start';
import { getPremiumQuestionPool } from '@/lib/subscription.functions';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { registrarTentativa } from "@/lib/attempts.functions";
import { awardXp } from "@/lib/xp";
import { pushHistory, readHistory } from "@/lib/daily-challenge";
import { fetchProgress, saveProgress, TRACK_LABEL, type UserProgress } from "@/lib/progress";
import {
  MASTERY_QUERY_KEY,
  fetchMasteryProgress,
  saveSubjectProgress,
  subjectProgress,
  type MasteryProgress,
} from "@/lib/mastery-progress";

import {
  BLOCK_SIZE,
  LEVELS,
  SUBJECTS,
  SUBJECT_BY_SLUG,
  averageOf,
  calibrate,
  subjectOf,
  unlocked,
  withTrack,
  type LevelId,
  type MasteryLevel,
  type Subject,
} from "@/lib/mastery";

export const Route = createFileRoute("/simulado")({
  head: () => ({
    meta: [
      { title: "Níveis de Maestria — Treine com Nex | Nexem" },
      {
        name: "description",
        content:
          "Treino estruturado por matéria em três níveis: Fundações, Aprofundamento e Domínio Avançado. Blocos de 5 questões que calibram sua proficiência.",
      },
      { property: "og:title", content: "Níveis de Maestria — Treine com Nex | Nexem" },
      {
        property: "og:description",
        content:
          "Escolha a matéria, destrave os níveis e suba sua proficiência bloco a bloco, no estilo TRI do ENEM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaestriaPage,
});

/* --------------------------------- dados ---------------------------------- */

const TABLE = "enem_provas";
const COLUMNS =
  "id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,explicacao,dificuldade,materia,area_conhecimento,imagem_url";
const LETTERS = ["A", "B", "C", "D", "E"] as const;

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
  dificuldade: number | null;
  materia: string | null;
  area_conhecimento: string | null;
  imagem_url: string | null;
};

function diffOf(q: QuestionRow): number {
  const d = Number(q.dificuldade);
  return Number.isFinite(d) && d > 0 ? Math.min(100, Math.max(1, Math.round(d))) : 50;
}

function optionText(q: QuestionRow, letter: string): string {
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

function isValid(q: QuestionRow): boolean {
  const campos = [q.enunciado, q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e];
  if (campos.some((c) => typeof c !== "string" || c.trim() === "")) return false;
  return LETTERS.includes((q.resposta_correta ?? "").trim().toUpperCase() as (typeof LETTERS)[number]);
}

/** Bloco de 5 questões inéditas dentro da faixa exata do nível. */
function buildBlock(
  pool: QuestionRow[],
  subject: Subject,
  level: MasteryLevel,
  excluded: Set<string>,
): QuestionRow[] {
  const daMateria = pool.filter(
    (q) => isValid(q) && subjectOf(q.materia, q.area_conhecimento)?.slug === subject.slug,
  );
  const naFaixa = daMateria.filter((q) => {
    const d = diffOf(q);
    return d >= level.min && d <= level.max;
  });
  const ineditas = naFaixa.filter((q) => !excluded.has(String(q.id)));
  const base = ineditas.length >= BLOCK_SIZE ? ineditas : naFaixa.length > 0 ? naFaixa : daMateria;
  const sorteadas = [...base].sort(() => Math.random() - 0.5).slice(0, BLOCK_SIZE);
  return sorteadas.map((q) => ({ ...q, resposta_correta: q.resposta_correta.trim().toUpperCase() }));
}

type Answer = { questionId: string; letra: string; correto: boolean; dificuldade: number };

/* --------------------------------- página --------------------------------- */

type View =
  | { kind: "materias" }
  | { kind: "niveis"; subject: Subject }
  | { kind: "bloco"; subject: Subject; level: MasteryLevel };

function MaestriaPage() {
  const { isPremium, isLoading, openUpgrade } = useSubscription();
  const getPool = useServerFn(getPremiumQuestionPool);
  const poolQuery = useQuery({ queryKey: [TABLE, "maestria", isPremium], queryFn: async () => await getPool() as QuestionRow[], enabled: isPremium });
  const progressQuery = useQuery({ queryKey: ["nexem_user_progress"], queryFn: fetchProgress });
  const masteryQuery = useQuery({
    queryKey: MASTERY_QUERY_KEY,
    queryFn: fetchMasteryProgress,
  });

  const [view, setView] = useState<View>({ kind: "materias" });

  const pool = useMemo(() => poolQuery.data ?? [], [poolQuery.data]);
  const progress = progressQuery.data ?? null;
  const mastery = masteryQuery.data ?? null;


  const contagem = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of pool) {
      const s = subjectOf(q.materia, q.area_conhecimento);
      if (!s) continue;
      map.set(s.slug, (map.get(s.slug) ?? 0) + 1);
    }
    return map;
  }, [pool]);

  if (isLoading || poolQuery.isLoading || progressQuery.isLoading || masteryQuery.isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando suas trilhas de maestria...
        </div>
      </Shell>
    );
  }

  if (poolQuery.isError || progressQuery.isError || masteryQuery.isError) {
    const err = (poolQuery.error ?? progressQuery.error ?? masteryQuery.error) as Error;
    return (
      <Shell>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {err.message}
        </div>
      </Shell>
    );
  }

  if (view.kind === "bloco" && progress && isPremium) {
    return (
      <Shell>
        <BlockSession
          subject={view.subject}
          level={view.level}
          pool={pool}
          progress={progress}
          mastery={mastery}
          onExit={() => setView({ kind: "niveis", subject: view.subject })}
          onRefetchProgress={() => {
            void progressQuery.refetch();
            void masteryQuery.refetch();
          }}
        />
      </Shell>
    );
  }


  if (view.kind === "niveis" && progress) {
    const theta = subjectProgress(mastery, view.subject.slug).theta;

    return (
      <Shell>
        <button
          type="button"
          onClick={() => setView({ kind: "materias" })}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Todas as matérias
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-xl font-semibold text-foreground">{view.subject.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Proficiência atual em {TRACK_LABEL[view.subject.track]}:{" "}
            <strong className="text-foreground">{theta}/100</strong> · cada bloco tem{" "}
            {BLOCK_SIZE} questões inéditas.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {LEVELS.map((level) => {
            const liberado = isPremium;
            const disponiveis = pool.filter((q) => {
              const d = diffOf(q);
              return (
                subjectOf(q.materia, q.area_conhecimento)?.slug === view.subject.slug &&
                d >= level.min &&
                d <= level.max
              );
            }).length;
            const semQuestoes = isPremium && disponiveis === 0;
            return (
              <div
                key={level.id}
                onClick={() => { if (!isPremium) openUpgrade(); }}
                className={`rounded-2xl border p-6 transition-all duration-500 ${
                  liberado
                    ? "border-border bg-card hover:border-primary/50"
                    : "border-border/60 bg-card/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      className={`flex items-center gap-2 text-base font-semibold ${
                        liberado ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {liberado ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {level.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{level.descricao}</p>
                    {!liberado && (
                      <p className="mt-2 inline-flex rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                        Exclusivo Nexem Pro
                      </p>
                    )}
                    {liberado && semQuestoes && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ainda não há questões desta matéria nesta faixa de dificuldade.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    disabled={semQuestoes}
                    onClick={(event) => { event.stopPropagation(); if (!isPremium) { openUpgrade(); return; } setView({ kind: "bloco", subject: view.subject, level }); }}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPremium ? `Iniciar bloco de ${BLOCK_SIZE}` : 'Desbloquear com Nexem Pro'}
                  </Button>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((theta - level.requisito) / Math.max(1, level.max - level.requisito)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Escolha uma matéria e avance pelos três níveis em sequência. Diferente do Desafio Diário
        (que sorteia questões de tudo), aqui o treino é vertical: você aprofunda um tema até
        dominá-lo. Na TRI do ENEM, blocos consistentes de acertos valem mais do que acertos
        espalhados.
      </p>
      <TotalAnsweredBar total={mastery?.totalRespondidas ?? 0} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => {
          const theta = subjectProgress(mastery, s.slug).theta;

          const total = contagem.get(s.slug) ?? 0;
          const liberados = LEVELS.filter((l) => unlocked(l, theta)).length;
          return (
            <button
              key={s.slug}
              type="button"
              disabled={isPremium && total === 0}
              onClick={() => setView({ kind: "niveis", subject: s })}
              className="rounded-2xl border border-border bg-card p-5 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_28px_-10px_var(--neon)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <p className="text-base font-semibold text-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {TRACK_LABEL[s.track]}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Proficiência {theta}/100</span>
                <span className="flex gap-1">
                  {LEVELS.map((l) => (
                    <span
                      key={l.id}
                      className={`h-2 w-6 rounded-full transition-all duration-700 ${
                        unlocked(l, theta) ? "bg-primary" : "bg-background/70"
                      }`}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isPremium ? `${LEVELS.length} níveis disponíveis` : '3 níveis · Nexem Pro'}
              </p>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

/* ----------------------- barra de questões respondidas ---------------------- */

function TotalAnsweredBar({ total }: { total: number }) {

  const goal = 250;
  const pct = Math.min(100, Math.max(2, Math.round((total / goal) * 100)));
  const hue = (total * 3) % 360;
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 card-glow">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Total de questões respondidas</p>
        <p className="flex items-baseline gap-1 text-xs text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground text-glow-neon">{total}</span>
          de {goal} rumo ao domínio
        </p>
      </div>
      <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className="relative h-4 overflow-hidden rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
            filter: `hue-rotate(${hue}deg)`,
            boxShadow: "0 0 18px -4px var(--primary)",
          }}
        >
          <span className="mastery-progress-shine absolute inset-y-0 w-16" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        A cada resposta a barra muda de cor — volume constante é o que move sua proficiência na TRI.
      </p>
    </div>
  );
}

/* ----------------------------- bloco de treino ----------------------------- */

function BlockSession({
  subject,
  level,
  pool,
  progress,
  mastery,
  onExit,
  onRefetchProgress,
}: {
  subject: Subject;
  level: MasteryLevel;
  pool: QuestionRow[];
  progress: UserProgress;
  mastery: MasteryProgress | null;
  onExit: () => void;
  onRefetchProgress: () => void;
}) {
  const [questions] = useState<QuestionRow[]>(() =>
    buildBlock(pool, subject, level, new Set(readHistory())),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [hintToken, setHintToken] = useState(0);

  const atual = subjectProgress(mastery, subject.slug);
  const thetaAntes = atual.theta;
  const current = questions[index] ?? null;

  const finalizar = useCallback(
    async (todas: Answer[]) => {
      setFinished(true);
      setSaving(true);
      const novoTheta = calibrate(
        thetaAntes,
        todas.map((a) => a.correto),
      );
      try {
        pushHistory(todas.map((a) => a.questionId));
        await saveSubjectProgress({
          slug: subject.slug,
          theta: novoTheta,
          respondidas: todas.length,
          acertos: todas.filter((a) => a.correto).length,
          atual,
        });
        await saveProgress({
          ...progress,
          tracks: withTrack(
            progress.tracks,
            subject.track,
            Math.max(progress.tracks[subject.track], novoTheta),
          ),
        });
        setSaved(true);
        onRefetchProgress();
      } catch (e) {
        console.error("[Maestria] Falha ao salvar proficiência", e);
      } finally {
        setSaving(false);
      }
    },
    [progress, subject.track, subject.slug, atual, thetaAntes, onRefetchProgress],

  );

  const confirmar = useCallback(() => {
    if (!current || !selected || confirmed) return;
    const correto = selected === current.resposta_correta;
    const dificuldade = diffOf(current);
    const answer: Answer = {
      questionId: String(current.id),
      letra: selected,
      correto,
      dificuldade,
    };
    const todas = [...answers, answer];
    setAnswers(todas);
    setConfirmed(true);
    if (correto) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 900);
      awardXp("questao");
    }

    void registrarTentativa({
      data: {
        question_id: String(current.id),
        dificuldade_questao: String(dificuldade),
        materia_questao: subject.label,
        foi_correto: correto,
      },
    }).catch((e) => console.error("[Maestria] Falha ao registrar tentativa", e));

    if (todas.length >= questions.length) void finalizar(todas);
  }, [current, selected, confirmed, answers, questions.length, subject.label, finalizar]);

  const proxima = useCallback(() => {
    setHintToken(0);
    setIndex((i) => i + 1);
    setSelected(null);
    setConfirmed(false);
    setTutorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Não encontrei questões inéditas de {subject.label} nesta faixa de dificuldade.
        <button
          type="button"
          onClick={onExit}
          className="mt-4 block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Voltar aos níveis
        </button>
      </div>
    );
  }

  if (finished) {
    const acertos = answers.filter((a) => a.correto).length;
    const acertosAvancados = answers.filter((a) => a.correto && a.dificuldade > 65).length;
    const errosBasicos = answers.filter((a) => !a.correto && a.dificuldade < 41).length;
    const consistente = !(acertosAvancados > 0 && errosBasicos > 0);
    const novoTheta = calibrate(
      thetaAntes,
      answers.map((a) => a.correto),
    );
    const liberou = LEVELS.find((l) => l.requisito > thetaAntes && l.requisito <= novoTheta);

    return (
      <div className="space-y-6">
        {liberou && (
          <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 rounded-2xl border border-primary/50 bg-primary/10 p-6 duration-700">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-lg font-semibold text-foreground text-glow-neon">Nível Liberado!</p>
              <p className="text-sm text-muted-foreground">
                {liberou.label} destravado em {subject.label}.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Diagnóstico do bloco</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {subject.label} · {level.label}
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Metric label="Acertos" value={`${acertos}/${answers.length}`} />
            <Metric
              label="Estabilidade conceitual"
              value={consistente ? "Sólida" : "Instável"}
              hint={
                consistente
                  ? "Sem padrão de chute: acertos coerentes com a dificuldade."
                  : "Você acertou questões difíceis e errou as fáceis — na TRI isso é lido como chute."
              }
            />
            <Metric label="Proficiência" value={`${thetaAntes} → ${novoTheta}`} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{TRACK_LABEL[subject.track]}</span>
              <span>Meta de domínio: 85</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-background/60">
              <div
                className="h-3 rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.min(100, (novoTheta / 85) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Média geral das quatro áreas:{" "}
              {averageOf(withTrack(progress.tracks, subject.track, novoTheta))}/100
            </p>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            {saving
              ? "Sincronizando sua proficiência..."
              : saved
                ? "Progresso salvo. O próximo bloco já parte do seu novo nível."
                : "Não consegui salvar seu progresso agora — ele será recalculado no próximo bloco."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Voltar aos níveis
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {answers.map((a, i) => (
            <div
              key={a.questionId}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm ${
                a.correto
                  ? "border-success/50 bg-success/10"
                  : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <span className="text-foreground">Questão {i + 1}</span>
              <span className="text-xs text-muted-foreground">
                nível {a.dificuldade} · sua resposta {a.letra}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex items-start gap-6">
    <div className="min-w-0 flex-1 space-y-6 transition-all duration-500 ease-out">


      <section className="animate-in fade-in rounded-2xl border border-border bg-card p-6 duration-500 card-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> {subject.label}
          </button>
          <span
            className={`rounded-full border px-3 py-1 text-xs transition-all duration-300 ${
              flash
                ? "scale-110 border-success bg-success/25 text-foreground shadow-[0_0_24px_-4px_var(--neon)]"
                : "border-border bg-background/40 text-muted-foreground"
            }`}
          >
            {level.label} · dificuldade {diffOf(current)}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Questão {index + 1} de {questions.length}
            </span>
            <span>{answers.filter((a) => a.correto).length} acertos</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${(answers.length / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground">
          {current.enunciado}
        </p>

        {current.imagem_url?.startsWith("http") && (
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
            const isCorrect = current.resposta_correta === letter;
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
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm text-foreground transition-all duration-300 disabled:cursor-default ${cls}`}
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
          <div className="animate-in fade-in mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5 duration-500">
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
            index + 1 < questions.length && (
              <button
                type="button"
                onClick={proxima}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Próxima questão
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setTutorOpen(true);
            setHintToken((t) => t + 1);
          }}
          className="group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_var(--accent)] transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_40px_-8px_var(--accent)] active:scale-95 sm:w-auto"
        >
          <span className="absolute inset-0 animate-pulse bg-primary-foreground/10" />
          <Sparkles className="relative h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
          <span className="relative">Pedir Ajuda ao Tutor Nex</span>
        </button>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Janela das últimas 5</p>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: BLOCK_SIZE }).map((_, i) => {
              const a = answers[i];
              return (
                <span
                  key={i}
                  className={`h-8 flex-1 rounded-md border text-center text-xs leading-8 transition-all duration-500 ${
                    !a
                      ? "border-border bg-background/40 text-muted-foreground"
                      : a.correto
                        ? "border-success/60 bg-success/15 text-foreground"
                        : "border-destructive/50 bg-destructive/10 text-foreground"
                  }`}
                >
                  {!a ? "–" : a.correto ? "✓" : "✕"}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Acertar em sequência vale mais que acertos espalhados — é assim que a TRI lê seu
            domínio do conteúdo.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Proficiência atual
          </p>
          <p className="mt-1 text-4xl font-semibold text-foreground text-glow-neon">{thetaAntes}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {TRACK_LABEL[subject.track]} · será recalibrada ao fim do bloco.
          </p>
        </div>
      </aside>

      </div>
      <TutorChat
        key={current.id}
        open={tutorOpen}
        onOpenChange={setTutorOpen}
        question={current.enunciado}
        options={LETTERS.map((l) => `${l}) ${optionText(current, l)}`)}
        area={subject.label}
        explicacao={current.explicacao}
        hintToken={hintToken}
      />
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          Treine com Tutor Nex
        </h1>
        <p className="mb-6 mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Matéria por matéria, nível por nível. Travou? Chame o Nex: ele dá pistas e explica o
          caminho — sem entregar a resposta.
        </p>
        {children}
      </div>
    </main>
  );
}

export type { LevelId };
