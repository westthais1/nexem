import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AnimatedProgress } from "@/components/GameEffects";
import { Flame } from "lucide-react";

import { useXp } from "@/hooks/use-xp";
import { XP_REWARDS } from "@/lib/xp";
import { useGameState } from '@/components/GameProgress';
import { averageTheta } from '@/lib/progress';

/** Módulo "Desafio Diário Nexem" da Dashboard, com sequência e progresso do dia. */
export function DailyChallengeCard() {
  const xp = useXp();
  const game = useGameState();
  const session = game.data?.run;
  const theta = session ? averageTheta(session.thetas) : null;
  const total = 10;
  const done = session?.answers.length ?? 0;
  const completo = Boolean(session?.completed) || (session != null && done >= total);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card card-glow">
      <div className="bg-aurora relative">
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-xl font-semibold text-foreground md:text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Desafio Diário Nexem
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Flame aria-hidden="true" className={`h-4 w-4 ${!completo ? "game-sway" : ""}`} /> {xp.streak} {xp.streak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              10 questões por dia, cerca de 15 minutos: 2 de aquecimento, 6 no seu nível{theta !== null ? ` (${theta}/100)` : ''}
              e 2 de chefe final. Concluir as 10 abre seu baú diário.
            </p>

            <AnimatedProgress className="mt-5 h-2.5 w-full max-w-md" label="Progresso do desafio de hoje" value={pct} max={100}/>
            <p className="mt-2 text-xs text-muted-foreground">
              {completo
                ? "Desafio de hoje concluído. Novo conjunto amanhã!"
                : `${done}/${total} questões concluídas hoje · +${XP_REWARDS.desafioDiario} XP (dobro com consistência TRI)`}
            </p>
          </div>

          <Button asChild className={`relative overflow-hidden ${!completo ? 'daily-cta-shine' : ''}`}>
            <Link to="/desafio">{completo ? "Ver resumo do dia" : done > 0 ? "Continuar desafio" : "Iniciar desafio"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
