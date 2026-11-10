import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";
import { SnakePath, type SnakeNode } from "@/components/SnakePath";

import foxAsset from "@/assets/daily/fox.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { BOXES_PER_LEVEL, PATH_LEVELS, PATH_TOTAL, levelOf } from "@/lib/daily-path";
import { cn } from "@/lib/utils";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";

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


/** Mostra apenas o nível atual da trilha: a raposa pula caixas conforme os acertos do Desafio Diário. */
export function DailyFoxPath({ className }: { className?: string }) {
  const navigate = useNavigate();
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
  const [festa, setFesta] = useState(false);
  useEffect(() => {
    if (!nivelCompleto) return;
    const key = `nexem-levelup-${box}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    setFesta(true);
  }, [nivelCompleto, box]);

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

      <SnakePath
        className="mt-8"
        nodes={Array.from({ length: BOXES_PER_LEVEL }).map((_, bi): SnakeNode => {
          const idx = base + bi;
          const feito = idx < box;
          const atual = idx === foxAt && !concluido;
          const ultimo = bi === BOXES_PER_LEVEL - 1;
          return {
            key: idx,
            title: ultimo ? "Fim do nível" : `Caixa ${bi + 1}`,
            subtitle: feito ? "Concluída" : atual ? "Fazer o Desafio Diário" : "Bloqueada",
            state: feito ? "done" : atual ? "active" : "locked",
            icon: ultimo ? <Trophy /> : <img src={foxAsset.url} alt="" className={cn("h-12 w-12 object-contain", pulouHoje ? "fox-jump" : "fox-idle")} />,
            onClick: () => navigate({ to: "/desafio" }),
          };
        })}
      />

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
      <LevelUpCelebration open={festa} level={PATH_LEVELS[nivel] ?? "Novo nível"} onClose={() => setFesta(false)} confetti={false} />
    </section>
  );
}
