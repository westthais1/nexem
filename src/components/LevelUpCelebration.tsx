import { useEffect } from "react";
import { Crown, Flame, Sparkles } from "lucide-react";
import foxAsset from "@/assets/daily/fox.png.asset.json";

const COLORS = ["var(--primary)", "var(--accent)", "var(--chart-3, var(--primary))", "var(--chart-4, var(--accent))", "var(--chart-5, var(--primary))"];

/** Confete disparado de baixo para cima por toda a tela. */
export function ConfettiBurst({ pieces = 140 }: { pieces?: number }) {
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
              animationDelay: `${(i % 14) * 0.06}s`,
              animationDuration: `${2.2 + (i % 7) * 0.25}s`,
              ["--dx" as string]: `${dx}vw`,
              ["--rot" as string]: `${(i % 2 ? 1 : -1) * (540 + (i % 5) * 180)}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Tela cheia de comemoração ao subir de nível na trilha. */
export function LevelUpCelebration({ open, level, onClose, confetti=true }: { open: boolean; level: string; onClose: () => void; confetti?:boolean }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      {confetti && <ConfettiBurst />}
      <div role="dialog" aria-modal className="levelup-pop relative w-full max-w-sm rounded-3xl border-2 border-primary/40 bg-card p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-rays pointer-events-none absolute inset-x-0 -top-16 mx-auto h-40 w-40 rounded-full" aria-hidden />
        <Crown className="levelup-crown relative mx-auto h-10 w-10 fill-primary text-primary" />
        <img src={foxAsset.url} alt="Raposa comemorando" className="fox-party relative mx-auto -mt-1 h-32 w-32 object-contain" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Subiu de nível!</p>
        <h2 className="mt-1 text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {level}
        </h2>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm font-semibold">
          <span className="flex items-center gap-1 text-primary"><Sparkles className="h-4 w-4" /> Nova etapa</span>
          <span className="flex items-center gap-1 text-accent"><Flame className="h-4 w-4" /> Sequência mantida</span>
        </div>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-2xl border-b-4 border-primary/60 bg-primary py-3 text-lg font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-1 active:border-b-0">
          Continuar
        </button>
      </div>
    </div>
  );
}
