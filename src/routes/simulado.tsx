import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/simulado")({
  head: () => ({
    meta: [
      { title: "Simulado — ENEM AI Tutor" },
      { name: "description", content: "Pratique com simulados adaptativos gerados pela IA com base no seu desempenho no ENEM." },
      { property: "og:title", content: "Simulado — ENEM AI Tutor" },
      { property: "og:description", content: "Simulados adaptativos para o ENEM com inteligência artificial." },
    ],
  }),
  component: SimuladoPage,
});

const AREAS = [
  { name: "Linguagens & Códigos", questions: 45, color: "from-primary to-accent" },
  { name: "Matemática", questions: 45, color: "from-accent to-primary" },
  { name: "Ciências da Natureza", questions: 45, color: "from-primary to-accent" },
  { name: "Ciências Humanas", questions: 45, color: "from-accent to-primary" },
] as const;

function SimuladoPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Simulado adaptativo</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Escolha sua sessão de prática</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            A IA seleciona questões com base no seu histórico para maximizar a curva de aprendizado.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {AREAS.map((area) => (
            <div key={area.name} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 card-glow">
              <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${area.color} opacity-10 blur-2xl`} />
              <div className="relative flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{area.name}</h2>
                <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                  {area.questions} questões
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Dificuldade calibrada pelo seu desempenho recente.
              </p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_24px_-6px_var(--neon)]">
                Começar
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Histórico recente</h2>
          <div className="mt-4 space-y-3">
            {[
              { date: "29 ago", area: "Matemática", score: "712", correct: "31/45" },
              { date: "27 ago", area: "Ciências Humanas", score: "688", correct: "29/45" },
              { date: "24 ago", area: "Linguagens", score: "701", correct: "33/45" },
            ].map((row) => (
              <div key={row.date} className="flex items-center justify-between rounded-lg border border-border bg-background/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{row.area}</p>
                  <p className="text-xs text-muted-foreground">{row.date}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">{row.correct} acertos</span>
                  <span className="text-sm font-semibold text-foreground">{row.score}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
