import { Flame, Coins } from "lucide-react";
import { useXp } from "@/hooks/use-xp";

/** Barra estilo Duolingo: chama da sequência, nível e XP, no topo das páginas do app. */
export function StatPills({ className }: { className?: string }) {
  const xp = useXp();

  return (
    <div className={`flex items-center justify-end gap-2 ${className ?? ""}`}>
      {/* Sequência */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <Flame className={`h-4 w-4 ${xp.streak > 0 ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.streak}</span>
      </span>

      {/* Nível */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <span className="flex h-5 w-7 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          LV
        </span>
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.level}</span>
      </span>

      {/* XP */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold tabular-nums text-foreground">{xp.totalXp}</span>
      </span>
    </div>
  );
}
