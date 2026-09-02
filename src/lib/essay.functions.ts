import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EssayInput = z.object({
  tema: z.string().min(1),
  texto: z.string().min(200),
});

const SYSTEM_PROMPT =
  "Você é uma inteligência artificial corretora oficial da Redação do ENEM. Avalie o texto fornecido pelo estudante de forma extremamente criteriosa, separando a nota de 0 a 200 para cada uma das 5 Competências oficiais do ENEM (C1: Norma culta, C2: Compreensão do tema, C3: Defesa de ponto de vista, C4: Mecanismos coesivos, C5: Proposta de intervenção). Retorne uma resposta estruturada contendo as notas individuais, a nota total somada (máximo 1000) e 3 dicas muito práticas e encorajadoras em português de como melhorar.";

const CorrectionSchema = z.object({
  c1: z.number(),
  c2: z.number(),
  c3: z.number(),
  c4: z.number(),
  c5: z.number(),
  nota_total: z.number(),
  dicas: z
    .union([z.array(z.string()), z.string()])
    .transform((v) =>
      Array.isArray(v)
        ? v
        : v
            .split(/\n+|(?:^|\s)\d\.\s|(?:^|\s)[-•]\s/)
            .map((s) => s.trim())
            .filter(Boolean),
    )
    .pipe(z.array(z.string()).min(1)),
  comentario: z.string().optional().default(""),
});

export type EssayCorrection = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  nota_total: number;
  dicas: string[];
  comentario: string;
};

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EssayInput.parse(input))
  .handler(async ({ data }): Promise<EssayCorrection> => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("Chave da Anthropic não configurada.");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tool_choice: { type: "tool", name: "registrar_correcao" },
        tools: [
          {
            name: "registrar_correcao",
            description: "Registra a correção da redação do ENEM.",
            input_schema: {
              type: "object",
              properties: {
                c1: { type: "integer", description: "Nota da Competência 1 (0 a 200)" },
                c2: { type: "integer", description: "Nota da Competência 2 (0 a 200)" },
                c3: { type: "integer", description: "Nota da Competência 3 (0 a 200)" },
                c4: { type: "integer", description: "Nota da Competência 4 (0 a 200)" },
                c5: { type: "integer", description: "Nota da Competência 5 (0 a 200)" },
                nota_total: { type: "integer", description: "Soma das 5 competências (0 a 1000)" },
                dicas: {
                  type: "array",
                  items: { type: "string" },
                  description: "Exatamente 3 dicas práticas e encorajadoras em português",
                },
                comentario: {
                  type: "string",
                  description: "Comentário geral curto sobre a redação, em português",
                },
              },
              required: ["c1", "c2", "c3", "c4", "c5", "nota_total", "dicas", "comentario"],
            },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Tema da redação: ${data.tema}\n\nTexto do estudante:\n"""\n${data.texto}\n"""`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Muitas correções seguidas. Aguarde alguns segundos e tente novamente.");
      if (res.status === 401) throw new Error("Chave da Anthropic inválida.");
      if (text.includes("credit balance is too low"))
        throw new Error(
          "A conta da Anthropic está sem créditos. Adicione créditos em Plans & Billing para liberar a correção.",
        );
      throw new Error(`Falha ao corrigir a redação (${res.status}): ${text.slice(0, 200)}`);

    }

    const json = (await res.json()) as {
      content?: Array<{ type: string; name?: string; input?: unknown }>;
    };
    const toolUse = json.content?.find((b) => b.type === "tool_use");
    if (!toolUse?.input) throw new Error("A IA não retornou uma correção estruturada.");

    const parsed = CorrectionSchema.parse(toolUse.input);
    const clamp = (n: number) => Math.max(0, Math.min(200, Math.round(n)));
    const correction: EssayCorrection = {
      c1: clamp(parsed.c1),
      c2: clamp(parsed.c2),
      c3: clamp(parsed.c3),
      c4: clamp(parsed.c4),
      c5: clamp(parsed.c5),
      nota_total: 0,
      dicas: parsed.dicas.slice(0, 3),
      comentario: parsed.comentario ?? "",
    };
    correction.nota_total =
      correction.c1 + correction.c2 + correction.c3 + correction.c4 + correction.c5;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("enem_essays").insert({
        tema: data.tema,
        texto: data.texto,
        c1: correction.c1,
        c2: correction.c2,
        c3: correction.c3,
        c4: correction.c4,
        c5: correction.c5,
        nota_total: correction.nota_total,
        feedback: correction.dicas,
        comentario: correction.comentario,
      });
    } catch (err) {
      console.error("[Redação] Falha ao salvar correção:", err);
    }

    return correction;
  });
