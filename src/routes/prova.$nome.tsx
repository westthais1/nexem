import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { EXAM_DURATION_SECONDS, fetchExamQuestions, formatClock, type ExamQuestion } from "@/lib/exams";
import { registrarProva } from "@/lib/exam.functions";
import { XP_REWARDS, awardXp } from "@/lib/xp";

export const Route = createFileRoute("/prova/$nome")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.nome} — Prova Completa | Nexem` },
      {
        name: "description",
        content: `Faça a prova ${params.nome} em modo simulação cronometrada de 5h30, com correção somente após o envio.`,
      },
      { property: "og:title", content: `${params.nome} — Prova Completa` },
      {
        property: "og:description",
        content: "Simulação cronometrada de prova completa do ENEM com correção ao final.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvaRunnerPage,
});

const LETTERS = ["A", "B", "C", "D", "E"] as const;

function optionText(q: ExamQuestion, letter: string): string {
  switch (letter) {
    case "A":
      return q.opcao_a;
    case "B":
      return q.opcao_b;
    case "C":
      return q.opcao_c;
    case "D":
      return q.opcao_d;
    default:
      return q.opcao_e;
  }
}

function ProvaRunnerPage() {
  const { nome } = Route.useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["prova", nome],
    queryFn: () => fetchExamQuestions(nome),
  });

  const questions = useMemo(() => data ?? [], [data]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(EXAM_DURATION_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const [byTimeout, setByTimeout] = useState(false);
  const savedRef = useRef(false);

  const finish = useCallback(
    (timeout: boolean) => {
      if (savedRef.current) return;
      savedRef.current = true;
      setSubmitted(true);
      setByTimeout(timeout);

      const acertos = questions.filter(
        (q) => answers[String(q.id)] === q.resposta_correta?.trim().toUpperCase(),
      ).length;
      const total = questions.length;
      const nota = total > 0 ? Math.round((acertos / total) * 1000) : 0;

      awardXp("provaCompleta", { label: `Prova Completa · ${nome}` });

      void registrarProva({
        data: {
          nome_prova: nome,
          respostas: answers,
          acertos,
          total_questoes: total,
          nota,
          tempo_gasto_segundos: EXAM_DURATION_SECONDS - remaining,
          finalizado_por_tempo: timeout,
        },
      }).catch((e) => console.error("[Prova] Falha ao registrar prova", e));
    },
    [answers, nome, questions, remaining],
  );

  useEffect(() => {
    if (submitted || questions.length === 0) return;
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [submitted, questions.length]);

  useEffect(() => {
    if (remaining === 0 && !submitted && questions.length > 0) finish(true);
  }, [remaining, submitted, questions.length, finish]);

  if (isLoading) {
    return (
      <Shell nome={nome}>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando a prova...
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell nome={nome}>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {(error as Error).message}
        </div>
      </Shell>
    );
  }

  if (questions.length === 0) {
    return (
      <Shell nome={nome}>
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Esta prova ainda não tem questões cadastradas.
        </div>
      </Shell>
    );
  }

  const current = questions[Math.min(index, questions.length - 1)]!;
  const currentKey = String(current.id);
  const answered = Object.keys(answers).length;
  const acertos = questions.filter(
    (q) => answers[String(q.id)] === q.resposta_correta?.trim().toUpperCase(),
  ).length;
  const nota = Math.round((acertos / questions.length) * 1000);

  return (
    <Shell nome={nome}>
      {submitted && (
        <section className="mb-6 rounded-2xl border border-primary/40 bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">
            Prova finalizada{byTimeout ? " — tempo esgotado" : ""}
          </h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nota final</p>
              <p className="text-4xl font-semibold text-foreground text-glow-neon">{nota}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acertos</p>
              <p className="text-4xl font-semibold text-foreground">
                {acertos}/{questions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo usado</p>
              <p className="text-4xl font-mono font-semibold tabular-nums text-foreground">
                {formatClock(EXAM_DURATION_SECONDS - remaining)}
              </p>
            </div>
          </div>
          <Link
            to="/prova"
            className="mt-5 inline-flex rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
          >
            Voltar às provas
          </Link>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <section className="rounded-2xl border border-border bg-card p-6 card-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Questão {current.numero_questao} de {questions.length}
            </span>
            {current.area_conhecimento && (
              <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                {current.area_conhecimento}
                {current.materia ? ` · ${current.materia}` : ""}
              </span>
            )}
          </div>

          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-foreground">
            {current.enunciado}
          </p>

          <div className="mt-6 space-y-3">
            {LETTERS.map((letter) => {
              const selected = answers[currentKey] === letter;
              const correct = current.resposta_correta?.trim().toUpperCase() === letter;
              let cls =
                "border-border bg-background/40 hover:border-primary/40 hover:bg-accent/5";
              if (submitted) {
                if (correct) cls = "border-success/60 bg-success/10";
                else if (selected) cls = "border-destructive/60 bg-destructive/10";
                else cls = "border-border bg-background/40";
              } else if (selected) {
                cls = "border-accent bg-accent/10";
              }
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [currentKey]: letter }))}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm text-foreground transition-colors disabled:cursor-default ${cls}`}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold">
                    {letter}
                  </span>
                  <span>{optionText(current, letter)}</span>
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                💡 Explicação Detalhada do Gabarito
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Resposta correta: <strong className="text-foreground">{current.resposta_correta}</strong>.{" "}
                {current.explicacao ?? "Esta questão ainda não tem explicação cadastrada."}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index >= questions.length - 1}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-center card-glow">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tempo restante
            </p>
            <p
              className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${remaining < 600 ? "text-destructive" : "text-foreground text-glow-neon"}`}
            >
              {formatClock(remaining)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {answered} de {questions.length} respondidas
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Navegação</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const key = String(q.id);
                const isAnswered = Boolean(answers[key]);
                const isCurrent = i === index;
                let cls = "border-border bg-background/40 text-muted-foreground";
                if (submitted) {
                  cls =
                    answers[key] === q.resposta_correta?.trim().toUpperCase()
                      ? "border-success/60 bg-success/15 text-foreground"
                      : "border-destructive/50 bg-destructive/10 text-foreground";
                } else if (isAnswered) {
                  cls = "border-accent/60 bg-accent/15 text-foreground";
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-9 rounded-md border text-xs font-semibold transition-colors ${cls} ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  >
                    {q.numero_questao}
                  </button>
                );
              })}
            </div>
          </div>

          {!submitted && (
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
            >
              Finalizar e corrigir prova
            </button>
          )}
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <h1 className="mb-6 text-2xl font-semibold text-foreground md:text-3xl">{nome}</h1>
        {children}
      </div>
    </main>
  );
}
