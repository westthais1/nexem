import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { DailyAnswer, DailyQuestion } from './daily-challenge';
import type { Tracks } from './progress';

export const gameDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
export type GameRun = {
  day: string; questions: DailyQuestion[]; thetas: Tracks; answers: (DailyAnswer & { xp: number })[];
  combo: number; bestCombo: number; comboXp: number; baseXp: number; chestXp: number; missionXp: number; stars: number; completed: boolean;
};
type RunRow = { day: string; questions: unknown; thetas: unknown; answers: unknown; combo: number; best_combo: number; combo_xp: number; base_xp: number; chest_xp: number; mission_xp: number; stars: number; completed_at: string | null };
function runDto(row: RunRow): GameRun {
  const answers = row.answers as GameRun['answers'];
  return { day: row.day, questions: (row.questions as DailyQuestion[]).map((q, i) => ({ ...q, resposta_correta: i < answers.length ? q.resposta_correta : '', explicacao: i < answers.length ? q.explicacao : null })), thetas: row.thetas as Tracks, answers, combo: row.combo, bestCombo: row.best_combo, comboXp: row.combo_xp, baseXp: row.base_xp, chestXp: row.chest_xp, missionXp: row.mission_xp, stars: row.stars, completed: Boolean(row.completed_at) };
}
export const getGameState = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const day = gameDay();
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const week = date.toISOString().slice(0,10);
  const [run, medals, missions, xp, events, days] = await Promise.all([
    context.supabase.from('daily_challenge_runs').select('*').eq('user_id', context.userId).eq('day', day).maybeSingle(),
    context.supabase.from('student_achievements').select('achievement_key,earned_at').eq('user_id', context.userId).order('earned_at', { ascending: false }),
    context.supabase.from('student_daily_missions').select('mission_key,progress,target,rewarded_at').eq('user_id', context.userId).eq('day',day),
    context.supabase.from('student_xp').select('*').eq('user_id',context.userId).maybeSingle(),
    context.supabase.from('student_activity_events').select('xp').eq('user_id', context.userId).gte('created_at',`${week}T00:00:00-03:00`),
    context.supabase.from('study_activity_days').select('day').eq('user_id', context.userId).gte('day',week),
  ]);
  if ([run,medals,missions,xp,events,days].some(r => r.error)) throw new Error('Não foi possível carregar suas conquistas.');
  return { day, run: run.data ? runDto(run.data) : null, achievements: medals.data ?? [], missions: missions.data ?? [], weeklyXp: (events.data ?? []).reduce((sum,e) => sum+e.xp,0), weeklyGoal: xp.data?.weekly_goal ?? 200, shields: xp.data?.streak_shields ?? 0, shieldDay: xp.data?.shield_day ?? null, history: (days.data ?? []).map(d => d.day) };
});

export const startDailyChallenge = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<GameRun> => {
  const { data: existing, error } = await context.supabase.from('daily_challenge_runs').select('*').eq('user_id',context.userId).eq('day',gameDay()).maybeSingle();
  if (error) throw new Error('Não foi possível retomar seu desafio.');
  if (existing) return runDto(existing);
  const { data: p } = await context.supabase.from('student_area_progress').select('*').eq('user_id',context.userId).maybeSingle();
  if (!p) throw new Error('Seu progresso ainda está carregando. Tente novamente em instantes.');
  let tracks: Tracks = { matematica:p.theta_matematica,linguagens:p.theta_linguagens,humanas:p.theta_humanas,natureza:p.theta_natureza };
  if (!p.last_played_date) {
    const { data: profile } = await context.supabase.from('student_profiles').select('answers,onboarding_completed').eq('user_id',context.userId).maybeSingle();
    if (profile?.onboarding_completed) {
      const { onboardingAnswersSchema, refinedLevels } = await import('./student-onboarding');
      const levels = refinedLevels(onboardingAnswersSchema.parse(profile.answers));
      tracks = { matematica:20+(levels.matematica-1)*15,linguagens:20+(levels.linguagens-1)*15,humanas:20+(levels.humanas-1)*15,natureza:20+(levels.natureza-1)*15 };
    }
  }
  const { data: attempts, error: attemptError } = await context.supabase.from('enem_user_attempts').select('question_id').eq('user_id',context.userId);
  if (attemptError) throw new Error('Não foi possível carregar seu histórico.');
  const { buildDailySetFromDb, diffOf } = await import('./daily-challenge');
  const { trackOf, averageTheta } = await import('./progress');
  const questions = await buildDailySetFromDb(tracks,(attempts ?? []).map(a => a.question_id));
  if (questions.length !== 10) throw new Error('Ainda não há 10 questões disponíveis para seu desafio. Tente novamente mais tarde.');
  const trusted = questions.map(q => ({ ...q, dificuldade:diffOf(q,averageTheta(tracks)),track:trackOf(q.area_conhecimento) }));
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: row, error: saveError } = await supabaseAdmin.rpc('start_daily_run',{p_user:context.userId,p_questions:trusted,p_thetas:tracks});
  if (saveError || !row) throw new Error('Não foi possível salvar seu desafio.');
  return runDto(row);
});
export const answerDailyChallenge = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown) => z.object({index:z.number().int().min(0).max(9),letter:z.enum(['A','B','C','D','E'])}).parse(input))
  .handler(async ({data,context}):Promise<GameRun> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data:row,error } = await supabaseAdmin.rpc('submit_daily_answer',{p_user:context.userId,p_index:data.index,p_letter:data.letter});
    if (error || !row) throw new Error('Não foi possível confirmar sua resposta. Tente novamente.');
    return runDto(row);
  });
export const setWeeklyGoal = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((input:unknown) => z.object({goal:z.union([z.literal(100),z.literal(200),z.literal(300)])}).parse(input))
  .handler(async ({data,context}) => {
    const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
    const {error} = await supabaseAdmin.rpc('set_weekly_xp_goal',{p_user:context.userId,p_goal:data.goal});
    if (error) throw new Error('Não foi possível salvar sua meta.');
    return {goal:data.goal};
  });