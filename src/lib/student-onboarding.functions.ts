import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { onboardingAnswersSchema, validateOnboardingStep, SUMMARY_STEP, refinedLevels, generatePersonalSchedule } from './student-onboarding';
import { questionsSupabase } from './external-supabase';

const diagnosticArea = (raw: string): 'linguagens' | 'humanas' | 'natureza' | 'matematica' | null => {
  const x = raw.toLowerCase();
  if (x.includes('linguagens')) return 'linguagens'; if (x.includes('humanas')) return 'humanas'; if (x.includes('natureza')) return 'natureza'; if (x.includes('matem')) return 'matematica'; return null;
};
export const getOnboardingDiagnostic = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async () => {
  const { data, error } = await questionsSupabase.from('enem_provas').select('id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,area_conhecimento,dificuldade,imagem_url').eq('nome_prova', 'Banco Geral Nexem').gte('dificuldade', 20).lte('dificuldade', 60).order('id').limit(1000);
  if (error) throw new Error('Não conseguimos carregar as questões. Você pode tentar novamente ou pular por agora.');
  const selected = ['linguagens', 'humanas', 'natureza', 'matematica'].flatMap(area => (data ?? []).filter(q => diagnosticArea(q.area_conhecimento ?? '') === area && q.enunciado && q.opcao_a && q.opcao_e).slice(0, 2).map(q => ({ id: String(q.id), area, text: q.enunciado as string, image: q.imagem_url as string | null, options: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e] as string[] })));
  if (selected.length !== 8) throw new Error('O diagnóstico está indisponível agora. Você pode pular e começar com sua autoavaliação.');
  return selected;
});
export const saveStudentOnboarding = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ answers: onboardingAnswersSchema, step: z.number().int().min(0).max(SUMMARY_STEP), advance: z.boolean().default(false) }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.advance) for (let i = 0; i < data.step; i++) {
      const error = validateOnboardingStep(i, data.answers); if (error) throw new Error(error);
    }
    const { data: existing, error: readError } = await context.supabase.from('student_profiles').select('answers,onboarding_completed,schedule_needs_regeneration').eq('user_id', context.userId).maybeSingle();
    if (readError) throw new Error('Não conseguimos carregar seu perfil.');
    const answers = { ...data.answers };
    if (answers.diagnostic && !answers.diagnostic.skipped && Object.keys(answers.diagnostic.answers).length === 8) {
      const ids = Object.keys(answers.diagnostic.answers);
      const { data: rows, error } = await questionsSupabase.from('enem_provas').select('id,resposta_correta,area_conhecimento,dificuldade').eq('nome_prova', 'Banco Geral Nexem').in('id', ids).gte('dificuldade', 20).lte('dificuldade', 60);
      if (error || rows?.length !== 8) throw new Error('Não conseguimos conferir o diagnóstico. Tente novamente.');
      const results: NonNullable<typeof answers.diagnostic>['results'] = {};
      for (const q of rows) {
        const area = diagnosticArea(q.area_conhecimento ?? ''); if (!area) throw new Error('Questão inválida.');
        const r = results[area] ?? { correct: 0, total: 0 }; r.total++;
        if (r.total > 2) throw new Error('O diagnóstico precisa de duas questões por área.');
        if (String(q.resposta_correta).trim().toUpperCase() === answers.diagnostic.answers[String(q.id)]) r.correct++;
        results[area] = r;
      }
      answers.diagnostic = { ...answers.diagnostic, results };
    } else if (answers.diagnostic && !answers.diagnostic.skipped) {
      if (data.advance && data.step > 23) throw new Error('Conclua as oito questões ou pule por agora.');
      answers.diagnostic = { ...answers.diagnostic, results: {} };
    } else if (answers.diagnostic) answers.diagnostic = { ...answers.diagnostic, results: {} };
    const changed = Boolean(existing?.onboarding_completed && JSON.stringify(existing.answers) !== JSON.stringify(answers));
    const { error } = await context.supabase.from('student_profiles').upsert({ user_id: context.userId, answers, area_levels: refinedLevels(answers), availability: answers.availability, onboarding_step: data.step, schedule_needs_regeneration: changed || existing?.schedule_needs_regeneration || false }, { onConflict: 'user_id' });
    if (error) throw new Error('Não conseguimos salvar agora. Tente novamente.');
    return { answers };
  });
export const confirmStudentProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirmed: z.literal(true) }).parse(input))
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('student_profiles').select('answers').eq('user_id', context.userId).single();
    if (error || !data) throw new Error('Seu perfil ainda não foi salvo.');
    const answers = onboardingAnswersSchema.parse(data.answers);
    for (let i = 0; i < SUMMARY_STEP; i++) { const issue = validateOnboardingStep(i, answers); if (issue) throw new Error(issue); }
    const schedule = generatePersonalSchedule(answers);
    const now = new Date().toISOString();
    const { error: saveError } = await context.supabase.from('student_profiles').update({ onboarding_completed: true, onboarding_step: SUMMARY_STEP, consent_at: now, summary_confirmed_at: now, schedule, schedule_needs_regeneration: false }).eq('user_id', context.userId);
    if (saveError) throw new Error('Não conseguimos gerar seu cronograma. Tente novamente.');
    const { error: profileError } = await context.supabase.from('profiles').update({ display_name: answers.name, school_grade: answers.situation, learning_goal: answers.course, target_score: answers.targetScore, quiz_completed_at: now, onboarded_at: now }).eq('id', context.userId);
    if (profileError) throw new Error('Cronograma salvo, mas não conseguimos atualizar o nome. Tente novamente.');
    return { schedule };
  });