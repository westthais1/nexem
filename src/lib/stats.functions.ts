import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { areaOfMateria, type AreaKey } from "./stats-areas";

export type AreaStat = { key: AreaKey; total: number; acertos: number; pct: number | null };

export type StudentStats = {
  questoesResolvidas: number;
  areas: AreaStat[];
  redacoesCorrigidas: number;
  mediaRedacoes: number | null;
  provasFeitas: number;
  ultimaProva: { nome: string; nota: number; acertos: number; total: number; data: string } | null;
  diasDeEstudo: number;
  notaAlvo: number | null;
};

const AREA_KEYS: AreaKey[] = ["matematica", "natureza", "linguagens", "humanas"];

export const getStudentStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentStats> => {
    const { supabase, userId } = context;
    const [attempts, essays, exams, days, sp, prof] = await Promise.all([
      supabase.from("enem_user_attempts").select("materia_questao,foi_correto,created_at").eq("user_id", userId),
      supabase.from("enem_essays").select("nota_total,created_at").eq("user_id", userId),
      supabase.from("enem_exam_attempts").select("nome_prova,nota,acertos,total_questoes,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("study_activity_days").select("day").eq("user_id", userId),
      supabase.from("student_profiles").select("answers").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("target_score").eq("id", userId).maybeSingle(),
    ]);
    const err = attempts.error ?? essays.error ?? exams.error;
    if (err) throw new Error("Não foi possível carregar suas estatísticas.");

    const att = attempts.data ?? [];
    const areas: AreaStat[] = AREA_KEYS.map((key) => {
      const list = att.filter((a) => areaOfMateria(a.materia_questao) === key);
      const acertos = list.filter((a) => a.foi_correto).length;
      return { key, total: list.length, acertos, pct: list.length ? Math.round((acertos / list.length) * 100) : null };
    });

    const es = essays.data ?? [];
    const ex = exams.data ?? [];
    const daySet = new Set<string>();
    const sp_day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    for (const a of att) daySet.add(sp_day(a.created_at));
    for (const e of es) daySet.add(sp_day(e.created_at));
    for (const e of ex) daySet.add(sp_day(e.created_at));
    for (const d of days.data ?? []) daySet.add(d.day);

    const answers = (sp.data?.answers ?? {}) as Record<string, unknown>;
    const alvo = typeof answers["targetScore"] === "number" ? (answers["targetScore"] as number) : prof.data?.target_score ?? null;
    const last = ex[0];

    return {
      questoesResolvidas: att.length,
      areas,
      redacoesCorrigidas: es.length,
      mediaRedacoes: es.length ? Math.round(es.reduce((s, e) => s + e.nota_total, 0) / es.length) : null,
      provasFeitas: ex.length,
      ultimaProva: last ? { nome: last.nome_prova, nota: last.nota, acertos: last.acertos, total: last.total_questoes, data: last.created_at } : null,
      diasDeEstudo: daySet.size,
      notaAlvo: alvo,
    };
  });
