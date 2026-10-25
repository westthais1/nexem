import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readSubscription } from "./subscription.server";
import { FREE_MATERIAL_LIMIT, parseStudyJson } from "./materials";

const Input = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(120),
  kind: z.enum(["text", "pdf", "image"]),
  content: z.string().min(1).max(14_000_000),
  size: z.number().int().nonnegative(),
});

const SYSTEM = `Você é um especialista em ENEM que transforma materiais de estudo em recursos de revisão.
Leia o material enviado e responda SOMENTE com um JSON válido (sem markdown) neste formato:
{
 "title": "título curto do material",
 "bullets": ["8 a 15 tópicos concisos com fórmulas, datas, definições e conceitos-chave cobrados no ENEM"],
 "detailed": [{"heading": "Seção", "paragraphs": ["texto explicativo com **palavras-chave** em negrito"]}],
 "flashcards": [{"front": "pergunta", "back": "resposta curta"}],
 "path": [{"title": "Passo 1: Fundamentos", "description": "o que fazer", "minutes": 30, "concepts": ["conceito"], "format": "Revisar 8 flashcards"}]
}
Regras: 4 a 8 seções em "detailed"; 8 a 20 flashcards; exatamente 3 a 5 passos na trilha, progressivos (Fundamentos → Aplicação → Questões de alta frequência no ENEM), priorizando assuntos mais cobrados historicamente. Tudo em português do Brasil. Se o material não for de estudo, faça o melhor resumo possível.`;

export const processMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de IA não configurado.");

    const tier = await readSubscription(context.supabase, context.userId);
    if (tier !== "premium") {
      const { count } = await context.supabase.from("study_materials").select("id", { count: "exact", head: true }).eq("user_id", context.userId);
      if ((count ?? 0) >= FREE_MATERIAL_LIMIT) return { limitReached: true as const };
    }

    const part =
      data.kind === "text"
        ? { type: "input_text", text: `Material (${data.fileName}):\n\n${data.content.slice(0, 120_000)}` }
        : data.kind === "pdf"
          ? { type: "input_file", filename: data.fileName, file_data: `data:application/pdf;base64,${data.content}` }
          : { type: "input_image", image_url: `data:${data.mimeType};base64,${data.content}` };

    const S = (props: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
    const strArr = { type: "array", items: { type: "string" } };
    const schema = S({
      title: { type: "string" },
      bullets: strArr,
      detailed: { type: "array", items: S({ heading: { type: "string" }, paragraphs: strArr }) },
      flashcards: { type: "array", items: S({ front: { type: "string" }, back: { type: "string" } }) },
      path: { type: "array", items: S({ title: { type: "string" }, description: { type: "string" }, minutes: { type: "integer" }, concepts: strArr, format: { type: "string" } }) },
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: SYSTEM,
        text: { format: { type: "json_schema", name: "study_material", strict: true, schema } },
        input: [{ role: "user", content: [{ type: "input_text", text: "Gere o material de estudo para este arquivo." }, part] }],
      }),
    });
    if (!res.ok || !res.body) {
      const text = await res.text();
      console.error("[Materiais] Falha da IA", res.status, text.slice(0, 300));
      if (res.status === 429) throw new Error("Muitos arquivos seguidos. Aguarde alguns segundos e tente de novo.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no momento.");
      if (res.status === 400) throw new Error("Não conseguimos ler este arquivo. Tente outro formato.");
      throw new Error("Não conseguimos processar o arquivo agora. Tente novamente.");
    }
    let output = "";
    let buffer = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type?: string; delta?: string; response?: { error?: { message?: string } } };
          if (ev.type === "response.output_text.delta" && ev.delta) output += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error") throw new Error("A IA não conseguiu processar este arquivo.");
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("A IA")) throw e;
        }
      }
    }
    const study = parseStudyJson(output);
    if (!study) throw new Error("A IA não conseguiu gerar o resumo. Tente novamente.");

    const { data: row, error } = await context.supabase
      .from("study_materials")
      .insert({
        user_id: context.userId,
        file_name: data.fileName,
        file_type: data.mimeType || data.kind,
        file_size: data.size,
        title: study.title,
        bullets: study.bullets,
        detailed: JSON.stringify(study.detailed),
        flashcards: study.flashcards,
        path: study.path,
      })
      .select("id")
      .single();
    if (error) {
      if (error.message.includes("FREE_LIMIT_REACHED")) return { limitReached: true as const };
      console.error("[Materiais] Falha ao salvar", error);
      throw new Error("Não conseguimos salvar o material.");
    }
    return { limitReached: false as const, id: row.id };
  });
