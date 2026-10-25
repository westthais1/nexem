import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Trophy } from "lucide-react";

import foxAsset from "@/assets/daily/fox.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { BOXES_PER_LEVEL, PATH_LEVELS, PATH_TOTAL, levelOf } from "@/lib/daily-path";
import { cn } from "@/lib/utils";

export const PATH_QUERY_KEY = ["daily_path_progress"];

export async function fetchPath() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { box: 0, lastJump: 0, lastDay: null as string | null };
  const { data } = await supabase
    .from("daily_path_progress")
    .select("box,last_jump,last_awarded_day")
    .eq("user_id", u.user.id)
    .maybeSingle();
  return {
    box: data?.box ?? 0,
    lastJump: data?.last_jump ?? 0,
    lastDay: (data?.last_awarded_day as string | null) ?? null,
  };
}

/** Zigzag leve: a trilha sobe e desce a cada caixa do nível atual. */
const LIFT = [0, -14, -24, -14, 0];

/** Mostra apenas o nível atual da trilha: a raposa pula caixas conforme os acertos do Desafio Diário. */
export function DailyFoxPath({ className }: { className?: string }) {
  const { data } = useQuery({ queryKey: PATH_QUERY_KEY, queryFn: fetchPath, staleTime: 30_000 });
  const box = data?.box ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const pulouHoje = data?.lastDay === today && (data?.lastJump ?? 0) > 0;
  const nivel = levelOf(box);
  const base = nivel * BOXES_PER_LEVEL;
  const noNivel = Math.min(Math.max(box - base, 0), BOXES_PER_LEVEL);
  const nivelCompleto = box > 0 && box % BOXES_PER_LEVEL === 0 && pulouHoje;
  const foxAt = Math.min(box, PATH_TOTAL - 1);
  const proximo = nivel < PATH_LEVELS.length - 1 ? PATH_LEVELS[nivel + 1] : null;
  const faltam = BOXES_PER_LEVEL - noNivel;
  const concluido = box >= PATH_TOTAL;

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-6 card-glow", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Trilha do Desafio Diario
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            7–8 acertos: a raposa pula 1 caixa · 9–10 acertos: pula 2 caixas.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          Nível {PATH_LEVELS[nivel]} · {noNivel}/{BOXES_PER_LEVEL}
        </span>
      </div>
      {nivelCompleto && (
        <p className="mt-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-semibold text-primary">
          Nível liberado! 🎉
        </p>
      )}

      <div className="relative mt-14 px-2">
        <div className="relative flex items-start justify-between">
          <svg
            aria-hidden
            overflow="visible"
            className="pointer-events-none absolute top-0 h-14"
            style={{ left: 28, width: "calc(100% - 56px)" }}
            viewBox="0 0 100 56"
            preserveAspectRatio="none"
          >
            <polyline
              points={LIFT.map((l, i) => `${i * 25},${28 + l}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="text-border"
            />
          </svg>
          {Array.from({ length: BOXES_PER_LEVEL }).map((_, bi) => {
            const idx = base + bi;
            const feito = idx < box;
            const atual = idx === foxAt;
            const ultimo = bi === BOXES_PER_LEVEL - 1;
            const recem = pulouHoje && idx >= box - (data?.lastJump ?? 0) && idx < box;
            return (
              <div
                key={idx}
                className="relative flex flex-col items-center"
                style={{ transform: `translateY(${LIFT[bi % LIFT.length]}px)` }}
              >
                {atual && (
                  <img
                    src={foxAsset.url}
                    alt="Raposa na caixa atual"
                    width={48}
                    height={48}
                    className={cn(
                      "absolute -top-12 left-1/2 h-12 w-12 -translate-x-1/2 object-contain",
                      pulouHoje && "fox-jump",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border-b-4 transition-all",
                    feito && "border-primary/70 bg-primary text-primary-foreground",
                    atual && "border-accent/70 bg-accent text-accent-foreground ring-4 ring-accent/30",
                    !feito && !atual && "border-border bg-secondary text-muted-foreground",
                    recem && "box-glow",
                  )}
                >
                  {feito ? (
                    <Check className="h-6 w-6" />
                  ) : ultimo ? (
                    <Trophy className="h-6 w-6" />
                  ) : atual ? (
                    <span className="font-bold">{idx + 1}</span>
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <span className="mt-2 text-[11px] font-medium text-muted-foreground">
                  {ultimo ? "Fim do nível" : `Caixa ${bi + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        {concluido ? (
          <>
            <Trophy className="h-4 w-4 text-primary" />
            Trilha concluída — você chegou a Mestre ENEM.
          </>
        ) : proximo ? (
          <>
            <Lock className="h-4 w-4" />
            Faltam {faltam} {faltam === 1 ? "caixa" : "caixas"} para abrir {proximo}.
          </>
        ) : null}
      </p>
    </section>
  );
}
