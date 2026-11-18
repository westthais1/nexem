import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Clock3, Menu, Sparkles } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ChallengeMockup,
  DiagnosisMockup,
  TutorMockup,
  JourneyMockup,
  EssayMockup,
  MaterialsMockup,
  ExamMockup,
  TimeMockup,
} from "@/components/landing/Mockups";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";
import studentPhoto from "@/assets/landing/teen-student-2.jpg";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProgressForUser } from "@/lib/progress";
import { ensureProfile, markOnboarded } from "@/lib/profile";

export const Route = createFileRoute("/landing")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => ({
    preview:
      search["preview"] === true || search["preview"] === "true" || search["preview"] === "1",
  }),
  head: () => ({
    meta: [
      { title: "Nexem — 15 minutos por dia para o ENEM" },
      {
        name: "description",
        content:
          "15 minutos por dia, 10 questões no seu nível e o Tutor Nex guiando cada passo. O Desafio Diário do Nexem é grátis e cabe em qualquer rotina.",
      },
      { property: "og:title", content: "Nexem — 15 minutos por dia. Todo dia. Até o ENEM." },
      {
        property: "og:description",
        content:
          "Um desafio diário de 15 minutos com 10 questões no seu nível e o Tutor Nex. Grátis, todo dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const LANDING_MENU = [
  { href: "#como-funciona", label: "Como funciona" },
  { to: "/entenda-tri", label: "Entenda a TRI" },
  { to: "/guia-enem", label: "Guia do ENEM" },
  { to: "/perguntas-frequentes", label: "Perguntas frequentes" },
  { to: "/nexem-pro", label: "Nexem Pro" },
] as const;

function LandingPage() {
  const navigate = useNavigate();
  const { preview } = Route.useSearch();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    // Explicit preview keeps the landing visible without signing the student out.
    if (preview) return;
    let active = true;

    async function enterApp(user: User) {
      const [profile, progressCreated] = await Promise.all([
        ensureProfile(user).catch(() => ({ isNew: false, displayName: "", quizCompletedAt: null })),
        ensureProgressForUser(user.id).catch(() => false),
      ]);
      if (!active) return;

      if (!profile.quizCompletedAt) {
        navigate({ to: "/", replace: true });
        return;
      }

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
  }, [navigate, preview]);

  const openAuth = () => setIsAuthModalOpen(true);

  function scrollToHow(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const target = event.currentTarget.getAttribute("href")?.slice(1);
    setMenuOpen(false);
    if (!target) return;
    document.getElementById(target)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }

  return (
    <div className="nexem-landing min-h-screen bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only fixed left-4 top-3 z-[110] rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only"
      >
        Pular para o conteúdo
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#conteudo" aria-label="Nexem — início">
            <img src={nexemLogo.url} alt="nexem" className="h-7 w-auto sm:h-8" />
          </a>
          <nav aria-label="Menu da landing" className="hidden items-center xl:flex">
            {LANDING_MENU.map((item) => (
              <Button
                key={item.label}
                asChild
                variant="ghost"
                className="px-3 text-xs hover:bg-primary/5 hover:text-primary"
              >
                {"to" in item ? (
                  <Link to={item.to}>{item.label}</Link>
                ) : (
                  <a href={item.href} onClick={scrollToHow}>
                    {item.label}
                  </a>
                )}
              </Button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" onClick={openAuth} className="hidden px-3 sm:inline-flex">
              Entrar
            </Button>
            <Button onClick={openAuth} className="px-3 sm:px-4">
              Começar grátis <ArrowRight aria-hidden="true" className="hidden sm:block" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="right" className="w-[85vw] max-w-sm">
            <SheetHeader>
              <SheetTitle>Nexem</SheetTitle>
              <SheetDescription>Seu próximo passo para o ENEM.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Menu lateral da landing" className="mt-6 grid gap-2">
              {LANDING_MENU.map((item) => (
                <Button
                  key={item.label}
                  asChild
                  variant="ghost"
                  className="h-11 justify-start hover:bg-primary/5 hover:text-primary"
                >
                  {"to" in item ? (
                    <Link to={item.to} onClick={() => setMenuOpen(false)}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} onClick={scrollToHow}>
                      {item.label}
                    </a>
                  )}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setMenuOpen(false);
                  openAuth();
                }}
              >
                Entrar
              </Button>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  openAuth();
                }}
              >
                Começar grátis <ArrowRight aria-hidden="true" />
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>
      <main id="conteudo" className="pt-[72px]">
        <section className="relative border-b border-border px-5 pb-12 pt-12 sm:px-8 sm:py-20 lg:pb-20 lg:pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
            <div>
              <Eyebrow n="01" label="SEUS 15 MINUTOS" />
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.08] sm:text-6xl">
                15 minutos por dia.
                <span className="mt-1 block text-primary">
                  Um passo a mais
                  {" "}para o ENEM.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
                10 questões no seu nível. Uma pista quando você trava. Um novo desafio amanhã.
                Estudar pode caber no seu dia.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button onClick={openAuth} size="lg" className="h-12 px-5 text-sm">
                  Começar meus 15 minutos <ArrowRight aria-hidden="true" />
                </Button>
                <Button asChild variant="ghost" className="h-12 text-primary hover:bg-primary/5">
                  <a href="#como-funciona" onClick={scrollToHow}>
                    Como funciona <ArrowDown aria-hidden="true" />
                  </a>
                </Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                Desafio Diário grátis, todos os dias.
              </p>
              <div className="mt-8 flex max-w-sm items-center gap-4 border-t border-border pt-5">
                <img
                  src={studentPhoto}
                  alt="Adolescente fazendo anotações enquanto estuda na biblioteca"
                  className="h-16 w-20 shrink-0 rounded-lg object-cover"
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Na biblioteca, em casa, no intervalo.
                  <br />
                  <span className="font-medium text-foreground">Seu ritmo também conta.</span>
                </p>
              </div>
            </div>
            <ChallengeMockup />
          </div>
          <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" className="h-4 w-4 text-primary" />
              ≈15 minutos
            </span>
            <span>10 questões por dia</span>
            <span>4 áreas do ENEM</span>
            <span className="ml-auto hidden items-center gap-2 sm:inline-flex">
              Um começo simples <ArrowDown aria-hidden="true" className="h-3 w-3" />
            </span>
          </div>
        </section>
        <FeatureSection
          n="02"
          label="COMO FUNCIONA"
          id="como-funciona"
          title="Não organize tudo."
          punch="Dê o primeiro passo."
          reverse
          mockup={<DiagnosisMockup />}
        >
          <p>
            O Nexem conhece seu ponto de partida e transforma isso em um treino curto. Você só
            precisa começar.
          </p>
          <ol className="mt-7 space-y-5">
            {[
              {
                title: "Um diagnóstico rápido.",
                text: "Conte seu objetivo e descubra seu nível inicial por área.",
              },
              {
                title: "10 questões, cerca de 15 minutos.",
                text: "Treine no seu nível, com o Tutor Nex para guiar o raciocínio.",
              },
              {
                title: "Amanhã tem um novo passo.",
                text: "O próximo desafio se ajusta aos seus acertos e erros.",
              },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </FeatureSection>
        <FeatureSection
          n="03"
          label="TUTOR NEX"
          title="A pista certa."
          punch="A resposta é sua."
          mockup={<TutorMockup />}
        >
          <p>
            Não entrega a resposta, guia o raciocínio. O Tutor Nex faz perguntas, aponta caminhos e
            ajuda você a entender o que está fazendo.
          </p>
          <p className="mt-5">Porque acertar é bom. Saber por quê é melhor.</p>
          <p className="mt-6 border-l-2 border-accent pl-4 text-sm text-foreground">
            No plano grátis: <strong>3 consultas a cada 24 horas.</strong>
          </p>
        </FeatureSection>
        <FeatureSection
          n="04"
          label="SEU RITMO, SUA SEQUÊNCIA"
          title="Voltar amanhã."
          punch="Já é uma conquista."
          reverse
          mockup={<JourneyMockup />}
        >
          <p>
            Uma chama para sua sequência. Uma trilha para cada passo. Seu treino ganha ritmo sem
            transformar o erro em punição.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "10 questões para abrir o baú diário.",
              "2 questões finais para enfrentar o chefe.",
              "Combos, XP e medalhas para celebrar o caminho.",
              "A raposa acompanha sua evolução.",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </FeatureSection>
        <FeatureSection
          n="05"
          label="REDAÇÃO INTELIGENTE"
          title="Além de uma nota."
          punch="Um caminho de melhora."
          mockup={<EssayMockup />}
        >
          <p>
            Envie sua redação e receba uma avaliação pelas cinco competências do ENEM. Veja onde seu
            argumento perde força e como reescrever com mais clareza.
          </p>
          <p className="mt-5">
            Da escrita formal à proposta de intervenção: comentários específicos para cada
            competência, não só uma nota no final.
          </p>
          <p className="mt-6 text-xs">
            As notas de redação são estimativas, não resultados oficiais do INEP.
          </p>
        </FeatureSection>
        <FeatureSection
          n="06"
          label="UM CONTEÚDO, VÁRIAS FORMAS"
          id="materiais"
          title="Seu material."
          punch="Novas formas de aprender."
          reverse
          mockup={<MaterialsMockup />}
        >
          <p>
            Envie PDF, anotações ou fotos. O Nexem cria resumos, flashcards e uma trilha de estudo a
            partir do que você está aprendendo.
          </p>
          <p className="mt-5">
            Entenda o conceito, recupere de memória e teste com uma questão. O assunto continua o
            mesmo; a forma de estudar muda.
          </p>
        </FeatureSection>
        <FeatureSection
          n="07"
          label="PROVA COMPLETA E RAIO-X"
          title="Treine o formato."
          punch="Enxergue as prioridades."
          mockup={<ExamMockup />}
        >
          <p>
            Quando quiser ir além dos 15 minutos, a Prova Completa coloca você no ritmo real do
            ENEM, com 90 questões por dia e nota TRI.
          </p>
          <div className="mt-6 space-y-4 border-y border-border py-5 text-sm">
            <p>
              <strong className="text-foreground">Dia 1 · 5h30</strong>
              <br />
              Linguagens, Humanas e Redação.
            </p>
            <p>
              <strong className="text-foreground">Dia 2 · 5h</strong>
              <br />
              Natureza e Matemática.
            </p>
          </div>
          <p className="mt-5 text-sm">
            No Raio-X, explore a frequência dos temas nas provas de 2009–2024 e identifique o que
            mais aparece.
          </p>
          <Button asChild variant="link" className="mt-3 h-auto px-0 text-accent">
            <Link to="/nexem-pro">
              Conhecer a Prova Completa no Nexem Pro <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </FeatureSection>
        <FeatureSection
          n="08"
          label="COM O TEMPO"
          title="Pequenos treinos."
          punch="Um histórico só seu."
          reverse
          mockup={<TimeMockup />}
        >
          <p>
            O primeiro dia mostra onde você está. Os seguintes revelam o que ficou mais fácil — e o
            que vale revisar.
          </p>
          <p className="mt-5">
            De Fundações a Aprofundamento e Domínio Avançado, seus níveis acompanham seu desempenho.
            As estatísticas por área ajudam a enxergar a evolução.
          </p>
          <p className="mt-6 font-medium text-primary">Seu progresso fica salvo na sua conta.</p>
        </FeatureSection>
        <section className="border-t border-border bg-primary/5 px-5 py-20 text-center sm:px-8 sm:py-24">
          <Sparkles aria-hidden="true" className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Os 15 minutos de hoje
            <br />
            <span className="text-primary">começam com um passo.</span>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Você não precisa resolver o ENEM inteiro hoje.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12" onClick={openAuth}>
              Começar grátis <ArrowRight aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 hover:bg-primary/10 hover:text-primary"
              onClick={openAuth}
            >
              Entrar
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Grátis para sempre no Desafio Diário.{" "}
            <Link to="/nexem-pro" className="font-medium text-primary underline underline-offset-4">
              Nexem Pro opcional
            </Link>
            .
          </p>
        </section>
      </main>
      <footer className="bg-foreground px-5 py-12 text-background sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/70">
              15 minutos por dia.
              <br />
              Seu próximo passo para o ENEM.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase">Produto</h3>
            <div className="grid justify-items-start gap-3 text-sm text-background/70">
              <a href="#como-funciona" onClick={scrollToHow} className="hover:text-background">
                Como funciona
              </a>
              <Link to="/nexem-pro" className="hover:text-background">
                Nexem Pro
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase">Aprender</h3>
            <div className="grid justify-items-start gap-3 text-sm text-background/70">
              {LANDING_MENU.filter((item) => "to" in item && item.to !== "/nexem-pro").map(
                (item) =>
                  "to" in item && (
                    <Link key={item.label} to={item.to} className="hover:text-background">
                      {item.label}
                    </Link>
                  ),
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase">Conta</h3>
            <div className="grid justify-items-start gap-1">
              <Button
                variant="ghost"
                onClick={openAuth}
                className="h-9 px-0 text-background/70 hover:bg-transparent hover:text-background"
              >
                Entrar
              </Button>
              <Button
                variant="ghost"
                onClick={openAuth}
                className="h-9 px-0 text-background/70 hover:bg-transparent hover:text-background"
              >
                Começar grátis <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-between gap-3 border-t border-background/15 pt-5 text-xs text-background/60">
          <p>© 2026 Nexem. Todos os direitos reservados.</p>
          <p>Notas de redação são estimativas.</p>
        </div>
      </footer>
      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

function Eyebrow({ n, label }: { n: string; label: string }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase text-muted-foreground">
      <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
        {n}
      </span>
      {label}
    </p>
  );
}
function FeatureSection({
  n,
  label,
  id,
  title,
  punch,
  reverse = false,
  mockup,
  children,
}: {
  n: string;
  label: string;
  id?: string;
  title: string;
  punch: string;
  reverse?: boolean;
  mockup: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`section-${n}`}
      className={`scroll-mt-24 border-b border-border px-5 py-14 sm:px-8 sm:py-20 lg:py-24 ${reverse ? "bg-secondary/35" : "bg-card"}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div className={reverse ? "lg:order-2" : ""}>
          <Eyebrow n={n} label={label} />
          <h2
            id={`section-${n}`}
            className="mt-5 font-display text-4xl font-semibold leading-[1.15] sm:text-5xl"
          >
            {title}
            <span className="mt-1 block text-primary">{punch}</span>
          </h2>
          <div className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">{children}</div>
        </div>
        <div className={`min-w-0 ${reverse ? "lg:order-1" : ""}`}>{mockup}</div>
      </div>
    </section>
  );
}
