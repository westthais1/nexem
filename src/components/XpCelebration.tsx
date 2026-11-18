import { useEffect, useState } from "react";

import { FoxMascot } from "@/components/FoxMascot";
import { Button } from "@/components/ui/button";
import { XP_GAIN_EVENT, stageForLevel, type XpGainDetail } from "@/lib/xp";

type Toast = XpGainDetail & { key: number };

/** Feedback decorativo e não modal, somente para recompensas já recebidas. */
export function XpCelebration() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [celebration, setCelebration] = useState<XpGainDetail | null>(null);

  useEffect(() => {
    const onGain = (e: Event) => {
      const detail = (e as CustomEvent<XpGainDetail>).detail;
      setToast({ ...detail, key: Date.now() });
      if (detail.leveledUp || detail.evolved) setCelebration(detail);
    };
    window.addEventListener(XP_GAIN_EVENT, onGain);
    return () => window.removeEventListener(XP_GAIN_EVENT, onGain);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => { setToast(null); setCelebration(null); }, 1500);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <>
      {toast && (
        <div
          key={toast.key}
          role="status"
          className={`pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-xs items-center gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-2xl xp-pop card-glow ${celebration ? 'sr-only' : ''}`}
        >
          <FoxMascot stage={stageForLevel(toast.level).id} className="h-12 w-12 shrink-0" animated={false} />
          <div>
            <p className="text-sm font-semibold text-foreground">{toast.label} concluída!</p>
            <p className="text-sm text-primary">Você ganhou +{toast.amount} XP</p>
          </div>
        </div>
      )}

      {celebration && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end" role="status">
          <Confetti />
          <div className="relative w-full max-w-sm rounded-lg border border-primary/50 bg-card p-4 text-center card-glow xp-pop">
            <div className="relative mx-auto h-24 w-24"><span aria-hidden="true" className="levelup-spin-rays absolute -inset-8 rounded-full"/><FoxMascot stage={stageForLevel(celebration.level).id} className="relative h-24 w-24" /></div>
            <h2 key={celebration.level} className="game-number-pop mt-2 text-2xl font-semibold text-foreground text-glow-neon">
              {celebration.evolved ? "Sua raposa evoluiu!" : `Nível ${celebration.level}!`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {celebration.evolved
                ? `Agora ela é a ${celebration.stageName}. Continue estudando para a próxima evolução.`
                : `Você chegou ao nível ${celebration.level} com +${celebration.amount} XP de "${celebration.label}".`}
            </p>
            <Button variant="outline"
              type="button"
              onClick={() => setCelebration(null)}
              className="pointer-events-auto mt-3"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 3) * 0.03;
        const duration = 1.1 + ((i % 5) * 0.08);
        const colors = ["var(--primary)", "var(--electric)", "var(--warning)"];
        return (
          <span
            key={i}
            className="absolute top-[-10%] h-2.5 w-1.5 rounded-sm game-confetti"
            style={{
              left: `${left}%`,
              background: colors[i % colors.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
