import { DAYS, type Area, type OnboardingAnswers } from './student-onboarding';

export type Topic = { id: string; area: string; subject: string; title: string; exam_weight: number; estimated_minutes: number; language: string | null; active: boolean };
export type Mastery = { topic_id: string; mastery: number; accuracy: number | null; next_review: string | null; review_stage: number };
export type Session = { id: string; user_id: string; plan_id: string; topic_id: string; date: string; start_minutes: number; duration: number; type: string; status: string; format: string; actual_minutes: number; correct: number; total: number; completed_at: string | null; started_at: string | null };
export type DraftSession = Pick<Session, 'topic_id' | 'date' | 'start_minutes' | 'duration' | 'type' | 'format'>;
export function localDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function addDays(day: string, n: number) { const date = new Date(day + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + n); return date.toISOString().slice(0, 10); }
export function monday(day: string) { return addDays(day, -((new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7)); }
export function dayWindow(a: OnboardingAnswers, day: string) {
  const i = (new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const hours = a.availability[DAYS[i] ?? 'Segunda-feira'] ?? 0;
  const start = a.period === 'Manhã' ? 6 * 60 : a.period === 'Tarde' ? 12 * 60 : 18 * 60;
  return { start, end: start + Math.min(360, Math.floor(hours * 60)), declared: Math.floor(hours * 60) };
}
export function priority(weight: number, target: number, mastery: number, accuracy: number | null = null) {
  return weight * Math.max(0, target - mastery) * (accuracy !== null && accuracy < 60 ? 1.5 : accuracy !== null && accuracy > 85 ? 0.4 : 1);
}
export function initialMastery(a: OnboardingAnswers, area: string) {
  const key = area as Area;
  const rating = (a.levels[key] ?? 3) * 15;
  const previous = a.previousScores[key];
  const diagnostic = a.diagnostic?.results[key];
  if (diagnostic?.total) return (rating + 100 * diagnostic.correct / diagnostic.total) / 2;
  return previous !== null && previous !== undefined ? (rating + previous / 10) / 2 : rating;
}
export function fitsAvailability(a: OnboardingAnswers, sessions: Pick<Session, 'date'|'start_minutes'|'duration'|'status'>[], candidate: DraftSession, exclude?: string) {
  const window = dayWindow(a, candidate.date);
  const same = sessions.filter(s => s.date === candidate.date && s.status !== 'pulada' && (!('id' in s) || s.id !== exclude));
  return candidate.duration >= 25 && candidate.duration <= 50 && candidate.start_minutes >= window.start && candidate.start_minutes + candidate.duration <= window.end && same.reduce((n,s) => n+s.duration,0)+candidate.duration <= window.declared && same.every(s => candidate.start_minutes + candidate.duration <= s.start_minutes || candidate.start_minutes >= s.start_minutes+s.duration);
}
export function findFreeSlot(a: OnboardingAnswers, sessions: Session[], session: Session, from: string, days = 28): DraftSession | null {
  for (let i=0;i<days;i++) {
    const date=addDays(from,i), w=dayWindow(a,date);
    for (let start=w.start;start+session.duration<=w.end;start+=5) {
      const candidate={...session,date,start_minutes:start};
      if(fitsAvailability(a,sessions,candidate,session.id)) return candidate;
    }
  }
  return null;
}
export function planWeek(a: OnboardingAnswers, topics: Topic[], mastery: Mastery[], previous: Session[], week: string, today: string, examDate: string | null) {
  const target=Math.min(95, Math.max(40,a.targetScore/10));
  const available=topics.filter(t=>t.active && (!t.language || t.language===a.language));
  const measured=new Map(mastery.map(m=>[m.topic_id,m]));
  const near=examDate ? (new Date(examDate).getTime()-new Date(today).getTime())/86400000<=42 : false;
  const ranked=available.map(t=>({topic:t, score:priority(t.exam_weight,target,measured.get(t.id)?.mastery ?? initialMastery(a,t.area),measured.get(t.id)?.accuracy ?? null)})).sort((a,b)=>b.score-a.score || a.topic.id.localeCompare(b.topic.id));
  const usage=new Map<string,number>();
  const unfinished=new Set(previous.filter(s=>s.status==='planejada' && s.date<week).map(s=>s.topic_id));
  const drafts: DraftSession[]=[];
  const warnings:string[]=[];
  let required=0;
  const choose=()=>[...ranked].sort((x,y)=> (y.score*(unfinished.has(y.topic.id)?1.3:1)/(1+(usage.get(y.topic.id)??0))) - (x.score*(unfinished.has(x.topic.id)?1.3:1)/(1+(usage.get(x.topic.id)??0))) || x.topic.id.localeCompare(y.topic.id))[0]?.topic;
  for(let d=0;d<7;d++) {
    const date=addDays(week,d); if(date<today || (examDate && date>examDate)) continue;
    const w=dayWindow(a,date);
    const fixed=previous.filter(s=>s.date===date && s.status==='concluida');
    let remaining=Math.min(w.end-w.start,w.declared)-fixed.reduce((n,s)=>n+s.duration,0);
    for(let start=w.start;remaining>=25 && start+25<=w.end;) {
      const collision=fixed.find(s=>start>=s.start_minutes && start<s.start_minutes+s.duration);
      if(collision) {start=collision.start_minutes+collision.duration;continue;}
      let topic=choose(); if(!topic) break;
      let type='Teoria';
      const due=ranked.find(t=>{const m=measured.get(t.topic.id);return m?.next_review && m.next_review<=date && !(usage.get('review:'+t.topic.id));})?.topic;
      if(required===0) {topic=available.find(t=>t.area==='redacao') ?? topic;type='Redação';}
      else if(required===1) type='Simulado';
      else if(required===2) type='Revisão';
      else if(due) {topic=due;type='Revisão';usage.set('review:'+topic.id,1);}
      else if((measured.get(topic.id)?.accuracy ?? 100)<60) type='Revisão';
      else type=near ? (drafts.length%3===0?'Simulado':'Revisão') : ((usage.get(topic.id)??0)>0?'Exercícios':'Teoria');
      const gap=fixed.filter(s=>s.start_minutes>start).sort((a,b)=>a.start_minutes-b.start_minutes)[0];
      const capacity=Math.min(remaining,w.end-start,gap?gap.start_minutes-start:50);
      if(capacity<25) {start=gap?gap.start_minutes+gap.duration:start+5;continue;}
      let duration= type==='Revisão' || (measured.get(topic.id)?.accuracy ?? 0)>85 ? 25 : Math.min(50,capacity);
      duration=Math.min(duration,capacity);
      if(remaining-duration>0 && remaining-duration<25 && capacity>=remaining && remaining<=50) duration=remaining;
      drafts.push({topic_id:topic.id,date,start_minutes:start,duration,type,format:type==='Teoria' ? (a.styles[0] ?? 'Resumos') : type==='Simulado'?'Prática mista':type==='Revisão'?'Revisão espaçada':type});
      usage.set(topic.id,(usage.get(topic.id)??0)+duration/topic.estimated_minutes);required++;start+=duration;remaining-=duration;
    }
  }
  if(required<3) warnings.push('Sua disponibilidade restante não comporta os três blocos mínimos nesta semana. Amplie os horários no perfil para incluir redação, prática mista e revisão.');
  if(Object.values(a.availability).some(h=>h>6)) warnings.push('Reservamos apenas o período escolhido (até 6 horas). Ajuste sua disponibilidade se precisar de outro período.');
  const reinforce=ranked.filter(t=>(measured.get(t.topic.id)?.accuracy ?? 100)<60).slice(0,2).map(t=>t.topic.title);
  const shorten=ranked.filter(t=>(measured.get(t.topic.id)?.accuracy ?? 0)>85).slice(0,2).map(t=>t.topic.title);
  const recent=previous.filter(s=>s.date>=addDays(today,-7) && s.date<today);
  return {sessions:drafts,insights:{reinforce,shorten,carried:unfinished.size,completed:recent.filter(s=>s.status==='concluida').length,planned:recent.length,minutes:recent.reduce((n,s)=>n+s.actual_minutes,0),near,warnings},summary:[shorten.length?`Você foi bem em ${shorten.join(' e ')}; reduzimos a prática.`:'Priorizamos os assuntos frequentes com mais espaço para evolução.',reinforce.length?`Vamos reforçar ${reinforce.join(' e ')} com revisão.`:'Mantivemos teoria e exercícios equilibrados.',near?'A prova está próxima: mais revisão e prática mista.':'Vamos construir a base com calma.',unfinished.size?'Retomamos assuntos importantes que ficaram pendentes.':'',...warnings].filter(Boolean).join(' ')};
}
export function studyStreak(days:string[],today:string) {const set=new Set(days);let cursor=set.has(today)?today:addDays(today,-1),count=0;while(set.has(cursor)){count++;cursor=addDays(cursor,-1);}return count;}
export function exportIcs(sessions:Session[],topics:Topic[]) {
 const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const stamp=(s:Session,end=false)=>{const m=s.start_minutes+(end?s.duration:0);const d=new Date(`${s.date}T00:00:00-03:00`);d.setUTCMinutes(d.getUTCMinutes()+m);return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nexem//Cronograma//PT-BR',...sessions.filter(s=>s.status==='planejada').flatMap(s=>['BEGIN:VEVENT',`UID:${s.id}@nexem.com.br`,`DTSTAMP:${stamp(s)}`,`DTSTART:${stamp(s)}`,`DTEND:${stamp(s,true)}`,`SUMMARY:${escape(s.type+' · '+(topics.find(t=>t.id===s.topic_id)?.title ?? 'Estudo Nexem'))}`,'END:VEVENT']),'END:VCALENDAR'].join('\r\n');
}