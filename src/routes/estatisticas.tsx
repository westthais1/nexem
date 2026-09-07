import { createFileRoute } from "@tanstack/react-router";

import { TriSimulator } from "@/components/TriSimulator";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas — Nexem" },
      { name: "description", content: "Veja seu desempenho por área do conhecimento, evolução e pontos de melhoria no ENEM." },
      { property: "og:title", content: "Estatísticas — Nexem" },
      { property: "og:description", content: "Estatísticas de desempenho no Nexem." },
    ],
  }),
  component: EstatisticasPage,
});

const AREAS = [
  { name: "Matemática", pct: 82, color: "from-primary to-accent" },
  { name: "Ciências da Natureza", pct: 74, color: "from-accent to-primary" },
  { name: "Linguagens & Códigos", pct: 88, color: "from-primary to-accent" },
  { name: "Ciências Humanas", pct: 69, color: "from-accent to-primary" },
] as const;

function EstatisticasPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Estatísticas</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Seu desempenho em detalhes</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Acompanhe sua evolução por área do conhecimento ao longo das últimas semanas.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {[
            { label: "Média geral", value: "738" },
            { label: "Horas estudadas", value: "86h" },
            { label: "Questões resolvidas", value: "1.240" },
            { label: "Redações corrigidas", value: "12" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 card-glow">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <TriSimulator />

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Acertos por área</h2>
          <div className="mt-5 space-y-5">
            {AREAS.map((area) => (
              <div key={area.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{area.name}</span>
                  <span className="text-muted-foreground">{area.pct}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full rounded-full bg-gradient-to-r ${area.color}`} style={{ width: `${area.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Evolução semanal</h2>
          <div className="mt-6 flex items-end gap-3">
            {[620, 645, 688, 701, 712, 742].map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center" style={{ height: "160px" }}>
                  <div
                    className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary/40 to-primary"
                    style={{ height: `${(val / 800) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">S{i + 1}</span>
                <span className="text-xs font-medium text-foreground">{val}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
