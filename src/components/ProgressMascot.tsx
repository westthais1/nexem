import { Link } from "@tanstack/react-router";

import { FoxMascot } from "@/components/FoxMascot";
import { KnowledgeAura } from "@/components/KnowledgeAura";
import { StreakCard } from "@/components/StreakCard";
import { useXp } from "@/hooks/use-xp";
import { useQuery } from "@tanstack/react-query";
import { defaultProgress, fetchProgress } from "@/lib/progress";
import { XP_REWARDS, foxMessage } from "@/lib/xp";

/** Widget "Progresso & Mascote" da Dashboard. */
export function ProgressMascot() {
  const xp = useXp();
  const { data: proficiency } = useQuery({
    queryKey: ["nexem_user_progress"],
    queryFn: fetchProgress,
    staleTime: 60_000,
  });
  const mensagem = foxMessage(
    {
      totalXp: xp.totalXp,
      streak: xp.streak,
      bestStreak: xp.bestStreak,
      lastActiveDay: xp.lastActiveDay,
      lastActivity: xp.lastActivity,
      history: xp.history,
    },
    xp.level,
  );

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card card-glow">
      <div className="relative">
        <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
          <div className="flex flex-col items-center">
            <KnowledgeAura
              tracks={(proficiency ?? defaultProgress()).tracks}
              className="h-48 w-48 sm:h-52 sm:w-52"
            >
              <FoxMascot stage={xp.stage.id} className="h-full w-full" />
            </KnowledgeAura>
            <p className="mt-2 text-sm font-semibold text-foreground">{xp.stage.name}</p>
            <p className="text-xs text-muted-foreground">{xp.stage.title}</p>
          </div>

          <div className="flex flex-col justify-center">
            <div className="relative rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground">
              {mensagem}
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Nível atual</p>
                <p className="text-3xl font-semibold text-foreground text-glow-neon">
                  Nível {xp.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">XP total</p>
                <p className="text-2xl font-semibold text-foreground">{xp.totalXp} XP</p>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700"
                style={{ width: `${Math.round(xp.progresso * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {xp.xpNoNivel} / {xp.xpParaProximo} XP para o nível {xp.level + 1}
            </p>

            <StreakCard className="mt-5" />

            <div className="mt-5 flex flex-wrap gap-2">
              <RewardChip to="/simulado" label="Questão no Simulado" xp={XP_REWARDS.questao} />
              <RewardChip to="/redacao" label="Redação" xp={XP_REWARDS.redacao} />
              <RewardChip to="/full-simulado" label="Prova Completa" xp={XP_REWARDS.provaCompleta} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type RewardTo = "/simulado" | "/full-simulado" | "/redacao" | "/prova";

function RewardChip({ to, label, xp }: { to: RewardTo; label: string; xp: number }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/10"
    >
      {label}
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
        +{xp} XP
      </span>
    </Link>
  );
}
