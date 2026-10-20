import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Check, Crown, FileText, Layers, Minus, Sparkles, Zap } from "lucide-react";

import { PublicPageShell } from "@/components/PublicPageShell";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PRO_PLANS } from "@/lib/subscription";

const TITLE = "Nexem Pro — vantagens e comparação com o plano grátis";
const DESC = "Descubra o que o Nexem Pro desbloqueia: Níveis de Maestria, Prova Completa nos dois dias e Tutor Nex ilimitado. Compare com o plano grátis.";

export const Route = createFileRoute("/nexem-pro")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nexem.com.br/nexem-pro" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nexem.com.br/nexem-pro" }],
  }),
  component: NexemProPage,
});

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BENEFITS = [
  { icon: Layers, title: "Níveis de Maestria completos", text: "15 trilhas com 3 níveis cada — de Fundações a Domínio Avançado — para dominar cada assunto no seu ritmo." },
  { icon: FileText, title: "Prova Completa nos dois dias", text: "180 questões no formato oficial, com cronômetro, cartão-resposta e correção pela TRI ao entregar." },
  { icon: Brain, title: "Tutor Nex ilimitado", text: "Peça quantas pistas socráticas quiser. O Nex guia seu raciocínio sem entregar a resposta." },
  { icon: Zap, title: "Desafio Diário sempre grátis", text: "Seu hábito diário de 10 questões continua liberado para todos, com ou sem Pro." },
];

type Cell = boolean | string;
const COMPARE: { feature: string; free: Cell; pro: Cell }[] = [
  { feature: "Desafio Diário (10 questões)", free: true, pro: true },
  { feature: "Tutor Nex", free: "3 consultas a cada 24h", pro: "Ilimitado" },
  { feature: "Níveis de Maestria", free: false, pro: true },
  { feature: "Prova Completa (2 dias, 180 questões)", free: false, pro: true },
  { feature: "Redação, Raio-X e Estatísticas", free: true, pro: true },
];

const FAQ = [
  { q: "Posso cancelar quando quiser?", a: "Sim. No plano mensal você cancela quando quiser, sem multa." },
  { q: "O que continua grátis?", a: "O Desafio Diário, a Redação Inteligente, o Raio-X do ENEM, as Estatísticas e 3 consultas ao Tutor Nex a cada 24 horas." },
  { q: "Meu progresso é mantido se eu assinar depois?", a: "Sim. Tudo o que você fez no plano grátis continua salvo na sua conta." },
];

function CellView({ value }: { value: Cell }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-primary" aria-label="Incluído" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-muted-foreground" aria-label="Não incluído" />;
  return <span className="text-sm font-medium">{value}</span>;
}

function NexemProPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
          <Crown className="h-4 w-4" /> Nexem Pro
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-6xl">Nexem Pro: seu próximo nível no ENEM</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Mais profundidade no treino, a prova completa no formato oficial e o Tutor Nex sempre ao seu lado.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/landing" search={{ preview: true }}>Começar grátis <ArrowRight /></Link>
        </Button>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-8 text-center font-display text-3xl font-bold">O que o Pro desbloqueia</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <h2 className="mb-8 text-center font-display text-3xl font-bold">Grátis x Pro</h2>
        <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
          <table className="w-full text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 font-semibold">Recurso</th>
                <th className="p-4 text-center font-semibold">Grátis</th>
                <th className="bg-primary/10 p-4 text-center font-semibold text-primary">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.feature} className="border-t border-border">
                  <td className="p-4">{row.feature}</td>
                  <td className="p-4 text-center"><CellView value={row.free} /></td>
                  <td className="bg-primary/5 p-4 text-center"><CellView value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {COMPARE.map((row) => (
            <div key={row.feature} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold">{row.feature}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2"><p className="mb-1 text-xs text-muted-foreground">Grátis</p><CellView value={row.free} /></div>
                <div className="rounded-lg bg-primary/10 p-2"><p className="mb-1 text-xs text-primary">Pro</p><CellView value={row.pro} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <h2 className="mb-8 text-center font-display text-3xl font-bold">Planos</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {(["monthly", "annual"] as const).map((key) => (
            <div key={key} className={`relative rounded-2xl border p-6 ${key === "annual" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              {key === "annual" && (
                <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Mais Popular · Economia de 50%
                </span>
              )}
              <p className="font-semibold">{PRO_PLANS[key].label}</p>
              <p className="mt-3 text-4xl font-bold">{money(PRO_PLANS[key].monthlyCents)}<span className="text-base font-normal text-muted-foreground"> / mês</span></p>
              <p className="mt-2 text-sm text-muted-foreground">
                {key === "monthly" ? "Flexibilidade total, cancele quando quiser." : `Cobrado em parcela única de ${money(PRO_PLANS.annual.billedCents)}.`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="mb-6 text-center font-display text-3xl font-bold">Perguntas rápidas</h2>
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
          {FAQ.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
        <div className="rounded-3xl bg-primary/10 p-10">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold">Comece grátis hoje</h2>
          <p className="mt-3 text-muted-foreground">Faça seu primeiro Desafio Diário e descubra seu nível.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/landing" search={{ preview: true }}>Criar minha conta <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </PublicPageShell>
  );
}
