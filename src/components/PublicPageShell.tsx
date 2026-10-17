import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";

/** Casca pública (cabeçalho + rodapé) das páginas informativas da landing. */
export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/landing" search={{ preview: true }} aria-label="Voltar para a página inicial">
            <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          </Link>
          <Button asChild variant="ghost" className="text-foreground hover:bg-primary/10 hover:text-primary">
            <Link to="/landing" search={{ preview: true }}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-background px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img src={nexemLogo.url} alt="nexem" className="h-8 w-auto" />
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            Nexem — Estudo adaptativo para o ENEM. Pratique no seu nível e evolua todos os dias.
          </p>
        </div>
      </footer>
    </main>
  );
}
