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
  /** Última nota por área (somente provas salvas com detalhe por área). */
  ultimaPorArea: Partial<Record<AreaKey, { nota: number; acertos: number; total: number; data: string }>>;
  competencias: { c1: number; c2: number; c3: number; c4: number; c5: number } | null;
  redacoesSerie: { data: string; nota: number }[];
  xp: { totalXp: number; streak: number; bestStreak: number };
};

const AREA_KEYS: AreaKey[] = ["matematica", "natureza", "linguagens", "humanas"];

export const getStudentStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentStats> => {
    const { supabase, userId } = context;
    const [attempts, essays, exams, days, sp, prof, xpRow] = await Promise.all([
      supabase.from("enem_user_attempts").select("materia_questao,foi_correto,created_at").eq("user_id", userId),
      supabase.from("enem_essays").select("nota_total,c1,c2,c3,c4,c5,created_at").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("enem_exam_attempts").select("nome_prova,nota,acertos,total_questoes,created_at,por_area").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("study_activity_days").select("day").eq("user_id", userId),
      supabase.from("student_profiles").select("answers").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("target_score").eq("id", userId).maybeSingle(),
      supabase.from("student_xp").select("total_xp,streak,best_streak,last_active_day,streak_shields").eq("user_id", userId).maybeSingle(),
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

    const ultimaPorArea: StudentStats["ultimaPorArea"] = {};
    for (const e of ex) {
      const pa = e.por_area as Record<string, { nota: number; acertos: number; total: number }> | null;
      if (!pa) continue;
      for (const k of AREA_KEYS) {
        const v = pa[k];
        if (v && !ultimaPorArea[k]) ultimaPorArea[k] = { nota: v.nota, acertos: v.acertos, total: v.total, data: e.created_at };
      }
    }
    const avg = (k: "c1" | "c2" | "c3" | "c4" | "c5") => Math.round(es.reduce((s, e) => s + (e[k] ?? 0), 0) / es.length);
    const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const x = xpRow.data;
    const beforeYesterday = new Date(Date.now()-2*86_400_000).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
    const alive = Boolean(x?.last_active_day && (x.last_active_day >= yesterday || (x.last_active_day===beforeYesterday && x.streak_shields>0)));

    return {
      questoesResolvidas: att.length,
      areas,
      redacoesCorrigidas: es.length,
      mediaRedacoes: es.length ? Math.round(es.reduce((s, e) => s + e.nota_total, 0) / es.length) : null,
      provasFeitas: ex.length,
      ultimaProva: last ? { nome: last.nome_prova, nota: last.nota, acertos: last.acertos, total: last.total_questoes, data: last.created_at } : null,
      diasDeEstudo: daySet.size,
      notaAlvo: alvo,
      ultimaPorArea,
      competencias: es.length ? { c1: avg("c1"), c2: avg("c2"), c3: avg("c3"), c4: avg("c4"), c5: avg("c5") } : null,
      redacoesSerie: es.slice(-12).map((e) => ({ data: e.created_at, nota: e.nota_total })),
      xp: { totalXp: x?.total_xp ?? 0, streak: alive ? x?.streak ?? 0 : 0, bestStreak: x?.best_streak ?? 0 },
    };
  });

export type DashboardData = {
  schedule: import("./next-steps").PlanDay[] | null;
  notaAlvo: number | null;
  desafioFeitoHoje: boolean;
  ultimaAtividade: { kind: string; label: string | null; subject: string | null; data: string } | null;
  areaMaisFraca: { key: AreaKey; pct: number; total: number } | null;
  /** Até duas matérias mais fracas (slug do Treine com Tutor Nex) a partir das tentativas do próprio estudante. */
  materiasFracas: { slug: string; label: string; pct: number }[];
  ultimaRedacao: { id: string; tema: string; nota: number; data: string } | null;
  ultimoMaterial: { id: string; title: string; data: string } | null;
};

/** Dados reais para os próximos passos (painel, Raio-X, perfil). Somente leitura e do próprio estudante. */
export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;
    const { pickWeakest, pickWeakestN } = await import("./next-steps");
    const { subjectOf } = await import("./mastery");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const [sp, prof, ev, desafio, att, essay, mat] = await Promise.all([
      supabase.from("student_profiles").select("answers,schedule").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("target_score").eq("id", userId).maybeSingle(),
      supabase.from("student_activity_events").select("kind,label,subject,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("student_activity_events").select("created_at").eq("user_id", userId).eq("kind", "desafioDiario").order("created_at", { ascending: false }).limit(1),
      supabase.from("enem_user_attempts").select("materia_questao,foi_correto").eq("user_id", userId).order("created_at", { ascending: false }).limit(1000),
      supabase.from("enem_essays").select("id,tema,nota_total,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("study_materials").select("id,title,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);
    const answers = (sp.data?.answers ?? {}) as Record<string, unknown>;
    const lastDesafio = desafio.data?.[0]?.created_at;
    const rows = att.data ?? [];
    const areaTallies = AREA_KEYS.map((key) => {
      const l = rows.filter((a) => areaOfMateria(a.materia_questao) === key);
      return { key, total: l.length, acertos: l.filter((a) => a.foi_correto).length };
    });
    const weakArea = pickWeakest(areaTallies);
    const bySubject = new Map<string, { key: string; label: string; total: number; acertos: number }>();
    for (const a of rows) {
      const s = subjectOf(a.materia_questao, null);
      if (!s) continue;
      const t = bySubject.get(s.slug) ?? { key: s.slug, label: s.label, total: 0, acertos: 0 };
      t.total++;
      if (a.foi_correto) t.acertos++;
      bySubject.set(s.slug, t);
    }
    const e = essay.data?.[0];
    const m = mat.data?.[0];
    const last = ev.data?.[0];
    return {
      schedule: (sp.data?.schedule as DashboardData["schedule"]) ?? null,
      notaAlvo: typeof answers["targetScore"] === "number" ? (answers["targetScore"] as number) : prof.data?.target_score ?? null,
      desafioFeitoHoje: !!lastDesafio && new Date(lastDesafio).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) === today,
      ultimaAtividade: last ? { kind: last.kind, label: last.label, subject: last.subject, data: last.created_at } : null,
      areaMaisFraca: weakArea ? { key: weakArea.key as AreaKey, total: weakArea.total, pct: Math.round((weakArea.acertos / weakArea.total) * 100) } : null,
      materiasFracas: pickWeakestN([...bySubject.values()], 2).map((s) => ({ slug: s.key, label: s.label, pct: Math.round((s.acertos / s.total) * 100) })),
      ultimaRedacao: e ? { id: e.id, tema: e.tema, nota: e.nota_total, data: e.created_at } : null,
      ultimoMaterial: m ? { id: m.id, title: m.title, data: m.created_at } : null,
    };
  });
