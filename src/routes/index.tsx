import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StudySchedule } from "@/components/StudySchedule";
import { ProgressMascot } from "@/components/ProgressMascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexem" },
      {
        name: "description",
        content: "Acompanhe seu progresso semanal, última nota de simulado e tempo de estudo no seu tutor de IA para o ENEM.",
      },
      { property: "og:title", content: "Dashboard — Nexem" },
      {
        property: "og:description",
        content: "Acompanhe seu progresso, notas e tempo de estudo no Nexem.",
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
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <ProgressCard />
          <LastScoreCard />
          <StudyTimerCard />
        </div>
        <StudySchedule />
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
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-foreground md:text-6xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-glow-neon">
            Nexem
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-lg font-medium text-foreground/90 md:text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Estudo Adaptativo.{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-glow-neon">
            Nota Máxima.
          </span>
        </p>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Simulados personalizados, correção inteligente de redação e estatísticas que revelam onde você mais evolui.
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

function ProgressCard() {
  const weekly = 78; // % da meta semanal
  const hours = 14.5;
  const goal = 20;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 card-glow">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Progresso semanal</p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
          </span>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-4xl font-semibold text-foreground">{weekly}%</span>
          <span className="mb-1 text-sm text-muted-foreground">da meta</span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${weekly}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {hours}h de {goal}h estudadas esta semana
        </p>
      </div>
    </div>
  );
}

function LastScoreCard() {
  const score = 742;
  const delta = +28;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/40 card-glow">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Última nota simulada</p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5L12 2z" /></svg>
          </span>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-4xl font-semibold text-foreground text-glow-electric">{score}</span>
          <span className="mb-1 text-sm text-muted-foreground">/ 1000</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
          {delta > 0 ? "+" : ""}{delta} pts vs. simulado anterior
        </div>
      </div>
    </div>
  );
}

function StudyTimerCard() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 card-glow">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Cronômetro de estudos</p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
          </span>
        </div>
        <div className="mt-5 font-mono text-4xl font-semibold tabular-nums text-foreground text-glow-neon">
          {hh}:{mm}:{ss}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_24px_-6px_var(--neon)]"
          >
            {running ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                Pausar
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7V5z" /></svg>
                Iniciar
              </>
            )}
          </button>
          <button
            onClick={() => { setSeconds(0); setRunning(false); }}
            aria-label="Zerar cronômetro"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>
      </div>
    </div>
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
