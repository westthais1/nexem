import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ProgressMascot } from "@/components/ProgressMascot";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { MasteryTargets } from "@/components/MasteryTargets";

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
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <HeroBanner />
        <DailyChallengeCard />
        <MasteryTargets />
        <ProgressMascot />
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
      <div className="relative px-7 py-10 md:px-12 md:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Tutor de IA · Online agora
        </span>
        <h1 className="mt-5 max-w-2xl text-6xl font-semibold leading-[1.05] text-foreground md:text-8xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            nexem
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-lg font-medium text-foreground/90 md:text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Estudo Adaptativo.{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-glow-neon">
            Nota Máxima.
          </span>
        </p>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Um treino inteligente que evolui com você.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/simulado"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
          >
            Iniciar simulado
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link
            to="/redacao"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/40 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-accent/10"
          >
            Corrigir redação
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const items = [
    { to: "/simulado", title: "Simulado adaptativo", desc: "Questões selecionadas pela IA com base no seu desempenho.", icon: SimuladoIconSmall },
    { to: "/redacao", title: "Redação Inteligente", desc: "Correção competência por competência com sugestões de melhoria.", icon: RedacaoIconSmall },
    { to: "/estatisticas", title: "Estatísticas detalhadas", desc: "Mapa de acertos e erros por área do conhecimento.", icon: EstatisticasIconSmall },
  ] as const;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Continue de onde parou</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
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
function EstatisticasIconSmall({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
