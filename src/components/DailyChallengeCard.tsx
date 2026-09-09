import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

import { useXp } from "@/hooks/use-xp";
import { XP_REWARDS } from "@/lib/xp";
import {
  DAILY_EVENT,
  DAILY_TOTAL,
  readSession,
  readTheta,
  type DailySession,
} from "@/lib/daily-challenge";

/** Módulo "Desafio Diário Nexem" da Dashboard, com sequência e progresso do dia. */
export function DailyChallengeCard() {
  const xp = useXp();
  const [session, setSession] = useState<DailySession | null>(null);
  const [theta, setTheta] = useState(50);

  useEffect(() => {
    setSession(readSession());
    setTheta(readTheta());
    const onChange = (e: Event) => {
      setSession((e as CustomEvent<DailySession>).detail);
      setTheta(readTheta());
    };
    window.addEventListener(DAILY_EVENT, onChange);
    return () => window.removeEventListener(DAILY_EVENT, onChange);
  }, []);

  const total = session?.questionIds.length || DAILY_TOTAL;
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
                <Flame className="h-4 w-4" /> {xp.streak} {xp.streak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              10 questões por dia, cerca de 15 minutos: 2 de aquecimento, 6 no seu nível ({theta}
              /100) e 2 de chefe final. Concluir as 10 mantém sua sequência acesa.
            </p>

            <div className="mt-5 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completo
                ? "Desafio de hoje concluído. Novo conjunto amanhã!"
                : `${done}/${total} questões concluídas hoje · +${XP_REWARDS.desafioDiario} XP (dobro com consistência TRI)`}
            </p>
          </div>

          <Link
            to="/desafio"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
          >
            {completo ? "Ver resumo do dia" : done > 0 ? "Continuar desafio" : "Iniciar desafio"}
          </Link>
        </div>
      </div>
    </section>
  );
}
