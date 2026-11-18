import { useEffect } from "react";
import { Crown, Flame, Sparkles } from "lucide-react";
import foxAsset from "@/assets/daily/fox.png.asset.json";
import { Button } from "@/components/ui/button";

const COLORS = ["var(--primary)", "var(--electric)", "var(--warning)"];

/** Confete disparado de baixo para cima por toda a tela. */
export function ConfettiBurst({ pieces = 30 }: { pieces?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }).map((_, i) => {
        const fromLeft = i % 2 === 0;
        const startX = fromLeft ? (i * 7) % 30 : 70 + ((i * 11) % 30);
        const dx = (fromLeft ? 1 : -1) * (10 + ((i * 13) % 40));
        return (
          <span
            key={i}
            className="confetti-up absolute bottom-0 block"
            style={{
              left: `${startX}%`,
              width: i % 4 === 0 ? 8 : 10,
              height: i % 4 === 0 ? 8 : 16,
              borderRadius: i % 4 === 0 ? "9999px" : "2px",
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 8) * 0.04}s`,
              animationDuration: `${1.0 + (i % 5) * 0.04}s`,
              ["--dx" as string]: `${dx}vw`,
              ["--rot" as string]: `${(i % 2 ? 1 : -1) * (540 + (i % 5) * 180)}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Celebração não modal: desaparece sem interromper o desafio. */
export function LevelUpCelebration({ open, level, onClose, confetti=true }: { open: boolean; level: string; onClose: () => void; confetti?:boolean }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end">
      {confetti && <ConfettiBurst />}
      <div role="status" className="levelup-pop relative w-full max-w-sm rounded-lg border-2 border-primary/40 bg-card p-4 text-center shadow-2xl">
        <div className="levelup-spin-rays pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 w-48 rounded-full" aria-hidden />
        <Crown className="levelup-crown relative mx-auto h-10 w-10 fill-primary text-primary" />
        <img src={foxAsset.url} alt="Raposa comemorando" className="fox-party relative mx-auto -mt-1 h-24 w-24 object-contain" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Subiu de nível!</p>
        <h2 key={level} className="game-number-pop mt-1 text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {level}
        </h2>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm font-semibold">
          <span className="flex items-center gap-1 text-primary"><Sparkles className="h-4 w-4" /> Nova etapa</span>
          <span className="flex items-center gap-1 text-accent"><Flame className="h-4 w-4" /> Sequência mantida</span>
        </div>
        <Button variant="outline" onClick={onClose} className="pointer-events-auto mt-3">Fechar</Button>
      </div>
    </div>
  );
}
