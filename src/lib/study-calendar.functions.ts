import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { getRequest } from '@tanstack/react-start/server';
import { calendarData, generateWeek } from './study-calendar.server';
import { addDays, fitsAvailability, findFreeSlot, localDay, monday } from './study-planner';

export const getStudyCalendar=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const data=await calendarData(context.supabase,context.userId);
 if(data.plans.length && !data.plans.some(p=>p.week_start===monday(data.today))) return generateWeek(context.supabase,context.userId);
 return data;
});
export const generateStudyCalendar=createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
 .inputValidator((v:unknown)=>z.object({week:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).parse(v))
 .handler(async({context,data})=>{
   if(data.week && (data.week<monday(localDay()) || data.week>addDays(monday(localDay()),28))) throw new Error('Escolha uma semana entre hoje e as próximas quatro semanas.');
   return generateWeek(context.supabase,context.userId,data.week);
 });
export const updateStudySession=createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
 .inputValidator((v:unknown)=>z.object({id:z.string().uuid(),action:z.enum(['start','complete','skip','postpone','move']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),start:z.number().int().min(0).max(1439).optional(),minutes:z.number().int().min(0).max(720).optional(),correct:z.number().int().min(0).max(1000).default(0),total:z.number().int().min(0).max(1000).default(0)}).refine(v=>v.correct<=v.total).parse(v))
 .handler(async({context,data})=>{
  const state=await calendarData(context.supabase,context.userId),session=state.sessions.find(s=>s.id===data.id);
  if(!session) throw new Error('Sessão não encontrada.');
  if(session.status!=='planejada') throw new Error('Essa sessão já foi finalizada.');
  const patch:Record<string,string|number|null>={};
  if(data.action==='start') patch.started_at=session.started_at ?? new Date().toISOString();
  if(data.action==='complete') {patch.status='concluida';patch.completed_at=new Date().toISOString();patch.actual_minutes=data.minutes ?? (session.started_at?Math.max(0,Math.min(720,Math.round((Date.now()-new Date(session.started_at).getTime())/60000))):session.duration);patch.correct=data.correct;patch.total=data.total;}
  if(data.action==='skip') patch.status='pulada';
  if(data.action==='postpone' || data.action==='move') {
    const candidate=data.action==='postpone'?findFreeSlot(state.answers,state.sessions,session,addDays(session.date<state.today?state.today:session.date,1)) : {...session,date:data.date ?? session.date,start_minutes:data.start ?? session.start_minutes};
    if(!candidate || candidate.date<state.today || !fitsAvailability(state.answers,state.sessions,candidate,session.id)) throw new Error('Sem horário livre nessa disponibilidade. Escolha outro dia ou ajuste seu perfil.');
    patch.date=candidate.date;patch.start_minutes=candidate.start_minutes;
  }
  const {error}=await context.supabase.from('study_sessions').update(patch).eq('id',session.id).eq('user_id',context.userId).eq('status','planejada');
  if(error) throw new Error('Não conseguimos atualizar a sessão. Tente novamente.');
  return {previous:{date:session.date,start:session.start_minutes},state:await calendarData(context.supabase,context.userId)};
 });
export const explainStudyWeek=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const data=await calendarData(context.supabase,context.userId), plan=data.plans.find(p=>p.week_start===monday(data.today));
 if(!plan) throw new Error('Gere seu plano primeiro.');
 const key=process.env['LOVABLE_API_KEY'];
 if(!key) throw new Error('A explicação por IA está indisponível. Seu plano continua salvo.');
 const {createResponsesCall}=await import('./calendar-ai/responses.server');
 const {result}=createResponsesCall(getRequest(),{apiKey:key,baseURL:'https://ai.gateway.lovable.dev/v1',model:'openai/gpt-6-astra'},[{role:'user',content:JSON.stringify(plan.insights)}],'Escreva somente um resumo motivador em português brasileiro, até três frases, explicando estes ajustes determinísticos do cronograma. Não invente notas, progresso ou assuntos. Nenhuma decisão do plano pode ser alterada.');
 let text:string;
 try{text=await result.text;}catch(e){const err=e as {responseBody?:string;message?:string};let safe=err.message ?? 'A explicação não está disponível.';try{safe=JSON.parse(err.responseBody ?? '{}').message ?? safe;}catch{}throw new Error(safe);}
 if(!text.trim()) throw new Error('A IA não retornou uma explicação. O resumo original foi preservado.');
 const {error}=await context.supabase.from('study_plans').update({summary:text}).eq('id',plan.id).eq('user_id',context.userId);
 if(error) throw new Error('Não conseguimos salvar a explicação.');
 return text;
});