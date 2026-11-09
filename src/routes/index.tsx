import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { DailyFoxPath } from "@/components/DailyFoxPath";
import { MASTERY_QUERY_KEY, fetchMasteryProgress } from "@/lib/mastery-progress";
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Lock, CalendarDays, Flame, Sparkles, Target, PenLine, BookOpen, History, TrendingDown } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { getDashboardData, type DashboardData } from '@/lib/stats.functions';
import { planToday, weekdayNamePt } from '@/lib/next-steps';
import { AREA_INFO } from '@/lib/stats-areas';
import { AREA_LABELS } from '@/lib/student-onboarding';
import { useXp } from '@/hooks/use-xp';
import { XP_LABELS, type XpSource } from '@/lib/xp';
import { subjectOf } from '@/lib/mastery';


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexem" },
      {
        name: "description",
        content: "Desafio diário, metas de domínio e progresso adaptativo no seu tutor de IA para o ENEM.",
      },
      { property: "og:title", content: "Dashboard — Nexem" },
      {
        property: "og:description",
        content: "Desafio diário, metas de domínio e progresso adaptativo no Nexem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <main className="w-full flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
        <HeroBanner />
        <TodayCard />
        <DailyChallengeCard />
        <DailyFoxPath className="mt-8" />
        <TutorNexCard />
        <QuickActions />
      </div>
    </main>
  );
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card card-glow">
      <div className="bg-aurora absolute inset-0 opacity-70" />
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative px-7 py-8 md:px-12 md:py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Tutor de IA · Online agora
        </span>
        <h1 className="mt-5 max-w-2xl text-6xl font-semibold leading-[1.05] text-foreground md:text-8xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            nexem
          </span>
        </h1>
      </div>
    </section>
  );
}

/** Card "Treine com Tutor Nex" — entrada para os Níveis de Maestria por matéria, com barra de progresso total. */
function TutorNexCard() {
  const { isPremium, openUpgrade } = useSubscription();
  const masteryQuery = useQuery({ queryKey: MASTERY_QUERY_KEY, queryFn: fetchMasteryProgress });
  const total = masteryQuery.data?.totalRespondidas ?? 0;


  const goal = 250;
  const pct = Math.min(100, Math.max(2, Math.round((total / goal) * 100)));
  const hue = (total * 3) % 360;

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card card-glow">
      <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              className="text-xl font-semibold text-foreground md:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Treine com Tutor Nex
            </h2>
            <p className="flex items-baseline gap-1 text-xs text-muted-foreground">
              <span className="text-2xl font-semibold text-foreground text-glow-neon">{total}</span>
              de {goal} questões rumo ao domínio
            </p>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            15 trilhas de matéria em três níveis — Fundações, Aprofundamento e Domínio Avançado.
            Blocos de 5 questões que calibram sua proficiência e destravam níveis mais altos, no estilo TRI do ENEM.
          </p>
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className="relative h-4 overflow-hidden rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--primary), var(--accent))",
                filter: `hue-rotate(${hue}deg)`,
                boxShadow: "0 0 18px -4px var(--primary)",
              }}
            >
              <span className="mastery-progress-shine absolute inset-y-0 w-16" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Matemática", "Natureza", "Humanas", "Linguagens"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>
        {isPremium ? <Link
          to="/simulado"
          className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-[0_0_28px_-6px_var(--electric)]"
        >
          Começar treino
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
        : <Button className="relative" size="lg" onClick={openUpgrade}><Lock /> Desbloquear Nexem Pro</Button>}
      </div>
    </section>
  );
}

function useDashboard() {
  const fn = useServerFn(getDashboardData);
  return useQuery({ queryKey: ['dashboard-data'], queryFn: () => fn(), staleTime: 30_000 });
}

const btn = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90";
const linkCls = "mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline";

