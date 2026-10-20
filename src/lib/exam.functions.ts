import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const examAttemptSchema = z.object({
  nome_prova: z.string().min(1),
  respostas: z.record(z.string(), z.string()),
  acertos: z.number().int().min(0),
  total_questoes: z.number().int().min(0),
  nota: z.number().int().min(0),
  tempo_gasto_segundos: z.number().int().min(0),
  finalizado_por_tempo: z.boolean(),
});

/** Salva o resultado de uma prova completa, separado das tentativas de treino. */
export const registrarProva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => examAttemptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requirePremium } = await import('./subscription.server');
    await requirePremium(context.supabase, context.userId);

    const { error } = await context.supabase.from("enem_exam_attempts").insert({
      user_id: context.userId,
      nome_prova: data.nome_prova,
      respostas: data.respostas,
      acertos: data.acertos,
      total_questoes: data.total_questoes,
      nota: data.nota,
      tempo_gasto_segundos: data.tempo_gasto_segundos,
      finalizado_por_tempo: data.finalizado_por_tempo,
    });

    if (error) {
      console.error("[Prova] Falha ao salvar resultado", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });
