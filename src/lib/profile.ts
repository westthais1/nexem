/**
 * Perfil do estudante (public.profiles no backend do app).
 * Criado automaticamente por trigger no cadastro; aqui garantimos a linha
 * também para contas antigas e marcamos quando o aluno já entrou no app.
 */

import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type ProfileState = {
  /** true quando é a primeira entrada do estudante (ainda não fez o primeiro desafio). */
  isNew: boolean;
  displayName: string;
  quizCompletedAt: string | null;
};

function nameOf(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | null;
  const full = (meta?.["full_name"] ?? meta?.["name"]) as string | undefined;
  return full?.trim() || (user.email ?? "").split("@")[0] || "Estudante";
}

/** Garante a linha de perfil e informa se o estudante é novo. */
export async function ensureProfile(user: User): Promise<ProfileState> {
  const displayName = nameOf(user);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, onboarded_at, display_name, quiz_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? null, display_name: displayName });
    if (insertError) throw insertError;
    return { isNew: true, displayName, quizCompletedAt: null };
  }

  return { isNew: data.onboarded_at === null, displayName: data.display_name ?? displayName, quizCompletedAt: data.quiz_completed_at };
}

/** Marca que o estudante já foi levado ao primeiro desafio. */
export async function markOnboarded(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", userId)
    .is("onboarded_at", null);
}
