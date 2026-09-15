import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthModal } from "@/components/AuthModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { ensureProgressForUser } from "@/lib/progress";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Nexem — A Evolução do seu Estudo para o ENEM" },
      {
        name: "description",
        content:
          "Plataforma de inteligência adaptativa para o ENEM: desafio diário, tutor socrático, níveis de maestria e simulado completo calibrados pelo TRI.",
      },
      { property: "og:title", content: "Nexem — A Evolução do seu Estudo para o ENEM" },
      {
        property: "og:description",
        content:
          "Pratique com a única plataforma de inteligência adaptativa calibrada com a real consistência do TRI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const VERTICALS = [
  {
    emoji: "🔥",
    title: "O Desafio Diário",
    text: "10 questões por dia em 15 minutos. O micro-hábito perfeito calibrado dinamicamente para o seu nível de proficiência atual.",
  },
  {
    emoji: "🧠",
    title: "Tutor Socrático Nex",
    text: "Sua IA particular baseada no Claude. Ela funciona de forma socrática, te guiando com pistas sem nunca te dar a resposta de bandeja.",
  },
  {
    emoji: "📐",
    title: "Níveis de Maestria",
    text: "Treinos focados por matéria divididos em 3 níveis rígidos de profundidade (Fundações, Aprofundamento e Domínio Avançado).",
  },
  {
    emoji: "⏱️",
    title: "Simulado Completo",
    text: "O teste real de resistência padrão INEP com cronômetro regressivo de 5h30 e matriz de detecção de consistência contra chutes.",
  },
] as const;

const FAQ = [
  {
    q: "Como o Nexem cria o banco de questões?",
    a: "Cada questão é catalogada com área, matéria e uma dificuldade contínua de 1 a 100, calibrada a partir do comportamento histórico das provas do ENEM. Isso permite que o sistema escolha itens no seu nível exato, e não questões aleatórias.",
  },
  {
    q: "O que é um simulado progressivo?",
    a: "Em vez de uma lista fixa, o simulado muda a cada resposta: acertou, a próxima sobe de dificuldade; errou, ela desce. Assim o teste encontra rapidamente o seu teto real de proficiência, como faz a TRI do ENEM.",
  },
  {
    q: "Por que praticar no Nexem é mais eficiente?",
    a: "Porque a nota do ENEM não é acertos dividido pelo total: questões difíceis valem mais e acertos inconsistentes (difícil sim, fácil não) são penalizados. O Nexem treina justamente a consistência, medindo seu padrão de acertos e corrigindo a rota todo dia.",
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

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border px-6 py-20 md:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 55% at 20% 0%, color-mix(in oklch, var(--primary) 28%, transparent), transparent 70%), radial-gradient(50% 45% at 85% 15%, color-mix(in oklch, var(--accent) 24%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center motion-safe:animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            Inteligência adaptativa calibrada pelo TRI
          </span>
          <h1
            className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Nexem: A Evolução do seu Estudo para o ENEM
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Chega de simulados estáticos e videoaulas passivas. Pratique com a única plataforma de
            Inteligência Adaptativa do mercado calibrada com a real consistência do TRI.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openAuth}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-primary/90"
            >
              Começar Desafio Gratuito
            </button>
            <a
              href="#recursos"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      {/* Verticais */}
      <section id="recursos" className="mx-auto max-w-6xl px-6 py-20">
        <h2
          className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Quatro frentes de treino, um só objetivo
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v, i) => (
            <article
              key={v.title}
              style={{ animationDelay: `${i * 90}ms` }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl motion-safe:animate-fade-in-up"
            >
              <span className="text-3xl">{v.emoji}</span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              <button
                onClick={openAuth}
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Experimentar
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2
          className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
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

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold text-foreground">
            Seu próximo desafio de 15 minutos começa agora.
          </p>
          <button
            onClick={openAuth}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90"
          >
            Começar Desafio Gratuito
          </button>
        </div>
      </section>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
