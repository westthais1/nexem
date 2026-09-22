import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ComponentType, type MouseEvent } from "react";

import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProgressForUser } from "@/lib/progress";
import { ensureProfile, markOnboarded } from "@/lib/profile";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Nexem — 10 questões. 15 minutos. Todo dia." },
      {
        name: "description",
        content:
          "Treino inteligente para o ENEM: desafio diário, níveis de maestria e o Tutor Nex para orientar seu raciocínio.",
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

type Feature = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tone: string;
  tag: string;
};

const FEATURES: Feature[] = [
  {
    icon: Flame,
    title: "Desafio Diário",
    text: "10 questões por dia em cerca de 15 minutos. Um micro-hábito que mantém você treinando e evoluindo.",
    tone: "bg-primary/15 text-primary",
    tag: "Ritmo diário",
  },
  {
    icon: BrainCircuit,
    title: "Tutor Nex",
    text: "Uma IA que orienta seu raciocínio com pistas e perguntas, sem simplesmente entregar a resposta.",
    tone: "bg-accent/15 text-accent",
    tag: "Ajuda inteligente",
  },
  {
    icon: Trophy,
    title: "Níveis de Maestria",
    text: "Avance por matéria das Fundações ao Aprofundamento e ao Domínio Avançado.",
    tone: "bg-warning/25 text-warning-foreground",
    tag: "Evolução visível",
  },
  {
    icon: Clock3,
    title: "Simulado Completo",
    text: "Treine resistência e estratégia com uma experiência próxima da estrutura real do ENEM.",
    tone: "bg-secondary text-secondary-foreground",
    tag: "Modo prova",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Gauge,
    title: "Entender",
    text: "O Nexem analisa seu histórico para identificar seu nível atual.",
  },
  {
    n: "02",
    icon: Target,
    title: "Adaptar",
    text: "Seus acertos e erros ajudam a ajustar o próximo nível de desafio.",
  },
  {
    n: "03",
    icon: GraduationCap,
    title: "Evoluir",
    text: "Você pratica exatamente onde precisa melhorar e avança progressivamente.",
  },
] as const;

