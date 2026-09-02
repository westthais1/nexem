import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Question = {
  id: string;
  area: string;
  topic: string;
  statement: string;
  options: string[];
};

const Input = z.object({
  area: z.string().optional(),
});

/**
 * Fetches a single random question from the public `enem_tutor` table.
 * Public read-only: uses the publishable (anon) key. Only safe columns are
 * projected — `alternativa_correta` is never returned to the client.
 */
export const getRandomQuestion = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      },
    );

    let query = supabase
      .from("enem_tutor")
      .select("id, area, topic, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e");

    if (data.area && data.area !== "Todas") {
      query = query.eq("area", data.area);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Falha ao buscar questão: ${error.message}`);
    if (!rows || rows.length === 0) return null;

    const row = rows[Math.floor(Math.random() * rows.length)]!;
    return {
      id: row.id,
      area: row.area,
      topic: row.topic,
      statement: row.enunciado,
      options: [row.opcao_a, row.opcao_b, row.opcao_c, row.opcao_d, row.opcao_e],
    } satisfies Question;
  });
