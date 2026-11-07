import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const attemptSchema = z.object({
  question_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  dificuldade_questao: z.string().nullable().optional(),
  materia_questao: z.string().nullable().optional(),
  foi_correto: z.boolean(),
});

export const registrarTentativa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => attemptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("enem_user_attempts").insert({
      user_id: context.userId,
      question_id: data.question_id,
      dificuldade_questao: data.dificuldade_questao ?? null,
      materia_questao: data.materia_questao ?? null,
      foi_correto: data.foi_correto,
    });

    if (error) {
      console.error("[Tentativas] Falha ao salvar tentativa", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

/** Conta quantas questões o estudante respondeu hoje (missão diária). */
export const contarTentativasHoje = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await context.supabase
      .from("enem_user_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      console.error("[Tentativas] Falha ao contar tentativas do dia", error);
      return { total: 0 };
    }
    return { total: count ?? 0 };
  });
