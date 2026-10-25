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
        ? { type: "text", text: `Material (${data.fileName}):\n\n${data.content.slice(0, 120_000)}` }
        : data.kind === "pdf"
          ? { type: "file", file: { filename: data.fileName, file_data: `data:application/pdf;base64,${data.content}` } }
          : { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.content}` } };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [{ type: "text", text: "Gere o JSON de estudo para este material." }, part] },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[Materiais] Falha da IA", res.status, text.slice(0, 300));
      if (res.status === 429) throw new Error("Muitos arquivos seguidos. Aguarde alguns segundos e tente de novo.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no momento.");
      if (res.status === 400) throw new Error("Não conseguimos ler este arquivo. Tente outro formato.");
      throw new Error("Não conseguimos processar o arquivo agora. Tente novamente.");
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const study = parseStudyJson(json.choices?.[0]?.message?.content ?? "");
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
