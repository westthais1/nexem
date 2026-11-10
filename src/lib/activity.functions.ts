import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Rewards are server-owned; browser amounts cannot authorize XP. */
const MAX_XP: Record<string, number> = {
  questao: 10,
  simuladoAdaptativo: 25,
  redacao: 50,
  desafioDiario: 150,
  provaCompleta: 100,
  materialEtapa: 30,
  blocoMaestria: 0,
};

const attemptSchema = z.object({
  question_id: z.union([z.string(), z.number()]).transform((v) => String(v).slice(0, 200)),
  dificuldade_questao: z.string().max(40).nullable().optional(),
  materia_questao: z.string().max(120).nullable().optional(),
  foi_correto: z.boolean(),
  letra: z.enum(['A','B','C','D','E']).optional(),
});

const trackValue = z.number().int().min(1).max(100);
const progressSchema = z.object({
  tracks: z.object({ matematica: trackValue, linguagens: trackValue, humanas: trackValue, natureza: trackValue }),
  lastPlayedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  triConsistencyRate: z.number().min(0).max(100),
});

const activitySchema = z.object({
  kind: z.enum(Object.keys(MAX_XP) as [string, ...string[]]),
  xp: z.number().int().min(0).max(300).default(0),
  label: z.string().max(200).optional(),
  subject: z.string().max(120).optional(),
  attempts: z.array(attemptSchema).max(60).optional(),
  progress: progressSchema.optional(),
  material: z.object({id:z.string().uuid(),index:z.number().int().min(0).max(500),answers:z.array(z.number().int().min(0).max(4)).max(60)}).optional(),
});

export type XpSnapshot = {
  userId: string;
  totalXp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  lastActivity: string | null;
  history: string[];
};

type XpRow = { total_xp: number; streak: number; best_streak: number; last_active_day: string | null; last_activity: string | null } | null;

function spDay(offset = 0): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function snapshot(supabase: any, userId: string, row: XpRow): Promise<XpSnapshot> {
  const { data: days } = await supabase
    .from("study_activity_days").select("day").eq("user_id", userId)
    .order("day", { ascending: false }).limit(60);
  const last = row?.last_active_day ?? null;
  // A sequência só continua viva se a última atividade foi hoje ou ontem.
  const { data: protection } = await supabase.from('student_xp').select('streak_shields').eq('user_id',userId).maybeSingle();
  const alive = last !== null && (last >= spDay(-1) || (last === spDay(-2) && (protection?.streak_shields ?? 0) > 0));
  return {
    userId,
    totalXp: row?.total_xp ?? 0,
    streak: alive ? row?.streak ?? 0 : 0,
    bestStreak: row?.best_streak ?? 0,
    lastActiveDay: last,
    lastActivity: row?.last_activity ?? null,
    history: ((days ?? []) as { day: string }[]).map((d) => d.day).reverse(),
  };
}