/** Card "Hoje": decisão determinística a partir do cronograma salvo no onboarding. */
function TodayCard() {
  const { data, isLoading, isError } = useDashboard();
  const xp = useXp();
  const { isPremium, openUpgrade } = useSubscription();
  const weekday = weekdayNamePt();
  const action = data ? planToday(data.schedule, weekday, data.desafioFeitoHoje) : null;
  const day = action && 'day' in action ? action.day : null;
  return (
    <section className="mt-4 rounded-2xl border border-primary/40 bg-card p-6 card-glow md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><CalendarDays className="h-4 w-4" /> Hoje · {weekday}</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            {isLoading ? 'Carregando seu plano…' : isError ? 'Não conseguimos carregar seu plano' : !data?.schedule?.length ? 'Monte seu cronograma' : day?.sessions.length ? `Foco: ${day.sessions.map((s) => AREA_LABELS[s.area]).join(' · ')}` : 'Dia livre no seu cronograma'}
          </h2>
          {day?.sessions[0] && <p className="mt-1 text-sm text-muted-foreground">{day.sessions[0].topic} · {day.hours}h · {day.period}</p>}
          {data?.notaAlvo != null && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Target className="h-4 w-4 text-accent" /> Meta: <strong className="text-foreground">{data.notaAlvo} pontos</strong></p>}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-3 py-1"><Flame className="h-3.5 w-3.5 text-primary" /> {xp.streak} {xp.streak === 1 ? 'dia' : 'dias'}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-3 py-1"><Sparkles className="h-3.5 w-3.5 text-accent" /> {xp.totalXp} XP</span>
          <span className="rounded-full border border-border bg-background/40 px-3 py-1">Nível {xp.level}</span>
        </div>
      </div>
      <div className="mt-5">
        {action?.kind === 'perfil' && <Link to="/perfil" className={btn}>Criar meu cronograma</Link>}
        {action?.kind === 'desafio' && <Link to="/desafio" className={btn}>Fazer o Desafio Diário</Link>}
        {action?.kind === 'redacao' && <Link to="/redacao" className={btn}>Escrever a redação de hoje</Link>}
        {action?.kind === 'treinar' && (isPremium
          ? <Link to="/simulado" search={{ subject: AREA_INFO[action.area].subject }} className={btn}>Treinar {AREA_LABELS[action.area]} com Tutor Nex</Link>
          : <Button onClick={openUpgrade}><Lock /> Treinar {AREA_LABELS[action.area]} — Nexem Pro</Button>)}
        {action?.kind === 'livre' && <Link to="/estatisticas" className={btn}>Ver minhas estatísticas</Link>}
      </div>
    </section>
  );
}

type ContinueTarget = { desc: string; to: '/desafio' | '/simulado' | '/redacao' | '/full-simulado' | '/materiais'; subject?: string };
function activityLink(d: DashboardData): ContinueTarget | null {
  const a = d.ultimaAtividade;
  if (!a) return null;
  const nome = XP_LABELS[a.kind as XpSource] ?? 'Atividade';
  const desc = `${nome}${a.subject ? ` · ${a.subject}` : ''} · ${new Date(a.data).toLocaleDateString('pt-BR')}`;
  if (a.kind === 'redacao') return { desc, to: '/redacao' };
  if (a.kind === 'provaCompleta') return { desc, to: '/full-simulado' };
  if (a.kind === 'materialEtapa') return { desc, to: '/materiais' };
  if (a.kind === 'desafioDiario') return { desc, to: '/desafio' };
  return { desc, to: '/simulado', subject: subjectOf(a.subject, null)?.slug };
}

function QuickActions() {
  const { data } = useDashboard();
  if (!data) return null;
  const last = activityLink(data);
  const weak = data.areaMaisFraca;
  const card = "flex flex-col rounded-2xl border border-border bg-card p-6 card-glow";
  const icon = "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary";
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Continue de onde parou</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {last && (
          <div className={card}>
            <span className={icon}><History className="h-5 w-5" /></span>
            <h3 className="mt-4 text-base font-semibold text-foreground">Última atividade</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{last.desc}</p>
            {last.to === '/simulado'
              ? <Link to="/simulado" search={{ subject: last.subject }} className={linkCls}>Continuar →</Link>
              : <Link to={last.to} className={linkCls}>Continuar →</Link>}
          </div>
        )}
        <div className={card}>
          <span className={icon}><TrendingDown className="h-5 w-5" /></span>
          <h3 className="mt-4 text-base font-semibold text-foreground">{weak ? `Área mais fraca: ${AREA_INFO[weak.key].name}` : 'Descubra sua área mais fraca'}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{weak ? `${weak.pct}% de acertos em ${weak.total} questões.` : 'Responda questões no Desafio Diário para ver onde focar.'}</p>
          {weak ? <Link to="/simulado" search={{ subject: AREA_INFO[weak.key].subject }} className={linkCls}>Treinar →</Link> : <Link to="/desafio" className={linkCls}>Ir para o Desafio Diário →</Link>}
        </div>
        <div className={card}>
          <span className={icon}><PenLine className="h-5 w-5" /></span>
          <h3 className="mt-4 text-base font-semibold text-foreground">{data.ultimaRedacao ? 'Sua última redação' : 'Redação Inteligente'}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{data.ultimaRedacao ? `${data.ultimaRedacao.tema} · ${data.ultimaRedacao.nota} pontos` : 'Você ainda não corrigiu nenhuma redação.'}</p>
          <Link to="/redacao" className={linkCls}>{data.ultimaRedacao ? 'Ver na Redação →' : 'Escrever uma redação →'}</Link>
        </div>
        {data.ultimoMaterial && (
          <div className={card}>
            <span className={icon}><BookOpen className="h-5 w-5" /></span>
            <h3 className="mt-4 text-base font-semibold text-foreground">Material recente</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{data.ultimoMaterial.title}</p>
            <Link to="/materiais" className={linkCls}>Abrir Meus Materiais →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
