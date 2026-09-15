import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthModal } from "@/components/AuthModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { ensureProgressForUser } from "@/lib/progress";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Nexem — 10 questões. 15 minutos. Todo dia." },
      {
        name: "description",
        content:
          "Treino inteligente para o ENEM: desafio diário de 10 questões, níveis de maestria por matéria e o Tutor Nex para orientar seu raciocínio.",
      },
      { property: "og:title", content: "Nexem — 10 questões. 15 minutos. Todo dia." },
      {
        property: "og:description",
        content:
          "Um treino que evolui com você: questões no estilo ENEM adaptadas ao seu nível e o Tutor Nex quando precisar de ajuda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    emoji: "🔥",
    title: "Desafio Diário",
    text: "10 questões por dia em cerca de 15 minutos. Um micro-hábito que mantém você treinando e evoluindo.",
  },
  {
    emoji: "🧠",
    title: "Tutor Nex",
    text: "Uma IA que orienta seu raciocínio com pistas e perguntas, sem simplesmente entregar a resposta.",
  },
  {
    emoji: "📐",
    title: "Níveis de Maestria",
    text: "Avance por matéria das Fundações ao Aprofundamento e ao Domínio Avançado.",
  },
  {
    emoji: "⏱️",
    title: "Simulado Completo",
    text: "Treine resistência e estratégia com uma experiência próxima da estrutura real do ENEM.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Entender",
    text: "O Nexem analisa seu histórico para identificar seu nível atual.",
  },
  {
    n: "02",
    title: "Adaptar",
    text: "Seus acertos e erros ajudam a ajustar o próximo nível de desafio.",
  },
  {
    n: "03",
    title: "Evoluir",
    text: "Você pratica exatamente onde precisa melhorar e avança progressivamente.",
  },
] as const;

const FAQ = [
  {
    q: "Como o Nexem seleciona as questões?",
    a: "As questões são organizadas por área, matéria, assunto e dificuldade para criar treinos adequados ao momento de cada aluno.",
  },
  {
    q: "O que significa treino adaptativo?",
    a: "O Nexem usa seu histórico de respostas para ajustar os próximos desafios ao seu desempenho.",
  },
  {
    q: "O Tutor Nex entrega a resposta?",
    a: "Não. Ele usa pistas, perguntas e explicações para ajudar você a construir o raciocínio.",
  },
  {
    q: "Preciso estudar horas por dia?",
    a: "Não. O Desafio Diário foi criado para transformar cerca de 15 minutos em um hábito consistente.",
  },
] as const;

