import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { TutorChat } from "@/components/TutorChat";

export const Route = createFileRoute("/simulado")({
  head: () => ({
    meta: [
      { title: "Simulado — ENEM AI Tutor" },
      {
        name: "description",
        content:
          "Pratique questões do ENEM por área e peça dicas a um tutor de IA socrático que orienta sem entregar a resposta.",
      },
      { property: "og:title", content: "Simulado — ENEM AI Tutor" },
      {
        property: "og:description",
        content: "Questões do ENEM por área com tutor de IA socrático que dá dicas, não respostas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimuladoPage,
});

const AREAS = ["Exatas", "Humanas", "Natureza", "Linguagens"] as const;
type Area = (typeof AREAS)[number];

type Question = {
  id: string;
  area: Area;
  topic: string;
  statement: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    area: "Exatas",
    topic: "Funções e proporcionalidade",
    statement:
      "Uma empresa de streaming cobra uma taxa fixa mensal de R$ 12,00 mais R$ 1,50 por hora assistida acima de 20 horas. Um assinante que assistiu 46 horas em determinado mês deseja saber quanto pagará na fatura correspondente a esse período.\n\nO valor total da fatura desse assinante, em reais, é",
    options: ["39,00", "45,00", "51,00", "69,00", "81,00"],
  },
  {
    id: "q2",
    area: "Exatas",
    topic: "Estatística",
    statement:
      "Em uma turma de 25 alunos, a média das notas de uma prova foi 6,4. Após a correção de um erro, a nota de um único aluno subiu de 4,0 para 9,0, e a média foi recalculada.\n\nA nova média da turma é",
    options: ["6,4", "6,6", "6,8", "7,0", "7,4"],
  },
  {
    id: "q3",
    area: "Humanas",
    topic: "Brasil República",
    statement:
      "A Constituição de 1988 ficou conhecida como \"Constituição Cidadã\" por ampliar direitos sociais e mecanismos de participação popular após o período do regime militar.\n\nEssa denominação relaciona-se principalmente ao fato de o texto constitucional ter",
    options: [
      "restringido o voto a cidadãos alfabetizados.",
      "consolidado direitos sociais e instrumentos de participação democrática.",
      "centralizado o poder político no Executivo federal.",
      "eliminado a autonomia dos municípios brasileiros.",
      "mantido a censura prévia aos meios de comunicação.",
    ],
  },
  {
    id: "q4",
    area: "Natureza",
    topic: "Ecologia",
    statement:
      "O aumento da concentração de nutrientes, sobretudo nitrogênio e fósforo, em um lago provoca a proliferação acelerada de algas na superfície. Com o tempo, observa-se mortandade de peixes no corpo d'água.\n\nA mortandade descrita ocorre principalmente porque a proliferação de algas",
    options: [
      "eleva a temperatura média da água do lago.",
      "reduz a disponibilidade de oxigênio dissolvido na água.",
      "aumenta a salinidade da água superficial.",
      "impede a evaporação da água do lago.",
      "diminui a quantidade de matéria orgânica disponível.",
    ],
  },
  {
    id: "q5",
    area: "Linguagens",
    topic: "Interpretação de texto",
    statement:
      "\"Não é a linguagem que espelha o mundo; é o mundo que se organiza pela linguagem que usamos para nomeá-lo.\"\n\nNo trecho, o autor defende que a linguagem exerce papel",
    options: [
      "meramente decorativo na comunicação cotidiana.",
      "secundário em relação à percepção sensorial.",
      "constitutivo na forma como interpretamos a realidade.",
      "restrito aos contextos formais de escrita.",
      "irrelevante na construção de identidades sociais.",
    ],
  },
];

const LETTERS = ["A", "B", "C", "D", "E"];

function SimuladoPage() {
  const [area, setArea] = useState<Area | "Todas">("Todas");
  const [selectedId, setSelectedId] = useState<string>(QUESTIONS[0]!.id);
  const [choice, setChoice] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const filtered = area === "Todas" ? QUESTIONS : QUESTIONS.filter((q) => q.area === area);
  const current = filtered.find((q) => q.id === selectedId) ?? filtered[0];

  function pickArea(next: Area | "Todas") {
    setArea(next);
    const list = next === "Todas" ? QUESTIONS : QUESTIONS.filter((q) => q.area === next);
    setSelectedId(list[0]?.id ?? "");
    setChoice(null);
  }

  function pickQuestion(id: string) {
    setSelectedId(id);
    setChoice(null);
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Simulado adaptativo</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Pratique questão por questão</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Filtre por área, leia com calma e, se travar, chame o tutor de IA — ele orienta com pistas, sem entregar a
            resposta.
          </p>
        </header>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          {(["Todas", ...AREAS] as const).map((a) => (
            <button
              key={a}
              onClick={() => pickArea(a)}
              aria-pressed={area === a}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                area === a
                  ? "border-primary/50 bg-primary/15 text-foreground border-glow-neon"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap gap-2">
              {filtered.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => pickQuestion(q.id)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium transition-all ${
                    current?.id === q.id
                      ? "border-primary/50 bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {current ? (
              <article className="rounded-2xl border border-border bg-card p-6 card-glow md:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                    {current.area}
                  </span>
                  <span className="text-xs text-muted-foreground">{current.topic}</span>
                </div>

                <div className="mt-6 space-y-5">
                  {current.statement.split("\n\n").map((p, i) => (
                    <p key={i} className="text-[17px] leading-8 tracking-[0.01em] text-foreground/90">
                      {p}
                    </p>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  {current.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setChoice(i)}
                      className={`flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        choice === i
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-background/30 hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                          choice === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="text-[15px] leading-7 text-foreground/90">{opt}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  {!chatOpen && (
                    <TutorChat
                      key={`${current.id}-btn`}
                      open={false}
                      onOpenChange={setChatOpen}
                      question={current.statement}
                      options={current.options}
                      area={current.area}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    O tutor dá pistas progressivas — a resposta final fica por sua conta.
                  </p>
                </div>
              </article>
            ) : (
              <p className="text-muted-foreground">Nenhuma questão nesta área ainda.</p>
            )}
          </div>

          {chatOpen && current && (
            <div className="lg:sticky lg:top-8">
              <TutorChat
                key={current.id}
                open
                onOpenChange={setChatOpen}
                question={current.statement}
                options={current.options}
                area={current.area}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
