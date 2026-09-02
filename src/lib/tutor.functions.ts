import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TutorInput = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  area: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(30),
});

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TutorInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const system = [
      "Você é um tutor socrático para estudantes do ENEM.",
      "NUNCA revele a alternativa correta, nem diga qual letra eliminar como resposta final.",
      "Dê apenas dicas, perguntas orientadoras e lembretes de conceito, um passo por vez.",
      "Se o aluno insistir pela resposta, recuse gentilmente e ofereça mais uma pista.",
      "Responda em português do Brasil, em no máximo 4 frases curtas, tom acolhedor.",
      `Área: ${data.area}`,
      `Questão: ${data.question}`,
      `Alternativas: ${data.options.map((o, i) => `${"ABCDE"[i]}) ${o}`).join(" | ")}`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Muitas perguntas seguidas. Aguarde alguns segundos e tente novamente.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no Lovable para continuar.");
      throw new Error(`Falha ao consultar o tutor (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    return { content: content || "Não consegui formular uma dica agora. Tente reformular sua dúvida." };
  });
