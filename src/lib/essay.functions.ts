import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EssayInput = z
  .object({
    tema: z.string().min(1),
    texto: z.string().default(""),
    imagem_path: z.string().optional(),
  })
  .refine((v) => v.imagem_path || v.texto.trim().length >= 200, {
    message: "Envie uma foto da redação ou escreva ao menos 200 caracteres.",
  });

const SYSTEM_PROMPT =
  "Você é uma inteligência artificial especialista na correção oficial da Redação do ENEM e possui visão computacional de alta fidelidade. Transcreva mentalmente a redação escrita à mão presente nesta imagem (mesmo que a caligrafia seja desafiadora). Em seguida, avalie o texto de forma extremamente criteriosa de 0 a 200 para cada uma das 5 Competências oficiais do ENEM. Retorne um resultado estruturado contendo a nota de cada competência, a nota final somada, a transcrição completa do texto lido para o aluno conferir, e 3 dicas práticas em português explicando como melhorar a estrutura textual para tirar nota 1000.";

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
  transcricao: z.string().optional().default(""),
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
  transcricao: string;
  comentario: string;
};


export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EssayInput.parse(input))
  .handler(async ({ data }): Promise<EssayCorrection> => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("Chave da Anthropic não configurada.");

    // Se houver foto da folha manuscrita, gera uma URL hospedada no Supabase e
    // envia o link direto para a visão computacional do Claude.
    let imageBlock:
      | { type: "image"; source: { type: "url"; url: string } }
      | null = null;
    if (data.imagem_path) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from("redacao-fotos")
        .createSignedUrl(data.imagem_path, 60 * 30);
      if (error || !signed?.signedUrl)
        throw new Error("Não foi possível ler a foto da redação enviada.");
      imageBlock = { type: "image", source: { type: "url", url: signed.signedUrl } };
    }



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
                transcricao: {
                  type: "string",
                  description:
                    "Transcrição completa e fiel do texto manuscrito lido na imagem, para o aluno conferir",
                },
                comentario: {
                  type: "string",
                  description: "Comentário geral curto sobre a redação, em português",
                },
              },
              required: [
                "c1",
                "c2",
                "c3",
                "c4",
                "c5",
                "nota_total",
                "dicas",
                "transcricao",
                "comentario",
              ],

            },
          },
        ],
        messages: [
          {
            role: "user",
            content: imageBlock
              ? [
                  imageBlock,
                  {
                    type: "text",
                    text: `Tema da redação: ${data.tema}\n\nA imagem acima é a foto da folha de redação manuscrita do estudante. Transcreva mentalmente o texto e avalie normalmente.${
                      data.texto.trim() ? `\n\nObservações do estudante:\n${data.texto.trim()}` : ""
                    }`,
                  },
                ]
              : `Tema da redação: ${data.tema}\n\nTexto do estudante:\n"""\n${data.texto}\n"""`,
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
      transcricao: parsed.transcricao ?? "",
      comentario: parsed.comentario ?? "",

    };
    correction.nota_total =
      correction.c1 + correction.c2 + correction.c3 + correction.c4 + correction.c5;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("enem_essays").insert({
        tema: data.tema,
        texto: data.texto.trim() || correction.transcricao,
        imagem_path: data.imagem_path ?? null,
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
