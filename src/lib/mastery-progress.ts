/**
 * Progresso dos Níveis de Maestria ("Treine com Tutor Nex"), por conta de usuário.
 * Cada estudante começa em ZERO em todas as 15 matérias; o progresso fica salvo
 * na conta (tabela public.mastery_progress), não no navegador.
 */

import { supabase } from "@/integrations/supabase/client";

export type SubjectProgress = {
  theta: number;
  respondidas: number;
  acertos: number;
};

export type MasteryProgress = {
  /** Vazio para um estudante novo — tudo começa em zero. */
  bySubject: Record<string, SubjectProgress>;
  totalRespondidas: number;
  userId: string | null;
};

export const EMPTY_SUBJECT: SubjectProgress = { theta: 0, respondidas: 0, acertos: 0 };

export const MASTERY_QUERY_KEY = ["mastery_progress"] as const;

export function subjectProgress(p: MasteryProgress | null, slug: string): SubjectProgress {
  return p?.bySubject[slug] ?? EMPTY_SUBJECT;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMasteryProgress(): Promise<MasteryProgress> {
  const userId = await currentUserId();
  if (!userId) return { bySubject: {}, totalRespondidas: 0, userId: null };

  const { data, error } = await supabase
    .from("mastery_progress")
    .select("subject_slug, theta, respondidas, acertos")
    .eq("user_id", userId);

  if (error) throw new Error(`Erro ao carregar seu progresso de maestria: ${error.message}`);

  const bySubject: Record<string, SubjectProgress> = {};
  let totalRespondidas = 0;
  for (const row of data ?? []) {
    bySubject[row.subject_slug] = {
      theta: Number(row.theta) || 0,
      respondidas: Number(row.respondidas) || 0,
      acertos: Number(row.acertos) || 0,
    };
    totalRespondidas += Number(row.respondidas) || 0;
  }
  return { bySubject, totalRespondidas, userId };
}

/** Grava o resultado de um bloco de treino na conta do estudante. */
export async function saveSubjectProgress(input: {
  slug: string;
  theta: number;
  respondidas: number;
  acertos: number;
  atual: SubjectProgress;
}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Entre na sua conta para salvar seu progresso.");

  const { error } = await supabase.from("mastery_progress").upsert(
    {
      user_id: userId,
      subject_slug: input.slug,
      theta: input.theta,
      respondidas: input.atual.respondidas + input.respondidas,
      acertos: input.atual.acertos + input.acertos,
    },
    { onConflict: "user_id,subject_slug" },
  );

  if (error) throw new Error(`Erro ao salvar seu progresso: ${error.message}`);
}
