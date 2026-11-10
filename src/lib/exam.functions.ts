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
  por_area: z
    .record(
      z.enum(["matematica", "natureza", "linguagens", "humanas"]),
      z.object({ acertos: z.number().int().min(0), total: z.number().int().min(0), nota: z.number().int().min(0).max(1000) }),
    )
    .optional(),
});

/** Salva o resultado de uma prova completa, separado das tentativas de treino. */
export const registrarProva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => examAttemptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requirePremium } = await import('./subscription.server');
    await requirePremium(context.supabase, context.userId);

    const { data: saved, error } = await context.supabase.from("enem_exam_attempts").insert({
      user_id: context.userId,
      nome_prova: data.nome_prova,
      respostas: data.respostas,
      acertos: data.acertos,
      total_questoes: data.total_questoes,
      nota: data.nota,
      tempo_gasto_segundos: data.tempo_gasto_segundos,
      finalizado_por_tempo: data.finalizado_por_tempo,
      por_area: data.por_area ?? null,
    }).select('id').single();

    if (error) {
      console.error("[Prova] Falha ao salvar resultado", error);
      return { ok: false as const, error: error.message };
    }
    if (saved) {
      const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
      const {error: rewardError} = await supabaseAdmin.rpc('reward_student_once',{p_user:context.userId,p_key:`exam:${saved.id}`,p_kind:'provaCompleta',p_xp:100,p_label:`Prova Completa · ${data.nome_prova}`});
      if (rewardError) console.error('[Prova] Falha ao registrar recompensa',rewardError);
    }
    return { ok: true as const };
  });
