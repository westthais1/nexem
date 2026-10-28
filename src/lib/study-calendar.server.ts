import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { onboardingAnswersSchema } from './student-onboarding';
import { addDays, initialMastery, localDay, monday, planWeek, studyStreak, type Session, type Mastery } from './study-planner';

export async function calendarData(db: SupabaseClient<Database>, userId: string) {
  const today=localDay();
  const results=await Promise.all([
    db.from('student_profiles').select('*').eq('user_id',userId).single(),
    db.from('topics').select('*').eq('active',true).order('id'),
    db.from('topic_mastery').select('*').eq('user_id',userId),
    db.from('study_sessions').select('*').eq('user_id',userId).gte('date',addDays(today,-90)).lte('date',addDays(today,90)).order('date').order('start_minutes'),
    db.from('study_plans').select('*').eq('user_id',userId).order('week_start',{ascending:false}),
    db.from('enem_config').select('*').eq('id','current').maybeSingle(),
    db.from('study_activity_days').select('day').eq('user_id',userId).order('day',{ascending:false}).limit(400),
    db.from('enem_user_attempts').select('materia_questao,foi_correto,created_at,question_id').eq('user_id',userId).gte('created_at',addDays(today,-7)+'T00:00:00-03:00').order('created_at',{ascending:false}).limit(2000),
  ]);
  for(const result of results) if(result.error) throw new Error('Não conseguimos carregar seu cronograma. Tente novamente.');
  const profile=results[0].data;
  if(!profile?.onboarding_completed || !profile.summary_confirmed_at) throw new Error('Confirme seu perfil antes de gerar o cronograma.');
  const answers=onboardingAnswersSchema.parse(profile.answers);
  return {today,answers,topics:results[1].data ?? [],mastery:results[2].data ?? [],sessions:(results[3].data ?? []) as Session[],plans:results[4].data ?? [],config:results[5].data,streak:studyStreak((results[6].data ?? []).map(d=>d.day),today),attempts:results[7].data ?? [],needsRegeneration:profile.schedule_needs_regeneration};
}
export async function generateWeek(db: SupabaseClient<Database>,userId:string,week?:string,service=false) {
  const state=await calendarData(db,userId), start=week ?? monday(state.today);
  const initial=state.topics.filter(t=>!state.mastery.some(m=>m.topic_id===t.id)).map(t=>({user_id:userId,topic_id:t.id,mastery:initialMastery(state.answers,t.area)}));
  if(initial.length){const {error}=await db.from('topic_mastery').upsert(initial,{onConflict:'user_id,topic_id',ignoreDuplicates:true});if(error)throw new Error('Não conseguimos salvar seu ponto de partida.');}
  const mastery:Mastery[]=state.topics.map(t=>state.mastery.find(m=>m.topic_id===t.id) ?? {topic_id:t.id,mastery:initialMastery(state.answers,t.area),accuracy:null,next_review:null,review_stage:0});
  // Legacy question attempts expose subjects, not topic IDs: use only subject-level evidence.
  for(const m of mastery) {
    const topic=state.topics.find(t=>t.id===m.topic_id);
    const attempts=state.attempts.filter(a=>a.materia_questao?.toLocaleLowerCase('pt-BR')===topic?.subject.toLocaleLowerCase('pt-BR'));
    if(attempts.length>=3) {
      const accuracy=100*attempts.filter(a=>a.foi_correto).length/attempts.length;
      m.accuracy=accuracy;
      m.mastery=Math.min(100,Math.max(0,m.mastery*0.8+accuracy*0.2));
    }
  }
  const plan=planWeek(state.answers,state.topics,mastery,state.sessions,start,state.today,state.config?.exam_date ?? null);
  const insight={...plan.insights,legacyAttempts:state.attempts.length,legacyEvidence:'Resultados antigos são usados por matéria; não inferimos acerto específico por tópico.'};
  const {error}= service ? await db.rpc('save_study_week_service',{p_user:userId,p_week:start,p_summary:plan.summary,p_insights:insight,p_sessions:plan.sessions}) : await db.rpc('save_study_week',{p_week:start,p_summary:plan.summary,p_insights:insight,p_sessions:plan.sessions});
  if(error) throw new Error('Não conseguimos salvar seu plano. Sua semana anterior foi preservada.');
  const {error:profileError}=await db.from('student_profiles').update({schedule_needs_regeneration:false}).eq('user_id',userId);
  if(profileError) throw new Error('Plano salvo, mas não conseguimos atualizar seu perfil.');
  return calendarData(db,userId);
}