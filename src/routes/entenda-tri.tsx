import { createFileRoute } from "@tanstack/react-router";

import { PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/entenda-tri")({
  head: () => ({
    meta: [
      { title: "Entenda a TRI — Nexem" },
      {
        name: "description",
        content:
          "Como funciona a Teoria de Resposta ao Item do ENEM: por que dois alunos com o mesmo número de acertos podem ter notas diferentes.",
      },
      { property: "og:title", content: "Entenda a TRI — Nexem" },
      {
        property: "og:description",
        content: "A TRI estima sua proficiência pelo conjunto de respostas e pelas características de cada questão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntendaTriPage,
});

const PILLARS = [
  {
    n: "01",
    title: "Cada questão tem características próprias",
    text: "O modelo considera dificuldade, capacidade de diferenciar níveis de conhecimento e probabilidade de acerto casual. Não existe uma pontuação fixa por questão.",
  },
  {
    n: "02",
    title: "O conjunto de respostas importa",
    text: "Acertar itens difíceis e errar muitos fáceis pode produzir uma estimativa diferente. Isso não prova um chute nem gera uma multa fixa na nota.",
  },
  {
    n: "03",
    title: "Base sólida, treino mais estratégico",
    text: "Consolide os fundamentos e avance para desafios maiores. Uma questão difícil não vale automaticamente mais, e acertos consecutivos não recebem um bônus oficial.",
  },
] as const;

function EntendaTriPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-border bg-secondary/40 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-primary">Além do número de acertos</p>
              <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Como funciona a TRI?</h1>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              A Teoria de Resposta ao Item estima sua proficiência pelo conjunto de respostas e pelas
              características de cada questão. Por isso, dois alunos com o mesmo total de acertos podem
              ter notas diferentes.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {PILLARS.map((item) => (
              <article key={item.n} className="border-t-2 border-primary pt-6">
                <span className="font-display text-3xl font-bold text-primary">{item.n}</span>
                <h2 className="mt-4 text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 border-l-4 border-accent pl-5">
            <p className="font-semibold text-foreground">No Nexem: estimativa para orientar, não nota oficial.</p>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              O treino adaptativo ajusta seus desafios a partir do desempenho. Isso é diferente do cálculo
              oficial da TRI do Inep: use o diagnóstico para decidir o que revisar, não como garantia da sua
              nota no ENEM.
            </p>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
