import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Flame, Sparkles, Loader2, Star, PackageOpen, Swords, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyFoxQuestion } from '@/components/DailyFoxQuestion';
import { DailyFoxPath, PATH_QUERY_KEY } from '@/components/DailyFoxPath';
import { DailyQuestTrail } from '@/components/DailyQuestTrail';
import { DailyMissions, StreakWeek, useGameState, GAME_QUERY_KEY } from '@/components/GameProgress';
import { TutorChat } from '@/components/TutorChat';
import { ConfettiBurst } from '@/components/LevelUpCelebration';
import { answerDailyChallenge, startDailyChallenge, type GameRun } from '@/lib/gamification.functions';
import { gradeDaily } from '@/lib/daily-diagnosis';
import { type DailyQuestion } from '@/lib/daily-challenge';
import { averageTheta, fetchProgress } from '@/lib/progress';
import { syncXpFromAccount } from '@/lib/xp';
import { useXp } from '@/hooks/use-xp';
import { subjectOf } from '@/lib/mastery';
import { AREA_INFO, areaOfMateria } from '@/lib/stats-areas';
import { pickWeakest } from '@/lib/next-steps';

export const Route = createFileRoute('/desafio')({
  head: () => ({ meta: [
    { title:'Desafio Diário — Jornada Nexem' },
    { name:'description',content:'Sua jornada diária de 10 questões: aquecimento, chefe final, missões, XP e conquistas salvos na sua conta Nexem.' },
    { property:'og:title',content:'Desafio Diário — Jornada Nexem' },
    { property:'og:description',content:'Avance por 10 questões, mantenha sua sequência e conquiste o baú diário no Nexem.' },
    { property:'og:type',content:'website' },{ name:'twitter:card',content:'summary_large_image' },
  ] }), component:DesafioPage,
});
const LETTERS = ['A','B','C','D','E'] as const;
type Letter = typeof LETTERS[number];
function optionText(q:DailyQuestion,letter:Letter) { return ({A:q.opcao_a,B:q.opcao_b,C:q.opcao_c,D:q.opcao_d,E:q.opcao_e})[letter]; }
function nextSteps(run:GameRun) {
  const tallies = new Map<string,{key:string;slug:string;label:string;total:number;acertos:number}>();
  const missed:DailyQuestion[]=[];
  run.answers.forEach((a,i) => {
    const q = run.questions[i]; if (!q) return;
    if (!a.correto) missed.push(q);
    const subject=subjectOf(q.materia,q.area_conhecimento); const area=areaOfMateria(q.materia ?? q.area_conhecimento);
    const slug=subject?.slug ?? (area ? AREA_INFO[area].subject : null);
    const label=subject?.label ?? (area ? AREA_INFO[area].name : null);
    if (!slug || !label) return;
    const t=tallies.get(slug) ?? {key:slug,slug,label,total:0,acertos:0}; t.total++; if (a.correto) t.acertos++; tallies.set(slug,t);
  });
  return {missed,weakest:pickWeakest([...tallies.values()])};
}
function DesafioPage() {
  const game=useGameState(); const xp=useXp(); const client=useQueryClient();
  const start=useServerFn(startDailyChallenge); const answer=useServerFn(answerDailyChallenge);
  const progress=useQuery({queryKey:['nexem_user_progress'],queryFn:fetchProgress,staleTime:60_000});
  const [run,setRun]=useState<GameRun|null>(null); const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<Letter|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [tutorOpen,setTutorOpen]=useState(false); const [hintToken,setHintToken]=useState(0); const [reviewQ,setReviewQ]=useState<DailyQuestion|null>(null);
  const [celebrate,setCelebrate]=useState(false); const [feedbackXp,setFeedbackXp]=useState(0);
  useEffect(() => { if (game.data?.run && (!run || game.data.run.answers.length>run.answers.length || game.data.run.missionXp!==run.missionXp)) { setRun(game.data.run); if (!run) setIndex(game.data.run.answers.length); } },[game.data,run]);
  useEffect(() => { if (!celebrate) return; const timer=setTimeout(() => setCelebrate(false),3500); return () => clearTimeout(timer); },[celebrate]);
  const current=run?.questions[index]; const confirmed=Boolean(run?.answers[index]); const done=Boolean(run?.completed && index>=10);
  const theta=run ? averageTheta(run.thetas) : progress.data ? averageTheta(progress.data.tracks) : 50;
  const result=useMemo(() => run ? gradeDaily(run.answers,averageTheta(run.thetas)) : null,[run]);
  const steps=useMemo(() => run ? nextSteps(run) : null,[run]);
  async function refresh() {
    await Promise.all([syncXpFromAccount(true),client.invalidateQueries({queryKey:GAME_QUERY_KEY}),client.invalidateQueries({queryKey:PATH_QUERY_KEY}),client.invalidateQueries({queryKey:['dashboard-data']}),client.invalidateQueries({queryKey:['student-stats']}),client.invalidateQueries({queryKey:['tri-estimate']}),client.invalidateQueries({queryKey:['nexem_user_progress']})]);
  }
  async function begin() {
    if (busy) return; setBusy(true);setError('');
    try { const saved=await start();setRun(saved);setIndex(saved.answers.length);setSelected(null);await client.invalidateQueries({queryKey:GAME_QUERY_KEY}); } catch(e) { setError(e instanceof Error ? e.message : 'Não foi possível começar o desafio.'); } finally {setBusy(false);}
  }
  async function confirm() {
    if (busy || !selected || confirmed || !run) return;
    setBusy(true);setError('');
    try {
      const saved=await answer({data:{index,letter:selected}});setRun(saved);setFeedbackXp(saved.answers[index]?.xp ?? 0);
      await refresh();
    } catch(e) {setError(e instanceof Error ? e.message : 'Não foi possível confirmar a resposta.');} finally {setBusy(false);}
  }
  function next() { if(index===9 && run?.stars===3) setCelebrate(true);setIndex(i => i+1);setSelected(null);setFeedbackXp(0);setTutorOpen(false);setHintToken(0); }
  function openTutor(q:DailyQuestion) {setReviewQ(q);setTutorOpen(true);setHintToken(t => t+1);}
  return <main className="w-full flex-1 overflow-y-auto"><div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:py-10">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Sua jornada de hoje</p><h1 className="mt-1 text-3xl font-semibold tracking-normal">Desafio Diário Nexem</h1><p className="mt-2 text-sm text-muted-foreground">10 questões · nível {theta}/100 · um passo por dia</p></div><span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary"><Flame className="h-4 w-4"/>{xp.streak} {xp.streak===1 ? 'dia' : 'dias'}</span></header>
    <StreakWeek/>
    {(game.isPending || progress.isPending) && <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 motion-safe:animate-spin"/>Carregando sua jornada…</p>}
    {(error || game.isError) && <div role="alert" className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p>{error || 'Não conseguimos carregar o desafio.'}</p>{game.isError && <Button variant="outline" className="mt-2" onClick={() => void game.refetch()}><RotateCcw className="h-4 w-4"/>Tentar novamente</Button>}</div>}
    {game.data && !run && <section className="py-8"><div className="flex items-center gap-3"><Swords className="h-8 w-8 text-accent"/><div><h2 className="text-xl font-semibold">O chefe final está esperando</h2><p className="mt-1 text-sm text-muted-foreground">Aquecimento, seis questões no seu nível e duas de chefe final.</p></div></div><p className="mt-4 text-sm text-muted-foreground">Conclua as 10 para abrir seu baú. Errar faz parte: nenhum erro bloqueia sua jornada.</p><Button className="mt-5" size="lg" disabled={busy || !progress.data} onClick={() => void begin()}>{busy ? <Loader2 className="motion-safe:animate-spin"/> : <Flame/>}{busy ? 'Preparando…' : 'Começar desafio'}</Button><DailyMissions/></section>}
    {run && <DailyQuestTrail run={run} index={index}/>}
    {run && current && !done && <>
      <section className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Questão {index+1}/10 · {index<2 ? 'Aquecimento' : index<8 ? 'Seu nível' : 'Chefe final'}</p><p className="text-xs text-muted-foreground">{current.materia ?? current.area_conhecimento}</p></div>
        <DailyFoxQuestion text={current.enunciado} mood={confirmed ? run.answers[index]?.correto ? 'celebrating' : 'encouraging' : selected ? 'thinking' : 'talking'}/>
        {current.imagem_url && <img src={current.imagem_url} alt="Imagem de apoio da questão" className="mx-auto mt-4 max-h-[420px] max-w-full rounded-lg object-contain"/>}
        <div role="group" aria-label="Alternativas" className="mt-5 space-y-3">{LETTERS.map(letter => {
          const correct=confirmed && current.resposta_correta===letter;
          const chosen=confirmed ? run.answers[index]?.letra===letter : selected===letter;
          return <Button key={letter} variant="outline" aria-pressed={chosen} disabled={busy || confirmed} onClick={() => setSelected(letter)} className={`h-auto min-h-12 w-full justify-start whitespace-normal px-3 py-3 text-left font-normal ${correct ? 'border-success bg-success/10' : confirmed && chosen ? 'border-answer-error bg-answer-error/10' : chosen ? 'border-accent bg-accent/5' : ''}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold">{letter}</span><span className="min-w-0 flex-1">{optionText(current,letter)}</span>{correct ? <Check className="h-4 w-4 shrink-0" aria-label="Correta"/> : confirmed && chosen ? <X className="h-4 w-4 shrink-0" aria-label="Incorreta"/> : null}</Button>;
        })}</div>
        {confirmed && <div key={index} role="status" aria-live="polite" className={`mt-5 rounded-lg border p-4 motion-safe:animate-fade-in-up ${run.answers[index]?.correto ? 'border-success/40 bg-success/5' : 'border-answer-error/40 bg-answer-error/5'}`}><p className="flex flex-wrap items-center gap-2 font-semibold">{run.answers[index]?.correto ? <><Check className="h-5 w-5"/>Acertou!</> : <><X className="h-5 w-5"/>Continue: cada tentativa conta.</>}{feedbackXp>0 && <span className="xp-float text-sm text-primary">+{feedbackXp} XP</span>}{run.combo>=2 && <span className="text-sm text-accent">Combo x{run.combo}</span>}</p><p className="mt-2 text-sm text-muted-foreground">Resposta correta: {current.resposta_correta}. {current.explicacao ?? 'A explicação desta questão ainda não está disponível.'}</p></div>}
        <div className="mt-5 flex flex-wrap gap-3"><Button disabled={busy || (!confirmed && !selected)} onClick={() => confirmed ? next() : void confirm()}>{busy && <Loader2 className="motion-safe:animate-spin"/>}{confirmed ? index===9 ? 'Ver resultado' : 'Próxima questão' : 'Confirmar resposta'}</Button><Button variant="outline" onClick={() => {setReviewQ(null);setTutorOpen(true);setHintToken(t => t+1);}}><Sparkles/>Tutor Nex</Button></div>
      </section><TutorChat key={`${run.day}-${index}`} open={tutorOpen} onOpenChange={setTutorOpen} question={current.enunciado} options={LETTERS.map(l => `${l}) ${optionText(current,l)}`)} area={current.area_conhecimento ?? 'ENEM'} explicacao={current.explicacao} hintToken={hintToken}/><DailyMissions/>
    </>}
    {run && done && result && <section className="mt-8 space-y-6">
      {celebrate && run.stars===3 && <ConfettiBurst pieces={60}/>}
      <div className="text-center"><div className="flex justify-center gap-2" aria-label={`${run.stars} de 3 estrelas`}>{[1,2,3].map(s => <Star key={s} className={`h-10 w-10 ${s<=run.stars ? 'fill-warning text-warning-foreground' : 'text-border'}`}/>)}</div><h2 className="mt-3 text-2xl font-semibold">Jornada concluída!</h2><p className="mt-2 text-sm text-muted-foreground">{result.acertos}/10 acertos · {result.precisaMelhorar ? 'Tem que melhorar um pouquinho. Um passo de cada vez!' : 'Ótimo desempenho!'}</p></div>
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]"><div className="flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 p-5"><PackageOpen className="h-12 w-12 text-primary"/><h3 className="mt-2 font-semibold">Baú diário aberto</h3><p className="mt-1 text-sm text-primary">+{run.chestXp} XP recebidos</p></div><div><h3 className="text-lg font-semibold">XP da jornada · {run.baseXp+run.comboXp+run.chestXp+run.missionXp}</h3><dl className="mt-3 space-y-2 text-sm">{[['Conclusão e desempenho',run.baseXp],['Combos (máximo 15)',run.comboXp],['Baú diário',run.chestXp],['Missões concluídas',game.data?.run?.missionXp ?? run.missionXp]].map(([label,value]) => <div key={String(label)} className="flex justify-between border-b border-border py-1"><dt>{label}</dt><dd className="font-semibold">+{value} XP</dd></div>)}</dl><p className="mt-2 text-xs text-muted-foreground">Medalhas novas acrescentam +20 XP cada ao total da sua conta.</p></div></div>
      {(result.possivelChute || result.padraoInconsistente) && <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Há indícios de dúvidas ou possíveis chutes, mas só pelas respostas não dá para confirmar. Revise o raciocínio dos erros.</p>}
      <DailyMissions/>
      {steps && <section className="border-t border-border pt-5"><h3 className="text-lg font-semibold">Revisar erros</h3>{!steps.missed.length ? <p className="mt-2 text-sm text-muted-foreground">Você acertou todas! Continue treinando para consolidar.</p> : <ul className="mt-3 space-y-3">{steps.missed.map(q => <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><p className="min-w-0 flex-1 text-sm">{q.materia ?? q.area_conhecimento} · {q.enunciado.slice(0,90)}…</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openTutor(q)}><Sparkles/>Revisar no Tutor</Button><Button asChild variant="ghost" size="sm"><Link to="/raio-x" search={{subject:subjectOf(q.materia,q.area_conhecimento)?.slug}}>Raio-X do assunto</Link></Button></div></li>)}</ul>}<div className="mt-5 flex flex-wrap gap-3">{steps.weakest && <Button asChild><Link to="/simulado" search={{subject:steps.weakest.slug}}>Treinar {steps.weakest.label}</Link></Button>}<Button asChild variant="outline"><Link to="/estatisticas">Ver minhas estatísticas</Link></Button><Button asChild variant="ghost"><Link to="/">Voltar à dashboard</Link></Button></div></section>}
      {reviewQ && <TutorChat key={`review-${reviewQ.id}`} open={tutorOpen} onOpenChange={setTutorOpen} question={reviewQ.enunciado} options={LETTERS.map(l => `${l}) ${optionText(reviewQ,l)}`)} area={reviewQ.area_conhecimento ?? 'ENEM'} explicacao={reviewQ.explicacao} hintToken={hintToken} review={{day:run.day,questionId:String(reviewQ.id)}}/>}
      <DailyFoxPath className="mt-6"/>
    </section>}
  </div></main>;
}