function LandingPage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function goHomeIfLogged(userId: string) {
      await ensureProgressForUser(userId).catch(() => undefined);
      if (active) navigate({ to: "/" });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void goHomeIfLogged(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        setIsAuthModalOpen(false);
        void goHomeIfLogged(session.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const openAuth = () => setIsAuthModalOpen(true);

  function scrollToHow(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <img src={nexemLogo.url} alt="nexem" className="h-7 w-auto" />
          <button
            onClick={openAuth}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 45% at 18% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%), radial-gradient(45% 40% at 85% 10%, color-mix(in oklch, var(--accent) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center motion-safe:animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Nexem • Preparação inteligente para o ENEM
          </span>
          <h1
            className="mt-7 text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            10 questões.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              15 minutos.
            </span>{" "}
            Todo dia.
          </h1>
          <p
            className="mt-5 text-lg font-medium text-foreground/85 md:text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Um treino inteligente que evolui com você.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Pratique questões no estilo ENEM, receba desafios adaptados ao seu desempenho e conte com
            o Tutor Nex quando precisar de ajuda.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openAuth}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-primary/90"
            >
              Começar meu desafio gratuito
              <span aria-hidden="true">→</span>
            </button>
            <a
              href="#como-funciona"
              onClick={scrollToHow}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Como funciona <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <ProductMockup />
      </section>

      {/* FEATURES */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2
          className="text-center text-2xl font-bold tracking-tight text-foreground md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Quatro frentes de treino
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl motion-safe:animate-fade-in-up"
            >
              <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
                {f.emoji}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <button
                onClick={openAuth}
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-primary/30 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Experimentar
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ADAPTIVE SYSTEM — dark section */}
      <section className="relative overflow-hidden bg-foreground px-6 py-24 text-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(50% 50% at 15% 10%, color-mix(in oklch, var(--primary) 45%, transparent), transparent 70%), radial-gradient(45% 45% at 88% 85%, color-mix(in oklch, var(--accent) 40%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl">
          <h2
            className="max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seu treino não deveria ser igual ao de todo mundo.
          </h2>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                style={{ animationDelay: `${i * 110}ms` }}
                className="relative rounded-2xl border border-background/15 bg-background/8 p-6 backdrop-blur transition-all duration-500 hover:border-background/35 motion-safe:animate-fade-in-up"
              >
                <span className="text-sm font-semibold tracking-widest text-background/50">
                  {s.n}
                </span>
                <h3
                  className="mt-3 text-xl font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-background/70">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-sm font-medium tracking-wide text-background/70">
            Mais precisão. Menos desperdício. Mais evolução.
          </p>
        </div>
      </section>

      {/* DAILY HABIT CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2
          className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          15 minutos podem mudar sua preparação.
        </h2>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {["10 questões", "15 minutos", "todo dia"].map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden="true" className="text-xl text-muted-foreground">
                  →
                </span>
              )}
              <span className="rounded-xl border border-border bg-card px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
                {label}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
          Pequenos treinos consistentes podem ser mais úteis do que estudar horas sem saber onde
          concentrar seu esforço.
        </p>

        <button
          onClick={openAuth}
          className="mt-9 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90"
        >
          Começar meu primeiro desafio <span aria-hidden="true">→</span>
        </button>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2
          className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Perguntas frequentes
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-foreground px-6 py-24 text-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 0%, color-mix(in oklch, var(--accent) 45%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold leading-tight tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seu próximo passo não é estudar mais.
            <br />
            <span className="bg-gradient-to-r from-[var(--neon)] to-[var(--electric)] bg-clip-text text-transparent">
              É estudar melhor.
            </span>
          </h2>
          <p className="mt-5 text-base text-background/75">
            Comece com 10 questões e descubra seu próximo desafio.
          </p>
          <button
            onClick={openAuth}
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-background px-7 py-3.5 text-base font-semibold text-foreground transition-all duration-300 hover:scale-[1.03]"
          >
            Começar desafio gratuito <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          <img src={nexemLogo.url} alt="nexem" className="h-7 w-auto opacity-80" />
          <p className="text-center text-xs text-muted-foreground">
            Nexem — Estudo adaptativo para o ENEM. Pratique no seu nível e evolua todos os dias.
          </p>
        </div>
      </footer>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}

function ProductMockup() {
  return (
    <div
      className="mx-auto mt-16 max-w-4xl motion-safe:animate-fade-in-up"
      style={{ animationDelay: "160ms" }}
      aria-hidden="true"
    >
      <div className="rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-foreground/5 md:p-6">
        <div className="flex items-center gap-2 pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          {/* Daily challenge panel */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                🔥 Desafio Diário
              </span>
              <span className="text-xs font-medium text-muted-foreground">7 / 10</span>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" />
            </div>

            <p className="mt-5 text-sm font-medium leading-relaxed text-foreground">
              Uma população de bactérias dobra a cada 3 horas. Qual expressão representa o número de
              indivíduos após t horas?
            </p>

            <div className="mt-4 space-y-2">
              {[
                { k: "A", t: "N₀ · 2^(t/3)", state: "correct" },
                { k: "B", t: "N₀ · 3^(t/2)", state: "idle" },
                { k: "C", t: "N₀ + 2t", state: "idle" },
              ].map((o) => (
                <div
                  key={o.k}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${
                    o.state === "correct"
                      ? "border-success/50 bg-success/10 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border text-[10px] font-semibold">
                    {o.k}
                  </span>
                  {o.t}
                </div>
              ))}
            </div>
          </div>

          {/* Side stats */}
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dificuldade
              </p>
              <p
                className="mt-1 text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                62 / 100
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[62%] rounded-full bg-accent" />
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { l: "Matemática", v: 64 },
                  { l: "Linguagens", v: 71 },
                  { l: "Natureza", v: 48 },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{s.l}</span>
                      <span>{s.v}/85</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000"
                        style={{ width: `${(s.v / 85) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold text-primary">🧠 Tutor Nex</p>
              <p className="mt-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
                O que acontece com a quantidade a cada intervalo de 3 horas? Tente escrever isso como
                uma potência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
