import { createFileRoute, Link } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { TriSimulator } from "@/components/TriSimulator";
import { getStudentStats } from "@/lib/stats.functions";
import { AREA_INFO } from "@/lib/stats-areas";
import { getTriEstimate } from "@/lib/tri.functions";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas — Nexem" },
      { name: "description", content: "Veja seu desempenho por área do conhecimento, evolução e pontos de melhoria no ENEM." },
      { property: "og:title", content: "Estatísticas — Nexem" },
      { property: "og:description", content: "Estatísticas de desempenho no Nexem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const statsFn = useServerFn(getStudentStats);
  const triFn = useServerFn(getTriEstimate);
  const stats = useQuery({ queryKey: ["student-stats"], queryFn: () => statsFn(), retry: false });
  const tri = useQuery({ queryKey: ["tri-estimate"], queryFn: () => triFn(), retry: false });
  const d = stats.data;
  const temTri = tri.data && tri.data.status !== "sem_dados";
  const notaTri = temTri ? tri.data!.nota : null;
  const gap = notaTri != null && d?.notaAlvo != null ? d.notaAlvo - notaTri : null;
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  const cards = [
    { label: "Nota TRI estimada", value: notaTri != null ? fmt(notaTri) : "—", hint: d?.notaAlvo != null ? `Meta: ${fmt(d.notaAlvo)}${gap != null ? (gap > 0 ? ` · faltam ${fmt(gap)}` : " · meta atingida!") : ""}` : "Defina sua meta no perfil" },
    { label: "Questões resolvidas", value: d ? fmt(d.questoesResolvidas) : "—" },
    { label: "Dias de estudo", value: d ? fmt(d.diasDeEstudo) : "—" },
    { label: "Redações corrigidas", value: d ? fmt(d.redacoesCorrigidas) : "—", hint: d?.mediaRedacoes != null ? `Média: ${fmt(d.mediaRedacoes)}` : undefined },
    { label: "Provas completas feitas", value: d ? fmt(d.provasFeitas) : "—", hint: d?.ultimaProva ? `Última: ${fmt(d.ultimaProva.nota)} (${d.ultimaProva.acertos}/${d.ultimaProva.total})` : undefined },
  ];

  const serie = tri.data?.serieSemanal ?? [];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Estatísticas</span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Seu desempenho em detalhes</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Números reais da sua conta: questões, redações e provas que você já fez.
          </p>
        </header>

        {stats.isError && (
          <p className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground">
            Não foi possível carregar suas estatísticas. Atualize a página para tentar de novo.
          </p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 card-glow">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {stats.isPending && stat.label !== "Nota TRI estimada" ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : stat.value}
              </p>
              {stat.hint && <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>}
            </div>
          ))}
        </div>

        <TriSimulator />

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Acertos por área</h2>
          {d && d.questoesResolvidas === 0 ? (
            <EmptyState text="Responda questões no Desafio Diário para ver seus acertos por área." />
          ) : (
            <div className="mt-5 space-y-5">
              {(d?.areas ?? []).map((area) => {
                const info = AREA_INFO[area.key];
                return (
                  <div key={area.key}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{info.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {area.pct != null ? `${area.pct}% · ${area.acertos}/${area.total}` : "Sem questões ainda"}
                        </span>
                        <Link
                          to="/simulado"
                          search={{ subject: info.subject }}
                          className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary"
                        >
                          Treinar este assunto
                        </Link>
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${area.pct ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Evolução semanal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nota TRI estimada ao fim de cada um dos últimos 7 dias.</p>
          {tri.data && !temTri ? (
            <EmptyState text="Responda questões no Desafio Diário para acompanhar sua evolução." />
          ) : (
            <div className="mt-6 flex items-end gap-3">
              {serie.map((p) => {
                const vazio = p.tentativas === 0 || p.nota == null;
                return (
                  <div key={p.dia} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-end justify-center" style={{ height: "160px" }}>
                      <div
                        className={`w-full max-w-[48px] rounded-t-lg ${vazio ? "border border-dashed border-border bg-transparent" : "bg-gradient-to-t from-primary/40 to-primary"}`}
                        style={{ height: vazio ? "4%" : `${Math.max(4, (p.nota! / 1000) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(`${p.dia}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    <span className="text-xs font-medium text-foreground">{vazio ? "—" : p.nota}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-background/40 p-5">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to="/desafio" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
        Ir para o Desafio Diário
      </Link>
    </div>
  );
}