/** Ponto único para registrar qualquer atividade concluída pelo estudante. */
export const recordActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => activitySchema.parse(input))
  .handler(async ({ data, context }): Promise<XpSnapshot> => {
    const { supabase, userId } = context;

    // These flows are now awarded where the server confirms the saved result.
    if (['desafioDiario','redacao','provaCompleta'].includes(data.kind)) {
      const { data: saved } = await supabase.from('student_xp').select('*').eq('user_id',userId).maybeSingle();
      return snapshot(supabase,userId,saved);
    }
    let trustedCorrect: boolean | null = null;
    if (data.kind==='materialEtapa') {
      if (!data.material) throw new Error('Envie as respostas da etapa do material.');
      const m=data.material;
      const {data:record,error}=await supabase.from('study_materials').select('path,step_status').eq('id',m.id).eq('user_id',userId).single();
      if (error || !record) throw new Error('Material não encontrado.');
      const {gradeMaterialQuiz,isStepUnlocked}=await import('./material-path');
      const steps=record.path as import('./materials').PathStep[];
      const step=steps[m.index];
      if (!step || !isStepUnlocked(m.index,record.step_status as import('./material-path').MaterialProgress)) throw new Error('Esta etapa ainda está bloqueada.');
      const graded=gradeMaterialQuiz(step,m.answers);
      const {canonicalSubjectName}=await import('./stats-areas');
      data.subject=canonicalSubjectName(step.subject) ?? 'Conteúdo do material';
      data.attempts=(step.questions ?? []).map((q,i)=>({question_id:`material:${m.id}:${m.index}:${i}`,foi_correto:m.answers[i]===q.answer,materia_questao:data.subject,dificuldade_questao:step.final?'Dificil':step.level===1?'Facil':'Media'}));
      const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
      if (data.attempts.length) {
        const {error:saveError}=await supabase.from('enem_user_attempts').insert(data.attempts.map(a=>({question_id:a.question_id,foi_correto:a.foi_correto,materia_questao:a.materia_questao ?? null,dificuldade_questao:a.dificuldade_questao ?? null,user_id:userId})));
        if(saveError) throw new Error('Não foi possível salvar suas respostas.');
      }
      if(graded.passed) {
        const {error:rewardError}=await supabaseAdmin.rpc('reward_student_once',{p_user:userId,p_key:`material:${m.id}:${m.index}`,p_kind:'materialEtapa',p_xp:30,p_label:`Trilha: ${step.title}`});
        if(rewardError) throw new Error('Não foi possível salvar a recompensa.');
      } else {
        const {error:activityError}=await supabaseAdmin.rpc('record_activity',{p_user:userId,p_kind:'materialEtapa',p_xp:0,p_label:`Tentativa: ${step.title}`,p_subject:data.subject});
        if(activityError) throw new Error('Não foi possível salvar a atividade.');
      }
      const {data:saved}=await supabase.from('student_xp').select('*').eq('user_id',userId).maybeSingle();
      return snapshot(supabase,userId,saved);
    }
    if (data.kind === 'questao' && data.attempts?.[0]?.letra) {
      const { requirePremium } = await import('./subscription.server');
      await requirePremium(supabase,userId);
      const { questionsSupabase } = await import('./external-supabase');
      const a = data.attempts[0];
      const { data: question, error } = await questionsSupabase.from('enem_provas').select('resposta_correta,materia,area_conhecimento,dificuldade').eq('id',a.question_id).maybeSingle();
      if (error || !question) throw new Error('Não foi possível conferir o gabarito.');
      trustedCorrect = a.letra === question.resposta_correta?.trim().toUpperCase();
      a.foi_correto = trustedCorrect;
      a.materia_questao = question.materia ?? question.area_conhecimento;
      a.dificuldade_questao = String(question.dificuldade ?? 50);
    }

    if (data.attempts?.length && trustedCorrect===null) {
      const { error } = await supabase.from("enem_user_attempts").insert(
        data.attempts.map((a) => ({
          user_id: userId,
          question_id: a.question_id,
          dificuldade_questao: a.dificuldade_questao ?? null,
          materia_questao: a.materia_questao ?? null,
          foi_correto: a.foi_correto,
        })),
      );
      if (error) console.error("[Atividade] Falha ao salvar tentativas", error);
    }

    if (data.progress) {
      const p = data.progress;
      const { error } = await supabase.from("student_area_progress").upsert(
        {
          user_id: userId,
          theta_matematica: p.tracks.matematica,
          theta_linguagens: p.tracks.linguagens,
          theta_humanas: p.tracks.humanas,
          theta_natureza: p.tracks.natureza,
          last_played_date: p.lastPlayedDate,
          tri_consistency_rate: p.triConsistencyRate,
        },
        { onConflict: "user_id" },
      );
      if (error) console.error("[Atividade] Falha ao salvar progresso por área", error);
    }

    const xp = data.kind === 'questao' && trustedCorrect === true ? 10 : 0;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (trustedCorrect !== null) {
      const a = data.attempts?.[0];
      if (!a) throw new Error('Resposta não encontrada.');
      const { error } = await supabaseAdmin.rpc('record_verified_training', { p_user:userId,p_question:a.question_id,p_correct:trustedCorrect,p_subject:a.materia_questao ?? '',p_difficulty:a.dificuldade_questao ?? '' });
      if (error) throw new Error('Não foi possível salvar sua resposta.');
      const { data: saved } = await supabase.from('student_xp').select('*').eq('user_id',userId).maybeSingle();
      return snapshot(supabase,userId,saved);
    }
    const { data: row, error } = await supabaseAdmin.rpc("record_activity", {
      p_user: userId,
      p_kind: data.kind,
      p_xp: xp,
      p_label: data.label ?? "",
      p_subject: data.subject ?? "",
    });
    if (error) {
      console.error("[Atividade] Falha ao registrar atividade", error);
      throw new Error("Não foi possível salvar sua atividade.");
    }
    return snapshot(supabase, userId, row as XpRow);
  });

const browserSchema = z.object({
  totalXp: z.number().int().min(0).max(1_000_000),
  streak: z.number().int().min(0).max(5000),
  bestStreak: z.number().int().min(0).max(5000),
  lastActiveDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  lastActivity: z.string().max(200).nullable(),
  history: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
});

/** Reads committed account XP; legacy imports remain intact but are no longer accepted. */
export const getXpState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ browser: browserSchema.nullable().optional() }).parse(input ?? {}))
  .handler(async ({ context }): Promise<XpSnapshot> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("student_xp")
      .select("total_xp,streak,best_streak,last_active_day,last_activity,browser_imported_at")
      .eq("user_id", userId)
      .maybeSingle();

    // Legacy imported records stay intact; never accept browser values as rewards.
    return snapshot(supabase, userId, row as XpRow);
  });
