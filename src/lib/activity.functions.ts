import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** XP máximo aceito por tipo de atividade (os valores reais vêm de XP_REWARDS no navegador). */
const MAX_XP: Record<string, number> = {
  questao: 10,
  simuladoAdaptativo: 25,
  redacao: 50,
  desafioDiario: 150,
  provaCompleta: 100,
  materialEtapa: 30,
  blocoMaestria: 0,
};

const attemptSchema = z.object({
  question_id: z.union([z.string(), z.number()]).transform((v) => String(v).slice(0, 200)),
  dificuldade_questao: z.string().max(40).nullable().optional(),
  materia_questao: z.string().max(120).nullable().optional(),
  foi_correto: z.boolean(),
});

const trackValue = z.number().int().min(1).max(100);
const progressSchema = z.object({
  tracks: z.object({ matematica: trackValue, linguagens: trackValue, humanas: trackValue, natureza: trackValue }),
  lastPlayedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  triConsistencyRate: z.number().min(0).max(100),
});

const activitySchema = z.object({
  kind: z.enum(Object.keys(MAX_XP) as [string, ...string[]]),
  xp: z.number().int().min(0).max(300).default(0),
  label: z.string().max(200).optional(),
  subject: z.string().max(120).optional(),
  attempts: z.array(attemptSchema).max(60).optional(),
  progress: progressSchema.optional(),
});

export type XpSnapshot = {
  userId: string;
  totalXp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  lastActivity: string | null;
  history: string[];
};

type XpRow = { total_xp: number; streak: number; best_streak: number; last_active_day: string | null; last_activity: string | null } | null;

function spDay(offset = 0): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function snapshot(supabase: any, userId: string, row: XpRow): Promise<XpSnapshot> {
  const { data: days } = await supabase
    .from("study_activity_days").select("day").eq("user_id", userId)
    .order("day", { ascending: false }).limit(60);
  const last = row?.last_active_day ?? null;
  // A sequência só continua viva se a última atividade foi hoje ou ontem.
  const alive = last !== null && last >= spDay(-1);
  return {
    userId,
    totalXp: row?.total_xp ?? 0,
    streak: alive ? row?.streak ?? 0 : 0,
    bestStreak: row?.best_streak ?? 0,
    lastActiveDay: last,
    lastActivity: row?.last_activity ?? null,
    history: ((days ?? []) as { day: string }[]).map((d) => d.day).reverse(),
  };
}

/** Ponto único para registrar qualquer atividade concluída pelo estudante. */
export const recordActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => activitySchema.parse(input))
  .handler(async ({ data, context }): Promise<XpSnapshot> => {
    const { supabase, userId } = context;

    if (data.attempts?.length) {
      const { error } = await supabase.from("enem_user_attempts").insert(
        data.attempts.map((a) => ({
          user_id: userId,
          question_id: a.question_id,
          dificuldade_questao: a.dificuldade_questao ?? null,
          materia_questao: a.materia_questao ?? null,
          foi_correto: a.foi_correto,
        })),
      );
      if (error) console.error("[Atividade] Falha ao salvar tentativas", error);
    }

    if (data.progress) {
      const p = data.progress;
      const { error } = await supabase.from("student_area_progress").upsert(
        {
          user_id: userId,
          theta_matematica: p.tracks.matematica,
          theta_linguagens: p.tracks.linguagens,
          theta_humanas: p.tracks.humanas,
          theta_natureza: p.tracks.natureza,
          last_played_date: p.lastPlayedDate,
          tri_consistency_rate: p.triConsistencyRate,
        },
        { onConflict: "user_id" },
      );
      if (error) console.error("[Atividade] Falha ao salvar progresso por área", error);
    }

    const xp = Math.min(data.xp, MAX_XP[data.kind] ?? 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("record_activity", {
      p_user: userId,
      p_kind: data.kind,
      p_xp: xp,
      p_label: data.label ?? "",
      p_subject: data.subject ?? "",
    });
    if (error) {
      console.error("[Atividade] Falha ao registrar atividade", error);
      throw new Error("Não foi possível salvar sua atividade.");
    }
    return snapshot(supabase, userId, row as XpRow);
  });

const browserSchema = z.object({
  totalXp: z.number().int().min(0).max(1_000_000),
  streak: z.number().int().min(0).max(5000),
  bestStreak: z.number().int().min(0).max(5000),
  lastActiveDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  lastActivity: z.string().max(200).nullable(),
  history: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
});

/** Lê o XP salvo na conta; na primeira vez, importa os valores do navegador (nunca diminui). */
export const getXpState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ browser: browserSchema.nullable().optional() }).parse(input ?? {}))
  .handler(async ({ data, context }): Promise<XpSnapshot> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("student_xp")
      .select("total_xp,streak,best_streak,last_active_day,last_activity,browser_imported_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (data.browser && !row?.browser_imported_at) {
      const b = data.browser;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: imported, error } = await supabaseAdmin.rpc("import_browser_xp", {
        p_user: userId,
        p_total: b.totalXp,
        p_streak: b.streak,
        p_best: b.bestStreak,
        p_last_day: b.lastActiveDay ?? undefined,
        p_last_activity: b.lastActivity ?? undefined,
        p_days: b.history,
      });
      if (!error) return snapshot(supabase, userId, imported as XpRow);
      console.error("[XP] Falha ao importar dados do navegador", error);
    }
    return snapshot(supabase, userId, row as XpRow);
  });
