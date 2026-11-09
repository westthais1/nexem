import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  COMPETENCIAS,
  MATERIAS,
  TEMAS_QUENTES,
  TEMAS_RECENTES,
  TOP_PRIORIDADES,
  peso,
  type Materia,
} from "@/lib/enem-frequencia";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardData } from "@/lib/stats.functions";
import { AREA_INFO, areaOfMateria } from "@/lib/stats-areas";
import { subjectOf } from "@/lib/mastery";

type Prioridade = { slugs: Set<string>; area: string | null };
const NO_PRIORITY: Prioridade = { slugs: new Set(), area: null };

function isPriority(p: Prioridade, topico: string, materia: string): boolean {
  const slug = subjectOf(`${topico} ${materia}`, null)?.slug;
  if (slug && p.slugs.has(slug)) return true;
  return p.area !== null && areaOfMateria(materia) === p.area;
}

function PriorityBadge() {
  return <span className="ml-2 inline-flex shrink-0 items-center rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">Prioridade para você</span>;
}

export const Route = createFileRoute("/raio-x")({
  component: RaioXPage,
  head: () => ({
    meta: [
      { title: "Raio-X do ENEM — Nexem" },
      {
        name: "description",
        content:
          "Frequência histórica de cada assunto no ENEM (2009–2024), como a TRI calcula sua nota e o que priorizar para render mais pontos por hora de estudo.",
      },
      { property: "og:title", content: "Raio-X do ENEM — Nexem" },
      {
        property: "og:description",
        content:
          "O que mais cai no ENEM por matéria, mecânica da TRI e estratégia de redação em um só painel.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const AREAS = ["Todas", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Linguagens"] as const;

function barColor(p: number) {
  if (p >= 20) return "from-primary to-accent";
  if (p >= 10) return "from-accent to-accent/60";
  return "from-muted-foreground/60 to-muted-foreground/30";
}

function MateriaCard({ materia, prioridade }: { materia: Materia; prioridade: Prioridade }) {
  const maior = Math.max(...materia.topicos.map(peso));
  return (
    <article className="rounded-2xl border border-border bg-card p-5 card-glow">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{materia.nome}</h3>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {materia.area}
        </span>
      </div>
      {materia.resumo ? (
        <p className="mt-1 text-xs text-muted-foreground">{materia.resumo}</p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {[...materia.topicos].sort((a, b) => peso(b) - peso(a)).map((t) => {
          const p = peso(t);
          const faixa = t.min === t.max ? `~${t.min}%` : `${t.min}–${t.max}%`;
          return (
            <li key={t.nome}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm text-foreground">{t.nome}{isPriority(prioridade, t.nome, materia.nome) && <PriorityBadge />}</p>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">{faixa}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor(p)}`}
                  style={{ width: `${Math.max(6, Math.round((p / maior) * 100))}%` }}
                />
              </div>
              {t.nota ? <p className="mt-1 text-[11px] text-primary">{t.nota}</p> : null}
              <Link
                to="/simulado"
                search={{ subject: `${t.nome} ${materia.nome}` }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary"
              >
                Treinar este assunto →
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function RaioXPage() {
  const [area, setArea] = useState<(typeof AREAS)[number]>("Todas");
  const materias = area === "Todas" ? MATERIAS : MATERIAS.filter((m) => m.area === area);
  const dashFn = useServerFn(getDashboardData);
  const dash = useQuery({ queryKey: ["dashboard-data"], queryFn: () => dashFn(), staleTime: 30_000 });
  const prioridade: Prioridade = dash.data
    ? { slugs: new Set(dash.data.materiasFracas.map((m) => m.slug)), area: dash.data.areaMaisFraca?.key ?? null }
    : NO_PRIORITY;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Frequência histórica 2009–2024
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Raio-X do ENEM
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          O que realmente cai na prova, em ordem de peso. Estude de cima para baixo: os primeiros
          itens rendem muito mais ponto por hora do que os últimos.
        </p>
        {dash.data && (dash.data.materiasFracas.length > 0 || dash.data.areaMaisFraca) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
            <span className="text-foreground">
              Seus pontos fracos: <strong>{[...dash.data.materiasFracas.map((m) => m.label), ...(dash.data.areaMaisFraca ? [AREA_INFO[dash.data.areaMaisFraca.key].name] : [])].filter((v, i, a) => a.indexOf(v) === i).join(", ")}</strong>. Os assuntos marcados como “Prioridade para você” combinam com eles.
            </span>
            <Link to="/estatisticas" className="font-semibold text-primary hover:underline">Ver minhas estatísticas →</Link>
          </div>
        )}
      </header>

      {/* Como a prova funciona */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Como a prova é organizada</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Dia 1 —</span> Linguagens (45q) + Ciências
              Humanas (45q) + Redação
            </li>
            <li>
              <span className="font-medium text-foreground">Dia 2 —</span> Ciências da Natureza (45q) +
              Matemática (45q)
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/40 bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Sua nota é TRI, não acertos ÷ total</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Questões difíceis valem mais que fáceis.</li>
            <li>• Acertar difícil e errar fácil é lido como chute — e penaliza sua nota.</li>
            <li>
              • Blocos de acertos seguidos valem mais que o mesmo número de acertos espalhados
              (“ilhas de acerto”).
            </li>
          </ul>
          <Link
            to="/estatisticas"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary"
          >
            Ver minha estimativa TRI
          </Link>
        </div>
      </section>

      {/* Top prioridades */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Top 10 do ponto por hora</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os assuntos com maior frequência média em toda a prova. Comece por aqui.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {TOP_PRIORIDADES.map((t, i) => (
            <li
              key={`${t.materia}-${t.nome}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{t.nome}{isPriority(prioridade, t.nome, t.materia) && <PriorityBadge />}</p>
                <p className="truncate text-xs text-muted-foreground">{t.materia}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                ~{Math.round(peso(t))}%
              </span>
              <Link
                to="/simulado"
                search={{ subject: `${t.nome} ${t.materia}` }}
                className="shrink-0 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary"
              >
                Treinar
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Filtro por área */}
      <section className="mt-10">
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                area === a
                  ? "border-primary bg-primary/15 font-semibold text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {materias.map((m) => (
            <MateriaCard key={m.nome} materia={m} prioridade={prioridade} />
          ))}
        </div>
      </section>

      {/* Redação */}
      <section className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <h2 className="text-lg font-semibold text-foreground">Redação: 1000 pontos em 5 competências</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada competência vale 200. Fuga total do tema ou zero em qualquer competência zera a
            redação inteira.
          </p>
          <ul className="mt-4 space-y-3">
            {COMPETENCIAS.map((c) => (
              <li key={c.n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-semibold text-accent">
                  C{c.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
            <p className="text-sm font-medium text-foreground">Estrutura que funciona (4–5 parágrafos)</p>
            <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>1. Introdução: contextualização + tese com os 2 argumentos.</li>
              <li>2. Desenvolvimento 1: argumento + repertório + conclusão parcial.</li>
              <li>3. Desenvolvimento 2: argumento + repertório + conclusão parcial.</li>
              <li>4. Conclusão: retomada da tese + proposta de intervenção completa.</li>
            </ol>
          </div>
          <Link
            to="/redacao"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Treinar redação agora
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Temas já usados (não se repetem)</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {TEMAS_RECENTES.map((t) => (
                <li key={t.ano} className="flex gap-2">
                  <span className="w-10 shrink-0 font-medium text-foreground">{t.ano}</span>
                  <span className="min-w-0">{t.tema}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/40 bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Temas quentes ainda não cobrados</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMAS_QUENTES.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              O padrão do INEP é problema social estrutural brasileiro: desigualdade, grupos
              invisibilizados, direitos humanos, meio ambiente, saúde e educação.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Como transformar isso em estudo</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            • Interpretação de texto (~34–48% de Linguagens) é o item mais rentável de toda a prova:
            treine leitura todos os dias, mesmo em dias de exatas.
          </li>
          <li>• Em Matemática, Geometria + proporção já cobrem quase metade das questões.</li>
          <li>• Em Natureza, priorize Mecânica, Eletricidade, Físico-Química e Ecologia.</li>
          <li>• Em Humanas, Contemporânea, Brasil Colônia/Império, Meio ambiente e Mundo do trabalho.</li>
          <li>• Gramática pura (~2%) é o pior custo-benefício: deixe por último.</li>
        </ul>
        <Link
          to="/simulado"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Praticar no Treine com Tutor Nex
        </Link>
      </section>
    </main>
  );
}
