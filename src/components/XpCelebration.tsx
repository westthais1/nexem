import { useEffect, useState } from "react";

import { FoxMascot } from "@/components/FoxMascot";
import { XP_GAIN_EVENT, stageForLevel, type XpGainDetail } from "@/lib/xp";

type Toast = XpGainDetail & { key: number };

/** Feedback global de XP: aviso de XP ganho + modal de comemoração ao subir de nível/evoluir. */
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
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <>
      {toast && (
        <div
          key={toast.key}
          role="status"
          className="fixed bottom-6 right-6 z-50 flex max-w-xs items-center gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-2xl animate-scale-in card-glow"
        >
          <FoxMascot stage={stageForLevel(toast.level).id} className="h-12 w-12 shrink-0" animated={false} />
          <div>
            <p className="text-sm font-semibold text-foreground">{toast.label} concluída!</p>
            <p className="text-sm text-primary">Você ganhou +{toast.amount} XP</p>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Confetti />
          <div className="relative w-full max-w-md rounded-2xl border border-primary/50 bg-card p-8 text-center card-glow animate-scale-in">
            <FoxMascot stage={stageForLevel(celebration.level).id} className="mx-auto h-40 w-40" />
            <h2 className="mt-2 text-2xl font-semibold text-foreground text-glow-neon">
              {celebration.evolved ? "Sua raposa evoluiu!" : `Nível ${celebration.level}!`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {celebration.evolved
                ? `Agora ela é a ${celebration.stageName}. Continue estudando para a próxima evolução.`
                : `Você chegou ao nível ${celebration.level} com +${celebration.amount} XP de "${celebration.label}".`}
            </p>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
            >
              Continuar estudando
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 10) * 0.12;
        const duration = 2.4 + ((i % 5) * 0.35);
        const colors = ["var(--neon)", "var(--electric)", "#ffd166", "#ff7a7a"];
        return (
          <span
            key={i}
            className="absolute top-[-10%] h-2.5 w-1.5 rounded-sm confetti-fall"
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
