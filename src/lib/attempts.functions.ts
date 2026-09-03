import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const attemptSchema = z.object({
  question_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  dificuldade_questao: z.string().nullable().optional(),
  materia_questao: z.string().nullable().optional(),
  foi_correto: z.boolean(),
});

export const registrarTentativa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => attemptSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("enem_user_attempts").insert({
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
