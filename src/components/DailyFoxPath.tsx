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

const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];

/** Caminho estilo Duolingo: a raposa pula caixas conforme os acertos do Desafio Diário. */
export function DailyFoxPath({ className }: { className?: string }) {
  const { data } = useQuery({ queryKey: PATH_QUERY_KEY, queryFn: fetchPath, staleTime: 30_000 });
  const box = data?.box ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const pulouHoje = data?.lastDay === today && (data?.lastJump ?? 0) > 0;
  const nivel = levelOf(box);
  const nivelCompleto = box > 0 && box % BOXES_PER_LEVEL === 0 && pulouHoje;

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-6 card-glow", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Trilha do Desafio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            7–8 acertos: a raposa pula 1 caixa · 9–10 acertos: pula 2 caixas.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          Nível {PATH_LEVELS[nivel]} · {Math.min(box, PATH_TOTAL)}/{PATH_TOTAL}
        </span>
      </div>
      {nivelCompleto && (
        <p className="mt-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-semibold text-primary">
          Nível liberado! 🎉
        </p>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        {PATH_LEVELS.map((nome, li) => (
          <div key={nome} className="flex w-full flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{nome}</p>
            {Array.from({ length: BOXES_PER_LEVEL }).map((_, bi) => {
              const idx = li * BOXES_PER_LEVEL + bi;
              const feito = idx < box;
              const atual = idx === box;
              const ultimo = bi === BOXES_PER_LEVEL - 1;
              const recem = pulouHoje && idx >= box - (data?.lastJump ?? 0) && idx < box;
              return (
                <div key={idx} className="relative" style={{ transform: `translateX(${OFFSETS[idx % OFFSETS.length]}px)` }}>
                  {atual && (
                    <img
                      src={foxAsset.url}
                      alt="Raposa na caixa atual"
                      width={64}
                      height={64}
                      className={cn("absolute -top-12 left-1/2 h-16 w-16 -translate-x-1/2 object-contain", pulouHoje && "fox-jump")}
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
                    {feito ? <Check className="h-6 w-6" /> : ultimo ? <Trophy className="h-6 w-6" /> : atual ? <span className="font-bold">{idx + 1}</span> : <Lock className="h-5 w-5" />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
