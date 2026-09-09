import { Flame } from "lucide-react";

import { useXp } from "@/hooks/use-xp";
import { lastDays } from "@/lib/xp";

/** Sequência diária de estudos — 7 dias, com recorde. */
export function StreakCard({ className }: { className?: string }) {
  const xp = useXp();
  const dias = lastDays(xp.history, 7);
  const hojeFeito = dias[dias.length - 1]?.active ?? false;

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              xp.streak > 0 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {xp.streak} {xp.streak === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs text-muted-foreground">Sequência atual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{xp.bestStreak}</p>
          <p className="text-xs text-muted-foreground">Recorde</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-1.5">
        {dias.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-full items-center justify-center rounded-lg border text-[11px] font-semibold ${
                d.active
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border bg-background/40 text-muted-foreground"
              }`}
            >
              {d.active ? "✓" : "·"}
            </span>
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {hojeFeito
          ? "Meta de hoje cumprida! Volte amanhã para manter a chama acesa."
          : "Responda uma questão hoje para manter sua sequência viva."}
      </p>
    </div>
  );
}
