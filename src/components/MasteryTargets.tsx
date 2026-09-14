import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, Sparkles } from "lucide-react";

import {
  MASTERY_TARGET,
  TRACKS,
  TRACK_LABEL,
  defaultProgress,
  fetchProgress,
  readCachedProgress,
} from "@/lib/progress";

/** "Meta de Domínio": progresso contínuo de cada área rumo ao nível 85/100. */
export function MasteryTargets() {
  const { data } = useQuery({
    queryKey: ["nexem_user_progress"],
    queryFn: fetchProgress,
    staleTime: 60_000,
  });

  // Só usa o cache do navegador depois da hidratação (evita divergência com o SSR).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const progress = data ?? (hydrated ? readCachedProgress() : null) ?? defaultProgress();
  const hoje = new Date().toISOString().slice(0, 10);
  const salvouHoje = hydrated && progress.lastPlayedDate === hoje;
  const media = Math.round(
    TRACKS.reduce((s, t) => s + progress.tracks[t], 0) / TRACKS.length,
  );


  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 card-glow md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2
            className="text-lg font-semibold text-foreground md:text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Meta de Domínio · {MASTERY_TARGET}/100 em cada área
          </h2>
        </div>
        <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          Média geral: {media}/{MASTERY_TARGET}
        </span>
      </div>

      {salvouHoje && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Proficiência salva. O desafio de amanhã vai se adaptar ao seu novo nível base!
        </div>
      )}

      <div className="mt-5 space-y-4">
        {TRACKS.map((t) => {
          const valor = progress.tracks[t];
          const pct = Math.min(100, Math.round((valor / MASTERY_TARGET) * 100));
          const atingiu = valor >= MASTERY_TARGET;
          return (
            <div key={t}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{TRACK_LABEL[t]}</span>
                <span className={atingiu ? "text-success" : "text-muted-foreground"}>
                  {valor}/{MASTERY_TARGET} {atingiu ? "· meta atingida" : "para a meta"}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    atingiu
                      ? "bg-success"
                      : "bg-gradient-to-r from-primary to-accent"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Cada desafio diário recalibra esses níveis: acertar acima do seu nível sobe mais rápido,
        errar questões fáceis puxa para baixo — igual à lógica da TRI no ENEM.
      </p>
    </section>
  );
}
