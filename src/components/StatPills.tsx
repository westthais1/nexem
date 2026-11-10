import { Flame, Coins } from "lucide-react";
import { useXp } from "@/hooks/use-xp";
import { levelTitle } from '@/lib/gamification';

/** Barra estilo Duolingo: chama da sequência, nível e XP, no topo das páginas do app. */
export function StatPills({ className }: { className?: string }) {
  const xp = useXp();

  return (
    <div className={`flex items-center justify-end gap-2 ${className ?? ""}`}>
      {/* Sequência */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm" aria-label={`${xp.streak} dias de sequência`}>
        <Flame className={`h-4 w-4 ${xp.streak > 0 ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.streak}</span>
      </span>

      {/* Nível */}
      <span className="inline-flex flex-col rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm" title={`${levelTitle(xp.level)} · ${xp.xpParaProximo-xp.xpNoNivel} XP para o próximo nível`}>
        <span className="flex items-center gap-1.5">
        <span className="flex h-5 w-7 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          LV
        </span>
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.level}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{levelTitle(xp.level)}</span>
        </span>
        <progress aria-label="Progresso do nível" max={xp.xpParaProximo} value={xp.xpNoNivel} className="game-progress mt-1 h-1 w-full"/>
      </span>

      {/* XP */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.totalXp}</span>
      </span>
    </div>
  );
}
