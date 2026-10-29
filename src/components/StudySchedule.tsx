import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Rocket, Target } from "lucide-react";

import { questionsSupabase } from "@/lib/external-supabase";
import { supabase } from "@/integrations/supabase/client";
import { contarTentativasHoje } from "@/lib/attempts.functions";

const SCHEDULE_TABLE = "daily_schedules";
const MIN_QUESTIONS_PER_DAY = 5;

const WEEK_ORDER = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

type ScheduleRow = {
  id: string;
  dia_da_semana: string;
  materia_principal: string;
  status_revisao: string | null;
  recomendacao_ia: string | null;
};

type TriProfile = {
  materia: string;
  current_difficulty: string;
  observacao: string | null;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function fetchSchedules(): Promise<ScheduleRow[]> {
  const { data, error } = await questionsSupabase
    .from(SCHEDULE_TABLE)
    .select("id,dia_da_semana,materia_principal,status_revisao,recomendacao_ia");
  if (error) {
    console.error("[Cronograma] Falha ao ler daily_schedules", error);
    throw new Error(`Erro ao ler a tabela "${SCHEDULE_TABLE}": ${error.message}`);
  }
  const rows = (data ?? []) as ScheduleRow[];
  return [...rows].sort(
    (a, b) =>
      WEEK_ORDER.findIndex((d) => normalize(d) === normalize(a.dia_da_semana)) -
      WEEK_ORDER.findIndex((d) => normalize(d) === normalize(b.dia_da_semana)),
  );
}

async function fetchTriProfiles(): Promise<TriProfile[]> {
  const { data, error } = await supabase
    .from("user_tri_profiles")
    .select("materia,current_difficulty,observacao");
  if (error) {
    console.error("[Cronograma] Falha ao ler user_tri_profiles", error);
    throw new Error(`Erro ao ler o perfil TRI: ${error.message}`);
  }
  return (data ?? []) as TriProfile[];
}

export function StudySchedule() {
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: ["daily-schedules"],
    queryFn: fetchSchedules,
    retry: false,
  });

  const triQuery = useQuery({
    queryKey: ["tri-profiles"],
    queryFn: fetchTriProfiles,
    retry: false,
  });

  const attemptsQuery = useQuery({
    queryKey: ["attempts-today"],
    queryFn: () => contarTentativasHoje(),
    retry: false,
  });

  const todayName = WEEK_ORDER[new Date().getDay()] ?? "Domingo";
  const schedules = schedulesQuery.data ?? [];
  const today = useMemo(
    () => schedules.find((s) => normalize(s.dia_da_semana) === normalize(todayName)) ?? null,
    [schedules, todayName],
  );

  const profile = useMemo(() => {
    if (!today) return null;
    return (
      (triQuery.data ?? []).find((p) => normalize(p.materia) === normalize(today.materia_principal)) ?? null
    );
  }, [triQuery.data, today]);

  const difficulty = normalize(profile?.current_difficulty ?? "media");
  const answeredToday = attemptsQuery.data?.total ?? 0;
  const progress = Math.min(100, Math.round((answeredToday / MIN_QUESTIONS_PER_DAY) * 100));

  const concludeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await questionsSupabase
        .from(SCHEDULE_TABLE)
        .update({ status_revisao: "Concluido" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-schedules"] }),
    onError: (cause) => console.error("[Cronograma] Falha ao concluir a meta do dia", cause),
  });

  // Missão cumprida: ao atingir o mínimo de questões, o dia vira "Concluido".
  const todayId = today?.id ?? null;
  const todayDone = normalize(today?.status_revisao ?? "") === "concluido";
  useEffect(() => {
    if (!todayId || todayDone) return;
    if (answeredToday < MIN_QUESTIONS_PER_DAY) return;
    if (concludeMutation.isPending) return;
    concludeMutation.mutate(todayId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayId, todayDone, answeredToday]);

  const difficultyLabel =
    difficulty === "facil" ? "Fácil" : difficulty === "dificil" ? "Difícil" : "Média";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cronograma Inteligente de Estudos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua rotina semanal ajustada automaticamente pelo motor TRI.
          </p>
        </div>
        <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          Hoje é {todayName}
        </span>
      </div>

      {schedulesQuery.isPending ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Carregando seu cronograma…
        </div>
      ) : schedulesQuery.error ? (
        <div className="mt-4 rounded-2xl border border-destructive/40 bg-card p-6">
          <p className="text-sm font-medium text-destructive">Não foi possível carregar o cronograma.</p>
          <p className="mt-2 break-words text-sm text-destructive/80">
            {(schedulesQuery.error as Error).message}
          </p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum dia cadastrado na tabela {SCHEDULE_TABLE}.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* Cartão expandido — Meta de Hoje */}
          {today ? (
            <article
              className={`relative overflow-hidden rounded-2xl border p-6 card-glow md:p-7 ${
                todayDone
                  ? "border-success/50 bg-success/10"
                  : "border-primary/40 bg-card"
              }`}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Meta de Hoje · {today.dia_da_semana}
                  </span>
                  {todayDone ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Concluído
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-4 text-2xl font-semibold text-foreground">{today.materia_principal}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nível TRI atual: <span className="font-medium text-foreground">{difficultyLabel}</span>
                </p>

                {difficulty === "facil" ? (
                  <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    🎯 Modo Recuperação Ativo: Seu simulado recente indica instabilidade nesta matéria. Foco em
                    conceitos fundamentais hoje!
                  </p>
                ) : difficulty === "dificil" ? (
                  <p className="mt-4 rounded-xl border border-warning/60 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    🚀 Modo Avançado Desbloqueado: Ótima consistência TRI! Foco em questões aprofundadas hoje!
                  </p>
                ) : (
                  <p className="mt-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                    ⚖️ Ritmo equilibrado: mantenha a constância com questões de nível médio hoje.
                  </p>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Missão diária</span>
                    <span>
                      {Math.min(answeredToday, MIN_QUESTIONS_PER_DAY)}/{MIN_QUESTIONS_PER_DAY} questões
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${
                        todayDone ? "bg-success" : "bg-gradient-to-r from-primary to-accent"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  to="/simulado"
                  search={{ subject: today.materia_principal }}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
                >
                  {difficulty === "dificil" ? (
                    <Rocket className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Target className="h-4 w-4" aria-hidden="true" />
                  )}
                  Iniciar Missão Diária
                </Link>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nenhuma meta cadastrada para {todayName}.
            </div>
          )}

          {/* Demais dias */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {schedules
              .filter((s) => s.id !== today?.id)
              .map((s) => {
                const done = normalize(s.status_revisao ?? "") === "concluido";
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      done
                        ? "border-success/50 bg-success/10"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.dia_da_semana}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.materia_principal}</p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        Pendente
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
}
