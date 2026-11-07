import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AreaProgressDto = {
  tracks: { matematica: number; linguagens: number; humanas: number; natureza: number };
  lastPlayedDate: string | null;
  triConsistencyRate: number;
  created: boolean;
};

const clamp = (v: unknown, d = 50) => Math.min(100, Math.max(1, Math.round(Number(v) || d)));

/**
 * Garante a linha de níveis por área do estudante neste banco.
 * Ordem: linha existente → importação única do projeto externo (pelo id da conta) → estimativa do onboarding.
 */
export const ensureAreaProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AreaProgressDto> => {
    const { supabase, userId } = context;
    const { onboardingAnswersSchema, refinedLevels } = await import("./student-onboarding");

    const { data: sp } = await supabase
      .from("student_profiles").select("answers,onboarding_completed").eq("user_id", userId).maybeSingle();
    let onboardingTracks: AreaProgressDto["tracks"] | null = null;
    if (sp?.onboarding_completed) {
      const levels = refinedLevels(onboardingAnswersSchema.parse(sp.answers ?? {}));
      const t = (k: keyof typeof levels) => clamp(20 + ((levels[k] ?? 3) - 1) * 15);
      onboardingTracks = { matematica: t("matematica"), linguagens: t("linguagens"), humanas: t("humanas"), natureza: t("natureza") };
    }

    let { data: row } = await supabase.from("student_area_progress").select("*").eq("user_id", userId).maybeSingle();
    let created = false;

    if (!row) {
      let insert = {
        user_id: userId,
        theta_matematica: onboardingTracks?.matematica ?? 50,
        theta_linguagens: onboardingTracks?.linguagens ?? 50,
        theta_humanas: onboardingTracks?.humanas ?? 50,
        theta_natureza: onboardingTracks?.natureza ?? 50,
        last_played_date: null as string | null,
        tri_consistency_rate: 100,
        source: "onboarding",
      };
      try {
        const { questionsSupabase } = await import("./external-supabase");
        const { data: ext } = await questionsSupabase
          .from("nexem_user_progress").select("*").eq("user_id", userId).maybeSingle();
        if (ext) {
          insert = {
            ...insert,
            theta_matematica: clamp(ext.theta_matematica),
            theta_linguagens: clamp(ext.theta_linguagens),
            theta_humanas: clamp(ext.theta_humanas),
            theta_natureza: clamp(ext.theta_natureza),
            last_played_date: ext.last_played_date ?? null,
            tri_consistency_rate: Number(ext.tri_consistency_rate ?? 100),
            source: "external_import",
          };
        } else created = true;
      } catch (e) {
        console.error("[Progresso] Importação externa indisponível", e);
        created = true;
      }
      const { data: ins, error } = await supabase
        .from("student_area_progress").upsert(insert, { onConflict: "user_id", ignoreDuplicates: true }).select("*").maybeSingle();
      if (error) throw new Error("Não foi possível criar seu progresso.");
      row = ins ?? (await supabase.from("student_area_progress").select("*").eq("user_id", userId).maybeSingle()).data;
    }
    if (!row) throw new Error("Não foi possível carregar seu progresso.");

    let tracks = {
      matematica: clamp(row.theta_matematica),
      linguagens: clamp(row.theta_linguagens),
      humanas: clamp(row.theta_humanas),
      natureza: clamp(row.theta_natureza),
    };
    // Onboarding é só a estimativa inicial; desafios concluídos continuam valendo.
    if (!row.last_played_date && onboardingTracks) tracks = onboardingTracks;

    return { tracks, lastPlayedDate: row.last_played_date, triConsistencyRate: Number(row.tri_consistency_rate), created };
  });
