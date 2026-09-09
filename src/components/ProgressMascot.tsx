import { Link } from "@tanstack/react-router";

import { FoxMascot } from "@/components/FoxMascot";
import { useXp } from "@/hooks/use-xp";
import { XP_REWARDS, foxMessage, FOX_STAGES } from "@/lib/xp";

/** Widget "Progresso & Mascote" da Dashboard. */
export function ProgressMascot() {
  const xp = useXp();
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
            <FoxMascot stage={xp.stage.id} className="h-40 w-40" />
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
              {xp.streak > 0 ? ` · sequência de ${xp.streak} ${xp.streak === 1 ? "dia" : "dias"}` : ""}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <RewardChip to="/simulado" label="Questão no Simulado" xp={XP_REWARDS.questao} />
              <RewardChip
                to="/full-simulado"
                label="Simulado Adaptativo"
                xp={XP_REWARDS.simuladoAdaptativo}
              />
              <RewardChip to="/redacao" label="Redação" xp={XP_REWARDS.redacao} />
              <RewardChip to="/prova" label="Prova Completa" xp={XP_REWARDS.provaCompleta} />
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {FOX_STAGES.map((s) => (
                <span
                  key={s.id}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    xp.level >= s.minLevel
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background/40 text-muted-foreground"
                  }`}
                >
                  {s.name} · nv {s.minLevel}
                </span>
              ))}
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
