import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const TutorInput = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  area: z.string().min(1),
  explicacao: z.string().nullable().optional(),
  review: z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),questionId:z.string().max(200)}).optional(),
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
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TutorInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const transactionId = crypto.randomUUID();
    const { data: allowed, error: reserveError } = await context.supabase.rpc('reserve_nexem_tutor_consultation', { p_request_id: transactionId });
    if (reserveError) throw new Error('Não conseguimos verificar seu limite de consultas. Tente novamente.');
    if (!allowed) return { content: '', limitReached: true };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    try {

    // Duas matérias mais fracas do próprio estudante (apenas nomes de matérias, nada pessoal).
    let fracas: string[] = [];
    try {
      const { data: rows } = await context.supabase.from('enem_user_attempts').select('materia_questao,foi_correto').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(500);
      const { subjectOf } = await import('./mastery');
      const { pickWeakestN } = await import('./next-steps');
      const map = new Map<string, { key: string; total: number; acertos: number }>();
      for (const r of rows ?? []) {
        const s = subjectOf(r.materia_questao, null);
        if (!s) continue;
        const t = map.get(s.label) ?? { key: s.label, total: 0, acertos: 0 };
        t.total++;
        if (r.foi_correto) t.acertos++;
        map.set(s.label, t);
      }
      fracas = pickWeakestN([...map.values()].filter((t) => t.total >= 3), 2).map((t) => t.key);
    } catch (e) {
      console.error('[Tutor] Falha ao ler matérias fracas', e);
    }

    const system = [
      "Você é o Nex, um tutor socrático para estudantes do ENEM.",
      "NUNCA revele a alternativa correta, nem diga qual letra eliminar como resposta final.",
      "Dê apenas dicas, perguntas orientadoras e lembretes de conceito, um passo por vez.",
      "Se o aluno insistir pela resposta, recuse gentilmente e ofereça mais uma pista.",
      "Responda em português do Brasil, em no máximo 4 frases curtas, tom acolhedor.",
      fracas.length
        ? `Matérias em que este estudante mais erra: ${fracas.join(' e ')}. Se a questão depender de um conceito dessas matérias, aponte esse conceito de base na pista (sem revelar a resposta).`
        : "",
      `Área: ${data.area}`,
      `Questão: ${data.question}`,
      `Alternativas: ${data.options.join(" | ")}`,
      data.explicacao
        ? `Explicação oficial (CONFIDENCIAL — use só para escolher o conceito-chave da pista, nunca cite nem revele a resposta): ${data.explicacao}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const convo =
      data.messages.length === 0
        ? [
            {
              role: "user" as const,
              content:
                "Comece você: me dê a primeira pista socrática específica desta questão, apontando o conceito-chave, sem entregar a resposta.",
            },
          ]
        : data.messages;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: system }, ...convo],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Muitas perguntas seguidas. Aguarde alguns segundos e tente novamente.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no Lovable para continuar.");
      console.error('[Tutor] Falha do provedor', res.status, text.slice(0, 200));
      throw new Error('Não conseguimos consultar o tutor. Tente novamente.');
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Não consegui formular uma dica agora. Tente novamente.');
    const { error: logError } = await supabaseAdmin.from('nexem_tutor_transactions').update({ status: 'succeeded', completed_at: new Date().toISOString() }).eq('id', transactionId).eq('user_id', context.userId);
    if (logError) console.error('[Tutor] Falha ao concluir transação', logError);
    if (!logError && data.review) {
      const {error} = await supabaseAdmin.rpc('review_daily_error',{p_user:context.userId,p_day:data.review.day,p_question:data.review.questionId});
      if (error) console.error('[Tutor] Falha ao registrar revisão',error);
    }
    return { content, limitReached: false };
    } catch (error) {
      const { error: logError } = await supabaseAdmin.from('nexem_tutor_transactions').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', transactionId).eq('user_id', context.userId);
      if (logError) console.error('[Tutor] Falha ao liberar consulta', logError);
      throw error;
    }
  });
