import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { Award, Check, Flame, Shield, Target } from 'lucide-react';
import { getGameState, setWeeklyGoal } from '@/lib/gamification.functions';
import { ACHIEVEMENTS, levelTitle, type AchievementKey } from '@/lib/gamification';
import { useXp } from '@/hooks/use-xp';
import { lastDays, syncXpFromAccount } from '@/lib/xp';
import { Button } from '@/components/ui/button';

export const GAME_QUERY_KEY = ['student-game'];
export function useGameState() {
  const get = useServerFn(getGameState);
  const client = useQueryClient();
  useEffect(() => {
    const changed = () => { void client.invalidateQueries({queryKey:GAME_QUERY_KEY}); void client.invalidateQueries({queryKey:['dashboard-data']}); void client.invalidateQueries({queryKey:['student-stats']}); void syncXpFromAccount(true); };
    window.addEventListener('nexem-game-change',changed);
    window.addEventListener('nexem-xp-change',changedGame);
    function changedGame() { void client.invalidateQueries({queryKey:GAME_QUERY_KEY}); }
    return () => { window.removeEventListener('nexem-game-change',changed); window.removeEventListener('nexem-xp-change',changedGame); };
  },[client]);
  return useQuery({queryKey:GAME_QUERY_KEY,queryFn:() => get(),staleTime:30_000,retry:false});
}
const missions = [
  {key:'combo3',title:'Acerte 3 seguidas',target:3},
  {key:'boss',title:'Conclua o chefe final',target:2},
  {key:'review',title:'Revise 1 erro no Tutor',target:1},
];
export function DailyMissions() {
  const game = useGameState();
  if (!game.data) return null;
  return <section className="mt-6 border-t border-border pt-5" aria-label="Missões do dia"><h2 className="text-base font-semibold">Missões do dia</h2><ul className="mt-3 grid gap-3 sm:grid-cols-3">{missions.map(m => {
    const saved = game.data.missions.find(s => s.mission_key===m.key);
    return <li key={m.key} className="rounded-lg border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{m.title}</span>{saved?.rewarded_at ? <Check aria-label="Missão concluída" className="h-4 w-4 shrink-0 text-primary"/> : <Target className="h-4 w-4 shrink-0 text-muted-foreground"/>}</div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{saved?.progress ?? 0}/{m.target}</span><span>{saved?.rewarded_at ? '+10 XP recebido' : '+10 XP'}</span></div><progress aria-label={m.title} className="game-progress mt-2 h-1.5 w-full" value={saved?.progress ?? 0} max={m.target}/></li>;
  })}</ul></section>;
}
export function StreakWeek() {
  const xp = useXp();
  const game = useGameState();
  return <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4" aria-label="Sequência semanal"><div className="flex gap-2">{lastDays(xp.history,7).map(d => <div key={d.day} className="flex flex-col items-center gap-1"><span aria-label={`${d.day}: ${d.active ? 'estudou' : game.data?.shieldDay===d.day ? 'protegido por escudo' : 'sem atividade'}`} className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${d.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-muted-foreground'}`}>{d.active ? <Check className="h-4 w-4"/> : game.data?.shieldDay===d.day ? <Shield className="h-4 w-4"/> : '·'}</span><span className="text-xs text-muted-foreground">{d.label}</span></div>)}</div><div className="text-right"><p className="flex items-center gap-1 text-sm font-semibold text-primary"><Shield className="h-4 w-4"/>{game.data?.shields ?? 0} escudos</p><div className="mt-2 flex gap-2">{[3,7,14,30].map(n => <span key={n} title={`Marco de ${n} dias`} className={`inline-flex items-center gap-1 text-xs ${xp.bestStreak>=n ? 'text-primary' : 'text-muted-foreground'}`}><Flame className="h-3 w-3"/>{n}{xp.bestStreak>=n ? ' ✓' : ''}</span>)}</div></div></section>;
}
export function GameOverview({ profile=false, compact=false }: {profile?:boolean;compact?:boolean}) {
  const game = useGameState();
  const xp = useXp();
  const save = useServerFn(setWeeklyGoal);
  const client = useQueryClient();
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  if (game.isError) return <p role="alert" className="mt-6 text-sm text-destructive">Não conseguimos carregar suas conquistas. <Button variant="link" onClick={() => void game.refetch()}>Tentar novamente</Button></p>;
  if (!game.data) return <p role="status" className="mt-6 text-sm text-muted-foreground">Carregando conquistas…</p>;
  const d = game.data;
  const ratio = Math.min(1,d.weeklyXp/d.weeklyGoal);
  async function changeGoal(goal:100|200|300) {
    setBusy(true); setError('');
    try { await save({data:{goal}}); await client.invalidateQueries({queryKey:GAME_QUERY_KEY}); } catch { setError('Não foi possível salvar sua meta.'); } finally { setBusy(false); }
  }
  return <section className="my-6 border-y border-border py-6" aria-label="Conquistas e meta semanal">
    <div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{levelTitle(xp.level)} · Nível {xp.level}</p><p className="mt-1 text-lg font-semibold">{xp.totalXp} XP conquistados</p><progress className="game-progress mt-2 h-2 w-48 max-w-full" aria-label="Progresso para o próximo nível" max={xp.xpParaProximo} value={xp.xpNoNivel}/><p className="mt-1 text-xs text-muted-foreground">{xp.xpParaProximo-xp.xpNoNivel} XP para o nível {xp.level+1}</p></div><div className="flex items-center gap-3"><svg role="img" aria-label={`Meta semanal: ${d.weeklyXp} de ${d.weeklyGoal} XP`} width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="29" fill="none" strokeWidth="7" className="stroke-secondary"/><circle cx="36" cy="36" r="29" fill="none" strokeWidth="7" className="stroke-primary" strokeDasharray={182.2} strokeDashoffset={182.2*(1-ratio)} transform="rotate(-90 36 36)"/><text x="36" y="41" textAnchor="middle" className="fill-foreground text-sm font-semibold">{Math.round(ratio*100)}%</text></svg><div><p className="text-sm font-semibold">Meta semanal</p><p className="text-xs text-muted-foreground">{d.weeklyXp}/{d.weeklyGoal} XP · desde segunda</p>{profile ? <div className="mt-2 flex gap-1" role="group" aria-label="Escolher meta semanal">{([100,200,300] as const).map(goal => <Button key={goal} size="sm" variant={d.weeklyGoal===goal ? 'default':'outline'} disabled={busy} aria-pressed={d.weeklyGoal===goal} onClick={() => void changeGoal(goal)}>{goal}</Button>)}</div> : <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/perfil">Ajustar meta</Link></Button>}</div></div></div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    {!profile && !compact && !d.run?.completed && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary"><Flame className="h-4 w-4"/>Falta pouco para manter sua sequência hoje<Button asChild variant="link"><Link to="/desafio">Concluir desafio</Link></Button></p>}
    <div className="mt-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold"><Award className="h-5 w-5 text-accent"/>Minhas conquistas · {d.achievements.length}</h2>{!profile && <Button asChild variant="link"><Link to="/perfil">Ver todas</Link></Button>}</div>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(profile ? Object.entries(ACHIEVEMENTS) : d.achievements.slice(0,3).map(a => [a.achievement_key,ACHIEVEMENTS[a.achievement_key as AchievementKey]])).map(([key,raw]) => {
      const medal = raw as (typeof ACHIEVEMENTS)[AchievementKey] | undefined;
      if (!medal) return null;
      const earned = d.achievements.find(a => a.achievement_key===key);
      return <li key={String(key)} className={`flex items-start gap-3 rounded-lg border p-3 ${earned ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted'}`}><Award className={`h-7 w-7 shrink-0 ${earned ? 'text-primary' : 'text-muted-foreground'}`}/><div><p className="text-sm font-semibold">{medal.title}</p><p className="mt-1 text-xs text-muted-foreground">{earned ? `${new Date(earned.earned_at).toLocaleDateString('pt-BR')} · +20 XP` : medal.description}</p><p className="mt-1 text-xs text-muted-foreground">{earned ? 'Conquistada ✓' : 'Ainda não conquistada'}</p></div></li>;
    })}</ul>{!profile && !d.achievements.length && <p className="mt-2 text-sm text-muted-foreground">Sua primeira medalha começa com o próximo desafio.</p>}
    {!compact && <DailyMissions/>}
  </section>;
}