import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { fetchExams } from "@/lib/exams";

export const Route = createFileRoute("/prova/")({
  head: () => ({
    meta: [
      { title: "Provas Completas — Nexem" },
      {
        name: "description",
        content:
          "Escolha uma prova completa do ENEM e faça a simulação cronometrada de 5h30, com correção apenas ao final.",
      },
      { property: "og:title", content: "Provas Completas — Nexem" },
      {
        property: "og:description",
        content: "Simulação cronometrada de provas completas do ENEM com correção ao final.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvasPage,
});

function ProvasPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["provas"],
    queryFn: fetchExams,
  });

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8 md:px-10 md:py-12">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Prova Completa</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Simulação no formato real: tempo de 5h30, navegação livre entre as questões e nenhuma
          correção durante a prova. O gabarito e as explicações aparecem só depois de finalizar.
        </p>

        <div className="mt-8 space-y-4">
          {isLoading && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando provas disponíveis...
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              {(error as Error).message}
            </div>
          )}

          {!isLoading && !isError && (data ?? []).length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nenhuma prova cadastrada ainda.
            </div>
          )}

          {(data ?? []).map((exam) => (
            <div
              key={exam.nome_prova}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 card-glow sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{exam.nome_prova}</h2>
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    +{XP_REWARDS.provaCompleta} XP
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {exam.total} {exam.total === 1 ? "questão" : "questões"} · 5h30 de duração
                </p>
              </div>
              <Link
                to="/prova/$nome"
                params={{ nome: exam.nome_prova }}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_28px_-6px_var(--neon)]"
              >
                Iniciar prova
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
