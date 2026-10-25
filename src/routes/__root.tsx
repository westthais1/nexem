import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { XpCelebration } from "@/components/XpCelebration";
import { StudentQuiz } from "@/components/StudentQuiz";
import { Button } from "@/components/ui/button";
import { ensureProfile, markOnboarded } from "@/lib/profile";
import { needsStudentQuiz } from "@/lib/student-quiz";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionProvider, useSubscription } from '@/hooks/use-subscription';
import { PremiumGate } from '@/components/PremiumGate';

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente recarregar ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nexem — Seu tutor de IA para o ENEM" },
      {
        name: "description",
        content: "Tutor de inteligência artificial para estudantes do ENEM: simulados, redação inteligente e estatísticas de progresso.",
      },
      { name: "author", content: "Nexem" },
      { property: "og:title", content: "Nexem — Seu tutor de IA para o ENEM" },
      {
        property: "og:description",
        content: "Simulados, redação inteligente e estatísticas de progresso para o ENEM com inteligência artificial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: DashboardIcon },
  { to: "/desafio", label: "Desafio Diário", icon: SimuladoIcon },
  { to: "/simulado", label: "Treine com Tutor Nex", icon: SimuladoIcon },
  { to: "/full-simulado", label: "Prova Completa", icon: SimuladoIcon },
  { to: "/redacao", label: "Redação Inteligente", icon: RedacaoIcon },
  { to: "/estatisticas", label: "Estatísticas", icon: EstatisticasIcon },
  { to: "/raio-x", label: "Raio-X do ENEM", icon: EstatisticasIcon },
] as const;

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex w-full shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button
          aria-label="Abrir menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:top-0 md:z-0`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Brand />
          <button
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-foreground"
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-foreground",
                }}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-foreground [&[data-active=true]]:text-primary" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border bg-sidebar p-4">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center">
      <img
        src={nexemLogo.url}
        alt="nexem"
        className="h-7 w-auto"
      />
    </Link>
  );
}

function UserMenu() {
  const { isPremium, openUpgrade } = useSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) setUser({ email: u.email ?? "", name: nameOf(u) });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) setUser({ email: u.email ?? "", name: nameOf(u) });
      else setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const initials = user?.name
    ? user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
    : "?";

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setUser(null);
    navigate({ to: "/landing", replace: true });
  }

  if (!user) return null;

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={openUpgrade}>{isPremium ? 'Nexem Pro' : 'Conhecer Nexem Pro'}</Button>
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        Sair
      </button>
    </div>
  );
}

function nameOf(user: { email?: string; user_metadata?: Record<string, unknown> | null }): string {
  const meta = user.user_metadata;
  const full = (meta?.["full_name"] ?? meta?.["name"]) as string | undefined;
  return full?.trim() || (user.email ?? "").split("@")[0] || "Estudante";
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding =
    pathname.startsWith("/landing") ||
    pathname.startsWith("/entenda-tri") ||
    pathname.startsWith("/guia-enem") ||
    pathname.startsWith("/perguntas-frequentes") ||
    pathname.startsWith("/nexem-pro");
  const [quizUserId, setQuizUserId] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [subscriptionUserId, setSubscriptionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLanding) return;

    let active = true;
    setProfileReady(false);
    setProfileError(false);

    // Revalidate the stored account before deciding that the visitor is signed out.
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data.user) { navigate({ to: "/landing", replace: true }); return; }
      setSubscriptionUserId(data.user.id);
      const profile = await ensureProfile(data.user);
      if (!active) return;
      setQuizUserId(needsStudentQuiz({ quiz_completed_at: profile.quizCompletedAt }) ? data.user.id : null);
      setProfileReady(true);
    }).catch(() => { if (active) setProfileError(true); });

    // Redirect to landing on sign-out.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSubscriptionUserId(null);
        setQuizUserId(null);
        setProfileReady(false);
        navigate({ to: "/landing", replace: true });
      }
      if (event === "SIGNED_IN") setRetry((value) => value + 1);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isLanding, navigate, retry]);

  if (!isLanding && !profileReady) return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
      <p role={profileError ? "alert" : "status"} className="text-muted-foreground">{profileError ? "Não conseguimos carregar seu perfil." : "Preparando sua jornada…"}</p>
      {profileError && <Button onClick={() => setRetry((value) => value + 1)}>Tentar novamente</Button>}
    </main>
  );

  if (!isLanding && quizUserId) return <StudentQuiz key={quizUserId} userId={quizUserId} onComplete={() => {
    setQuizUserId(null);
    void markOnboarded(quizUserId);
    navigate({ to: "/desafio", replace: true });
  }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider userId={isLanding ? null : subscriptionUserId}>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        {!isLanding && <Sidebar />}
        <div className="flex w-full min-w-0 flex-1 flex-col md:w-auto">
          {pathname.startsWith('/prova') ? <PremiumGate><Outlet /></PremiumGate> : <Outlet />}
          {!isLanding && <Footer />}
        </div>
      </div>
      <XpCelebration />
      </SubscriptionProvider>
    </QueryClientProvider>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
        <img
          src={nexemLogo.url}
          alt="nexem"
          className="h-7 w-auto opacity-80"
        />
        <p className="text-center text-xs text-muted-foreground">
          Nexem — Estudo adaptativo para o ENEM. Pratique no seu nível e evolua todos os dias.
        </p>
      </div>
    </footer>
  );
}

/* --- Inline nav icons (stroke, currentColor) --- */
type IconProps = { className?: string };
function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </svg>
  );
}
function SimuladoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
function RedacaoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l5 5L8 21l-5 1 1-5L16 3z" />
      <path d="M14 5l5 5" />
    </svg>
  );
}
function EstatisticasIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