const FAQ = [
  {
    q: "Como o Nexem seleciona as questões?",
    a: "Mapeamos os padrões neurais da prova para estruturar treinos que se adaptam exatamente à zona de desenvolvimento proximal e à carga cognitiva de cada aluno.",
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

    async function enterApp(user: User) {
      const [profile, progressCreated] = await Promise.all([
        ensureProfile(user).catch(() => ({ isNew: false, displayName: "" })),
        ensureProgressForUser(user.id).catch(() => false),
      ]);
      if (!active) return;

      const isNew = profile.isNew || progressCreated;
      if (isNew) {
        await markOnboarded(user.id).catch(() => undefined);
        if (!active) return;
        navigate({ to: "/desafio" });
        return;
      }
      navigate({ to: "/" });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void enterApp(data.session.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        setIsAuthModalOpen(false);
        void enterApp(session.user);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const openAuth = () => setIsAuthModalOpen(true);

  function scrollToHow(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          <Button variant="outline" onClick={openAuth} className="rounded-full px-5">
            Entrar
          </Button>
        </div>
      </header>

      <section className="relative px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10">
          <div className="relative z-10 motion-safe:animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Preparação inteligente para o ENEM
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.98] text-foreground md:text-7xl">
              Seu nível<br />
              Seu ritmo<br />
              Sua aprovação
            </h1>
            <p className="mt-6 text-xl font-semibold text-foreground md:text-2xl">
              Um treino inteligente que evolui com você.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Treine com a anatomia exata da prova. Suba de nível com missões adaptativas e domine
              cada assunto com o Tutor Nex.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openAuth} size="lg" className="h-13 rounded-xl px-6 text-base shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
                Começar meu desafio gratuito <ArrowRight />
              </Button>
              <Button asChild variant="outline" size="lg" className="h-13 rounded-xl px-6 text-base">
                <a href="#como-funciona" onClick={scrollToHow}>
                  Como funciona <ArrowDown />
                </a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Comece grátis</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No seu nível</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Evolução visível</span>
            </div>
          </div>

          <ProductMockup />
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card px-3 py-5 shadow-sm md:px-8">
          {[{ n: "10", l: "questões por dia" }, { n: "15 min", l: "para manter o ritmo" }, { n: "4", l: "áreas do ENEM" }].map((item) => (
            <div key={item.l} className="text-center">
              <strong className="block text-xl font-bold text-foreground md:text-3xl">{item.n}</strong>
              <span className="mt-1 block text-[10px] font-semibold uppercase text-muted-foreground md:text-xs">{item.l}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-card px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-accent">Feito para o seu ritmo</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
                Tudo que você precisa para manter o foco.
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:pb-2 md:text-lg">
              Uma rotina clara, feedback útil e evolução que você consegue enxergar.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="group flex min-h-80 flex-col border-t-4 border-primary bg-background p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl motion-safe:animate-fade-in-up"
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.tone}`}>
                    <Icon className="h-7 w-7" />
                  </span>
                  <p className="mt-6 text-xs font-bold uppercase text-muted-foreground">{feature.tag}</p>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{feature.text}</p>
                  <Button variant="ghost" onClick={openAuth} className="mt-5 justify-between px-0 text-primary hover:bg-transparent hover:text-primary/80">
                    Experimentar <ArrowRight />
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foreground px-5 py-20 text-background md:px-8 md:py-28">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase text-primary">Treino adaptativo</p>
            <h2 className="mt-4 text-4xl font-bold leading-[1.08] md:text-6xl">
              Seu treino não deveria ser igual ao de todo mundo.
            </h2>
            <p className="mt-8 text-lg text-background/70">Mais precisão. Menos desperdício. Mais evolução.</p>
          </div>

          <ol className="space-y-5">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.n}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="group grid grid-cols-[56px_1fr] gap-5 rounded-2xl border border-background/15 bg-background/5 p-6 transition-all duration-500 hover:border-primary/70 hover:bg-background/10 motion-safe:animate-fade-in-up md:p-8"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:rotate-3 group-hover:scale-105">
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">Passo {step.n}</p>
                    <h3 className="mt-1 text-2xl font-bold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-background/65">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/25 text-warning-foreground">
                <Zap className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-6xl">
                15 minutos podem mudar sua preparação.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Pequenos treinos consistentes podem ser mais úteis do que estudar horas sem saber onde concentrar seu esforço.
              </p>
              <Button onClick={openAuth} size="lg" className="mt-8 h-13 rounded-xl px-6 text-base">
                Começar meu primeiro desafio <ArrowRight />
              </Button>
            </div>

            <div className="relative grid gap-4">
              {[{ n: "01", v: "10 questões", s: "um objetivo que cabe no dia" }, { n: "02", v: "15 minutos", s: "foco sem sobrecarga" }, { n: "03", v: "todo dia", s: "consistência que vira progresso" }].map((item, index) => (
                <div key={item.n} className={`flex items-center gap-5 border border-border bg-card p-5 shadow-sm transition-transform hover:translate-x-2 ${index === 1 ? "lg:ml-10" : ""}`}>
                  <span className="text-sm font-bold text-primary">{item.n}</span>
                  <div>
                    <strong className="block text-xl font-bold uppercase text-foreground">{item.v}</strong>
                    <span className="text-sm text-muted-foreground">{item.s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-bold uppercase text-accent">Sem dúvida no caminho</p>
            <h2 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Perguntas frequentes</h2>
            <p className="mt-4 text-muted-foreground">Tudo o que você precisa saber antes de começar seu primeiro desafio.</p>
          </div>
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-6 text-left text-lg font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary px-5 py-20 text-primary-foreground md:px-8 md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-primary-foreground/10" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Sparkles className="mx-auto h-10 w-10" />
          <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
            Seu próximo passo não é estudar mais.
            <span className="mt-2 block text-background">É estudar melhor.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            Comece com 10 questões e descubra seu próximo desafio.
          </p>
          <Button onClick={openAuth} size="lg" className="mt-9 h-13 rounded-xl bg-background px-7 text-base text-foreground hover:bg-background/90">
            Começar desafio gratuito <ArrowRight />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            Nexem — Estudo adaptativo para o ENEM. Pratique no seu nível e evolua todos os dias.
          </p>
        </div>
      </footer>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}

function ProductMockup() {
  const [demoStep, setDemoStep] = useState(0);
  const selected = demoStep >= 1 ? "B" : null;
  const confirmed = demoStep >= 3;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDemoStep((step) => (step + 1) % 5);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  const answers = [
    ["A", "1,53 kWh"],
    ["B", "7,65 kWh"],
    ["C", "9,00 kWh"],
    ["D", "15,30 kWh"],
    ["E", "76,50 kWh"],
  ] as const;

  return (
    <div className="relative motion-safe:animate-fade-in-up" style={{ animationDelay: "120ms" }} aria-label="Exemplo da experiência do Desafio Diário">
      <div className="absolute -right-3 -top-5 z-20 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg" aria-live="polite">
        {confirmed ? "+10 XP" : "Treino ao vivo"}
      </div>
      <div className="overflow-hidden rounded-[28px] border-[10px] border-foreground bg-card shadow-2xl shadow-foreground/20">
        <div className="grid min-h-[500px] md:grid-cols-[0.38fr_1fr_0.6fr]">
          <aside className="hidden border-r border-border bg-card p-5 md:flex md:flex-col">
            <img src={nexemLogo.url} alt="" className="h-5 w-auto self-start" />
            <div className="mt-10 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">Desafio diário</div>
            <div className="mt-3 px-3 py-2 text-xs text-muted-foreground">Meu progresso</div>
            <div className="mt-1 px-3 py-2 text-xs text-muted-foreground">Simulados</div>
            <div className="mt-auto rounded-xl bg-primary/15 p-3">
              <Flame className="h-5 w-5 text-primary" />
              <p className="mt-2 text-xs font-bold text-foreground">Sequência: 12 dias</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Seu melhor ritmo até agora.</p>
            </div>
          </aside>

          <div className="p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-accent">Treine com Tutor Nex</p>
                <h3 className="mt-1 text-xl font-bold text-foreground">Física · Fundações</h3>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold text-accent">{confirmed ? "5" : "4"} de 5</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-1000 ${confirmed ? "w-full" : "w-4/5"}`} />
            </div>
            <div key={confirmed ? "answered" : "question"} className="mt-6 animate-fade-in-up rounded-xl border border-border p-5">
              <div className="flex gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold text-secondary-foreground">Física</span>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold text-primary">Dificuldade 38</span>
              </div>
              <p className="mt-5 text-sm font-semibold leading-relaxed text-foreground">
                Uma lâmpada de 60 W é substituída por uma LED de 9 W, usada 5 horas por dia. Em 30 dias, qual é a redução no consumo?
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {answers.map(([letter, text]) => {
                  const active = selected === letter;
                  const correct = confirmed && letter === "B";
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={confirmed}
                      onClick={() => setDemoStep(letter === "B" ? 1 : 0)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs transition-all duration-500 ${
                        correct
                          ? "scale-[1.02] border-success bg-success/10 font-bold text-foreground"
                          : active
                            ? "border-accent bg-secondary font-bold text-accent shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="font-bold">{letter}.</span> {text}
                    </button>
                  );
                })}
              </div>
              {confirmed && (
                <p className="mt-3 animate-fade-in-up text-xs font-semibold text-success">
                  Correto: (60 − 9) × 5 × 30 = 7,65 kWh.
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Sem cronômetro</span>
              <Button
                type="button"
                size="sm"
                disabled={!selected || confirmed}
                onClick={() => setDemoStep(3)}
                className="h-9 rounded-lg px-3 text-xs"
              >
                Confirmar <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <aside className="border-t border-border bg-secondary p-5 md:border-l md:border-t-0 md:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><BrainCircuit className="h-5 w-5" /></span>
              <div><p className="text-sm font-bold text-foreground">Tutor Nex</p><p className="text-[10px] text-muted-foreground">Online para ajudar</p></div>
            </div>
            <div className="mt-6 rounded-xl bg-card p-4 text-xs leading-relaxed text-foreground shadow-sm">
              Não vou entregar a resposta. Primeiro: qual é a diferença de potência entre as duas lâmpadas?
            </div>
            {demoStep >= 1 && (
              <div className="ml-auto mt-3 max-w-[88%] animate-fade-in-up rounded-xl bg-foreground p-4 text-xs leading-relaxed text-background">
                51 W. Depois multiplico pelas horas de uso?
              </div>
            )}
            {demoStep >= 2 && (
              <div className="mt-3 animate-fade-in-up rounded-xl bg-card p-4 text-xs leading-relaxed text-foreground shadow-sm">
                <strong className="text-accent">Isso.</strong> Multiplique por 5 horas e 30 dias. No fim, lembre de converter Wh para kWh.
              </div>
            )}
            {confirmed && (
              <div className="mt-3 animate-fade-in-up rounded-xl border border-success/40 bg-success/10 p-4 text-xs leading-relaxed text-foreground">
                <strong>Raciocínio consistente.</strong><br />Você chegou a 7,65 kWh sem depender do gabarito.
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoStep((step) => Math.max(2, step))}
              className="mt-4 w-full rounded-lg text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" /> Pedir uma pista
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}