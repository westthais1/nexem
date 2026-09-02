import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/redacao")({
  head: () => ({
    meta: [
      { title: "Redação Inteligente — ENEM AI Tutor" },
      { name: "description", content: "Escreva sua redação do ENEM e receba correção competência por competência pela IA." },
      { property: "og:title", content: "Redação Inteligente — ENEM AI Tutor" },
      { property: "og:description", content: "Correção inteligente de redação para o ENEM com IA." },
    ],
  }),
  component: RedacaoPage,
});

function RedacaoPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-accent">Redação Inteligente</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Correção competência por competência</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Cole sua redação e receba análise detalhada com sugestões de melhoria em segundos.
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6 card-glow">
            <label htmlFor="essay" className="text-sm font-medium text-foreground">
              Sua redação
            </label>
            <textarea
              id="essay"
              placeholder="Escreva ou cole sua redação aqui (mín. 30 linhas)…"
              className="mt-3 h-64 w-full resize-none rounded-lg border border-input bg-background/40 p-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tema: “A importância do voto consciente na democracia”</span>
              <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 hover:shadow-[0_0_24px_-6px_var(--electric)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5L12 3z" /></svg>
                Corrigir com IA
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold text-foreground text-glow-electric">920</span>
                <span className="mb-1 text-sm text-muted-foreground">/ 1000</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Nota estimada</p>
              <div className="mt-5 space-y-3">
                {[
                  { c: "Competência 1", note: 200, max: 200 },
                  { c: "Competência 2", note: 180, max: 200 },
                  { c: "Competência 3", note: 160, max: 200 },
                  { c: "Competência 4", note: 200, max: 200 },
                  { c: "Competência 5", note: 180, max: 200 },
                ].map((row) => (
                  <div key={row.c}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.c}</span>
                      <span className="font-medium text-foreground">{row.note}/{row.max}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: `${(row.note / row.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <h3 className="text-sm font-semibold text-foreground">Sugestões da IA</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-accent">›</span> Reforce o repertório sociológico na C3.</li>
                <li className="flex gap-2"><span className="text-accent">›</span> Proposta de intervenção precisa de agente.</li>
                <li className="flex gap-2"><span className="text-accent">›</span> Conecte melhor os parágrafos de desenvolvimento.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
