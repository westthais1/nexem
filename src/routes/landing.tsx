import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  Menu,
  X,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ComponentType, type MouseEvent } from "react";

import { AuthModal } from "@/components/AuthModal";
import { ParallaxImage } from "@/components/ParallaxImage";
import { Reveal, RevealItem, RevealStagger, RevealStepIcon, useRevealMotion } from "@/components/Reveal";
import { WordsReveal } from "@/components/WordsReveal";
import { useCountUp } from "@/hooks/use-count-up";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";
import heroVideo from "@/assets/landing/teen-hero.mp4.asset.json";
import heroWebVideo from "@/assets/landing/teen-hero.webm.asset.json";
import heroPoster from "@/assets/landing/teen-hero.jpg";
import student1 from "@/assets/landing/teen-student-1.jpg";
import student2 from "@/assets/landing/teen-student-2.jpg";
import student3 from "@/assets/landing/teen-student-3.jpg";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProgressForUser } from "@/lib/progress";
import { ensureProfile, markOnboarded } from "@/lib/profile";

export const Route = createFileRoute("/landing")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => ({
    preview: search["preview"] === true || search["preview"] === "true" || search["preview"] === "1",
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
    text: "O coração do Nexem: 10 questões no seu nível em 15 minutos. Grátis, todo dia.",
    tone: "bg-primary/15 text-primary",
    tag: "Seus 15 minutos",
  },
  {
    icon: BrainCircuit,
    title: "Tutor Nex",
    text: "Durante os seus 15 minutos, uma IA orienta seu raciocínio com pistas e perguntas, sem entregar a resposta.",
    tone: "bg-accent/15 text-accent",
    tag: "Ajuda inteligente",
  },
  {
    icon: Trophy,
    title: "Níveis de Maestria",
    text: "Cada desafio diário conta: avance por matéria das Fundações ao Domínio Avançado.",
    tone: "bg-warning/25 text-warning-foreground",
    tag: "Evolução visível",
  },
  {
    icon: Clock3,
    title: "Simulado Completo",
    text: "Quando os 15 minutos diários viraram hábito, treine resistência com a estrutura real do ENEM.",
    tone: "bg-secondary text-secondary-foreground",
    tag: "Modo prova",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Gauge,
    title: "Entender",
    text: "Um diagnóstico rápido mostra seu nível atual em cada área.",
  },
  {
    n: "02",
    icon: Target,
    title: "Treinar 15 minutos",
    text: "Todo dia, 10 questões ajustadas ao seu nível. Seus acertos e erros calibram o desafio de amanhã.",
  },
  {
    n: "03",
    icon: GraduationCap,
    title: "Evoluir",
    text: "15 minutos por dia somam mais de 7 horas por mês de treino focado onde você mais precisa.",
  },
] as const;

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
  const motionEnabled = useRevealMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const resume = () => { video.play().catch(() => {}); };
    video.play().catch(() => {
      document.addEventListener("pointerdown", resume, { once: true });
      document.addEventListener("touchstart", resume, { once: true });
    });
    return () => {
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("touchstart", resume);
    };
  }, []);


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
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          <nav aria-label="Menu da landing" className="hidden items-center gap-1 lg:flex">
            {LANDING_MENU.map((item) => (
              <Button key={item.label} asChild variant="ghost" className="text-foreground hover:bg-primary/10 hover:text-primary">
                {"to" in item ? (
                  <Link to={item.to}>{item.label}</Link>
                ) : (
                  <a href={item.href} onClick={scrollToHow}>{item.label}</a>
                )}
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openAuth} className="rounded-full px-5">Entrar</Button>
            <Button variant="ghost" size="icon" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <Menu />
            </Button>
          </div>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="right" className="w-[45vw] min-w-[280px] sm:max-w-none">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Menu lateral da landing" className="mt-6 grid gap-1">
              {LANDING_MENU.map((item) => (
                <Button key={item.label} asChild variant="ghost" className="h-11 justify-start text-base text-foreground hover:bg-primary/10 hover:text-primary">
                  {"to" in item ? (
                    <Link to={item.to} onClick={() => setMenuOpen(false)}>{item.label}</Link>
                  ) : (
                    <a href={item.href} onClick={(e) => { setMenuOpen(false); scrollToHow(e); }}>{item.label}</a>
                  )}
                </Button>
              ))}
              <Button className="mt-4 rounded-full" onClick={() => { setMenuOpen(false); openAuth(); }}>Entrar</Button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <section className="px-3 pt-4 md:px-6 md:pt-6">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] shadow-2xl shadow-foreground/10">
          <motion.video
            initial={false}
            animate={motionEnabled ? { scale: [1.08, 1] } : { scale: 1, transition: { duration: 0 } }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={heroPoster}
            autoPlay
            muted
            loop
            preload="auto"
            playsInline
            {...{ "webkit-playsinline": "true" }}
            aria-hidden="true"
          >
            <source src={heroWebVideo.url} type="video/webm" />
            <source src={heroVideo.url} type="video/mp4" />
          </motion.video>
          <div className="absolute inset-0 bg-foreground/45" aria-hidden="true" />
          <div className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 py-24 text-center md:min-h-[84vh]">
            <Reveal as="span" variant="zoom" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <Clock3 className="h-3.5 w-3.5" />
              Desafio Diário · grátis
            </Reveal>
            <WordsReveal
              as="h1"
              text={["15 minutos por dia.", "Até a sua aprovação."]}
              className="mt-7 max-w-4xl text-5xl font-bold leading-[0.98] text-white md:text-7xl"
            />
            <Reveal as="p" delay={300} className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              Todo dia, 10 questões no seu nível e o Tutor Nex guiando o raciocínio. Um treino curto
              que cabe em qualquer rotina e vira pontos no ENEM.
            </Reveal>
            <Reveal variant="rise" delay={450} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={openAuth} size="lg" className="h-13 rounded-full px-7 text-base shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5">
                Começar meus 15 minutos <ArrowRight />
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/40 bg-white/10 px-7 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                <a href="#como-funciona" onClick={scrollToHow}>
                  Como funciona <ArrowDown />
                </a>
              </Button>
            </Reveal>
            <Reveal variant="rise" delay={600} className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-white/80">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary-foreground" /> 10 questões</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary-foreground" /> 15 minutos</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary-foreground" /> Grátis, todo dia</span>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mt-10 overflow-hidden bg-background py-4" aria-hidden="true">
        <div className={`flex w-max gap-10 pr-10 ${motionEnabled ? "motion-safe:animate-marquee" : ""}`}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {["15 minutos por dia", "Desafio Diário", "Tutor Nex", "Níveis de Maestria", "Simulado Completo", "Redação Inteligente", "Estatísticas TRI"].map((item) => (
                <span key={item} className="inline-flex items-center gap-10">
                  {item} <Sparkles className="h-3.5 w-3.5 text-primary" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <Reveal variant="rise">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/25 text-warning-foreground">
                <Zap className="h-7 w-7" />
              </span>
              <WordsReveal className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-6xl" text="O objetivo de cada dia: 15 minutos." />
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Você não precisa de horas. Precisa aparecer todo dia. O Nexem transforma 15 minutos em um treino certeiro:
                10 questões no seu nível, com o Tutor Nex ajudando quando você trava.
              </p>
              <Button onClick={openAuth} size="lg" className="mt-8 h-13 rounded-xl px-6 text-base">
                Fazer meus 15 minutos de hoje <ArrowRight />
              </Button>
            </Reveal>

            <RevealStagger className="relative grid gap-4">
              {[{ n: "01", v: "15 minutos", s: "a meta diária do Nexem" }, { n: "02", v: "10 questões", s: "no seu nível, sem sobrecarga" }, { n: "03", v: "todo dia", s: "sequência que vira progresso" }].map((item, index) => (
                <RevealItem key={item.n} variant={index % 2 === 0 ? "left" : "right"} className={`flex items-center gap-5 border border-border bg-card p-5 shadow-sm motion-safe:transition-transform motion-safe:hover:translate-x-2 ${index === 1 ? "lg:ml-10" : ""}`}>
                  <span className="text-sm font-bold text-primary">{item.n}</span>
                  <div>
                    <strong className="block text-xl font-bold uppercase text-foreground">{item.v}</strong>
                    <span className="text-sm text-muted-foreground">{item.s}</span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="rise" className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase text-accent">Quem estuda com o Nexem</p>
            <WordsReveal className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl" text="Estudo de verdade, no seu dia a dia." />
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Em casa, na biblioteca, no intervalo ou no ônibus: 15 minutos por dia cabem em qualquer rotina.
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { src: student1, alt: "Adolescente estudando para o ENEM e escrevendo no caderno em casa" },
              { src: student2, alt: "Adolescente revisando um livro e fazendo anotações na biblioteca" },
              { src: student3, alt: "Dois adolescentes estudando juntos com caderno e notebook" },
            ].map((photo) => (
              <RevealItem
                as="figure"
                variant="zoom"
                key={photo.src}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <ParallaxImage
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  width={1280}
                  height={960}
                  className="aspect-[4/5] w-full object-cover"
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <section className="bg-card px-5 py-16 md:px-8 md:py-24">
        <div>
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase text-primary">Veja o treino em ação</p>
              <WordsReveal className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl" text="Uma questão. Uma pista. Um passo a mais." />
            </div>
            <Reveal className="mt-12" variant="flip">
              <ProductMockup />
            </Reveal>
          </div>
          <RevealStagger className="mx-auto mt-16 grid max-w-5xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-background px-3 py-5 shadow-sm md:px-8">
            {[{ n: 15, suffix: " min", l: "meta diária" }, { n: 10, suffix: "", l: "questões por dia" }, { n: 4, suffix: "", l: "áreas do ENEM" }].map((item) => (
              <LandingMetric key={item.l} value={item.n} suffix={item.suffix} label={item.l} />
            ))}
          </RevealStagger>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-card px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="rise" className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-accent">Feito para o seu ritmo</p>
              <WordsReveal className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl" text="Como funciona o Nexem." />
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:pb-2 md:text-lg">
              Crie sua conta, conte sua série e sua meta no questionário inicial e escolha por onde começar. Seu treino e seu progresso ficam ligados à sua conta.
            </p>
          </Reveal>

          <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <RevealItem
                  as="article"
                  variant="blur"
                  lift
                  key={feature.title}
                  className="group flex min-h-80 flex-col border-t-4 border-primary bg-background p-6 shadow-sm"
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
                </RevealItem>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foreground px-5 py-20 text-background md:px-8 md:py-28">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <Reveal variant="rise" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase text-primary">Treino adaptativo</p>
            <WordsReveal className="mt-4 text-4xl font-bold leading-[1.08] md:text-6xl" text="Seu treino não deveria ser igual ao de todo mundo." />
            <p className="mt-8 text-lg text-background/70">Mais precisão. Menos desperdício. Mais evolução.</p>
          </Reveal>

          <RevealStagger as="ol" className="space-y-5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <RevealItem
                  as="li"
                  variant="right"
                  key={step.n}
                  className="group grid grid-cols-[56px_1fr] gap-5 rounded-2xl border border-background/15 bg-background/5 p-6 transition-all duration-500 hover:border-primary/70 hover:bg-background/10 md:p-8"
                >
                  <RevealStepIcon className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="h-7 w-7" />
                  </RevealStepIcon>
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">Passo {step.n}</p>
                    <h3 className="mt-1 text-2xl font-bold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-background/65">{step.text}</p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary px-5 py-20 text-primary-foreground md:px-8 md:py-28">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-primary-foreground/10" aria-hidden="true" />
        <Reveal variant="zoom" className="relative mx-auto max-w-4xl text-center">
          <motion.span
            aria-hidden="true"
            className="mx-auto block w-fit"
            initial={false}
            animate={motionEnabled ? { scale: [1, 1.12, 1], opacity: [1, 0.78, 1] } : { scale: 1, opacity: 1, transition: { duration: 0 } }}
            transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
          >
            <Sparkles className="h-10 w-10" />
          </motion.span>
          <WordsReveal
            className="mt-5 text-4xl font-bold leading-tight md:text-6xl"
            text={["Seus 15 minutos de hoje", { text: "começam agora.", className: "mt-2 block text-background" }]}
          />
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            Não é estudar mais. É estudar 15 minutos, todo dia, no lugar certo.
          </p>
          <Button onClick={openAuth} size="lg" className="mt-9 h-13 rounded-xl bg-background px-7 text-base text-foreground hover:bg-background/90">
            Começar meus 15 minutos <ArrowRight />
          </Button>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-background px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            Nexem — 15 minutos por dia para o ENEM. Pratique no seu nível e evolua todos os dias.
          </p>
        </div>
      </footer>

      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}

function LandingMetric({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [entered, setEntered] = useState(false);
  const enabled = useRevealMotion();
  return (
    <RevealItem variant="zoom" className="text-center" onViewportEnter={() => setEntered(true)}>
      <strong className="block text-xl font-bold tabular-nums text-foreground md:text-3xl">
        <span className="sr-only">{value}{suffix}</span>
        <span aria-hidden="true">
          {enabled && entered ? <CountingMetric value={value} /> : value}{suffix}
        </span>
      </strong>
      <span className="mt-1 block text-[10px] font-semibold uppercase text-muted-foreground md:text-xs">{label}</span>
    </RevealItem>
  );
}

function CountingMetric({ value }: { value: number }) {
  return useCountUp(value);
}

function ProductMockup() {
  const enterClass = useRevealMotion() ? "motion-safe:animate-fade-in-up" : "";
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
    <div className="relative mx-auto w-full max-w-[640px]" aria-label="Exemplo da experiência do Desafio Diário">
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
            <div key={confirmed ? "answered" : "question"} className={`mt-6 ${enterClass} rounded-xl border border-border p-5`}>
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
                          ? "motion-safe:scale-[1.02] border-success bg-success/10 font-bold text-foreground"
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
                <p className={`mt-3 ${enterClass} text-xs font-semibold text-success`}>
                  Correto: (60 − 9) × 5 × 30 = 7,65 kWh.
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> ~15 min no total</span>
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
              <div className={`ml-auto mt-3 max-w-[88%] ${enterClass} rounded-xl bg-foreground p-4 text-xs leading-relaxed text-background`}>
                51 W. Depois multiplico pelas horas de uso?
              </div>
            )}
            {demoStep >= 2 && (
              <div className={`mt-3 ${enterClass} rounded-xl bg-card p-4 text-xs leading-relaxed text-foreground shadow-sm`}>
                <strong className="text-accent">Isso.</strong> Multiplique por 5 horas e 30 dias. No fim, lembre de converter Wh para kWh.
              </div>
            )}
            {confirmed && (
              <div className={`mt-3 ${enterClass} rounded-xl border border-success/40 bg-success/10 p-4 text-xs leading-relaxed text-foreground`}>
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