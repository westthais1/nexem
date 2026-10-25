import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { DailyFoxPath } from "@/components/DailyFoxPath";
import { MASTERY_QUERY_KEY, fetchMasteryProgress } from "@/lib/mastery-progress";
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';


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

function QuickActions() {
  const items = [
    { to: "/redacao", title: "Redação Inteligente", desc: "Correção competência por competência com sugestões de melhoria.", icon: RedacaoIconSmall },
  ] as const;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Continue de onde parou</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:bg-card/80 card-glow"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Acessar
                <svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

type IconProps = { className?: string };
function SimuladoIconSmall({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" />
    </svg>
  );
}
function RedacaoIconSmall({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l5 5L8 21l-5 1 1-5L16 3z" /><path d="M14 5l5 5" />
    </svg>
  );
}
