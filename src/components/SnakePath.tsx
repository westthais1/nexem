import type { ReactNode } from "react";
import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type SnakeNode = {
  key: string | number;
  title: string;
  subtitle?: string;
  state: "done" | "active" | "locked";
  icon?: ReactNode;
  onClick?: () => void;
  badge?: ReactNode;
};

/** Deslocamento horizontal em zigue-zague: centro, direita, centro, esquerda… */
const OFFSETS = [0, 1, 0, -1];
const STEP = 120;
const SHIFT = 72;

/** Trilha vertical estilo Duolingo, compartilhada pelas trilhas do app. */
export function SnakePath({ nodes, className }: { nodes: SnakeNode[]; className?: string }) {
  const points = nodes.map((_, i) => ({ x: (OFFSETS[i % 4] ?? 0) * SHIFT, y: i * STEP + 40 }));
  const height = Math.max(nodes.length * STEP, STEP);
  const d = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1]!;
    const my = (prev.y + p.y) / 2;
    return `C ${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }).join(" ");

  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)} style={{ height }}>
      <svg aria-hidden className="pointer-events-none absolute left-1/2 top-0 overflow-visible text-border" width="1" height={height}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" />
      </svg>
      {nodes.map((n, i) => {
        const p = points[i]!;
        return (
          <div key={n.key} className="absolute left-1/2 flex w-40 -translate-x-1/2 flex-col items-center text-center" style={{ top: p.y - 36, marginLeft: p.x }}>
            {n.state === "active" && (
              <span className="mb-1 animate-bounce rounded-lg border border-primary/30 bg-card px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary shadow-sm">
                Próximo desafio
              </span>
            )}
            <button
              type="button"
              disabled={n.state === "locked"}
              onClick={n.onClick}
              aria-label={`${n.title}${n.state === "locked" ? " — bloqueado" : n.state === "done" ? " — concluído" : ""}`}
              className={cn(
                "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-b-[6px] transition-all duration-200 [&_svg]:size-7",
                n.state === "done" && "border-accent/60 bg-accent text-accent-foreground hover:-translate-y-1 hover:brightness-110",
                n.state === "active" && "border-primary/60 bg-primary text-primary-foreground ring-4 ring-primary/30 motion-safe:animate-pulse hover:-translate-y-1 hover:scale-105 hover:animate-none active:translate-y-0.5 active:border-b-2",
                n.state === "locked" && "cursor-not-allowed border-border bg-secondary text-muted-foreground",
              )}
            >
              {n.state === "done" ? <Check strokeWidth={3} /> : n.state === "locked" ? <Lock /> : n.icon ?? <Star />}
              {n.state === "done" && <Star className="absolute -right-1 -top-1 !size-5 fill-primary text-primary" />}
            </button>
            {n.badge}
            <p className={cn("mt-1 text-sm font-semibold leading-tight", n.state === "locked" ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
            {n.subtitle && <p className="text-[11px] text-muted-foreground">{n.subtitle}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Modal de recompensa com confete ao concluir um desafio. */
export function RewardModal({ open, xp, title, onClose }: { open: boolean; xp: number; title: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0 h-3 w-2 rounded-sm"
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.12}s`, background: i % 3 === 0 ? "var(--primary)" : i % 3 === 1 ? "var(--accent)" : "var(--chart-4, var(--primary))" }}
          />
        ))}
      </div>
      <div role="dialog" aria-modal className="relative w-full max-w-sm animate-scale-in rounded-3xl border border-border bg-card p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"><Star className="h-10 w-10 fill-current" /></div>
        <h2 className="mt-4 font-display text-2xl font-bold">Desafio concluído!</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <p className="mt-4 text-3xl font-bold text-primary">+{xp} XP 🪙</p>
        <p className="mt-1 text-xs text-muted-foreground">O próximo nível da trilha foi liberado.</p>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-2xl border-b-4 border-primary/60 bg-primary py-3 font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0.5">
          Continuar
        </button>
      </div>
    </div>
  );
}
