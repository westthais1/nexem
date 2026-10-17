import { createFileRoute } from "@tanstack/react-router";
import { Clock3, GraduationCap } from "lucide-react";

import { PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/guia-enem")({
  head: () => ({
    meta: [
      { title: "Guia do ENEM — Nexem" },
      {
        name: "description",
        content:
          "A estrutura do ENEM explicada: dois dias de prova, quatro áreas do conhecimento e a redação de até 1.000 pontos.",
      },
      { property: "og:title", content: "Guia do ENEM — Nexem" },
      {
        property: "og:description",
        content: "Dois dias, quatro áreas e a redação: entenda a prova antes de treinar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuiaEnemPage,
});

function GuiaEnemPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-border bg-secondary/40 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase text-accent">O que vale conhecer</p>
          <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Sua preparação, de ponta a ponta.</h1>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <article className="border-t border-border pt-6">
            <Clock3 className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Dois dias. Quatro áreas.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Dia 1 · 5h30:</strong> 45 questões de Linguagens, 45 de
              Ciências Humanas e a redação.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Dia 2 · 5h:</strong> 45 questões de Ciências da Natureza e
              45 de Matemática.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Na Prova Completa, pratique o tempo e o cartão-resposta sem revelar correções antes da entrega.
            </p>
          </article>
          <article className="border-t border-border pt-6">
            <GraduationCap className="h-7 w-7 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">Redação também é treino.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              A redação tem uma avaliação própria, separada da TRI: são cinco competências de até 200 pontos,
              totalizando até 1.000. Pratique argumentação, coesão e uma proposta de intervenção que respeite
              os direitos humanos.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Combine questões, escrita e revisão. Use o Raio-X do ENEM para conhecer conteúdos historicamente
              frequentes e as Estatísticas para acompanhar seu desempenho; frequência passada não garante o que
              cairá na próxima prova.
            </p>
          </article>
        </div>
      </section>
    </PublicPageShell>
  );
}
