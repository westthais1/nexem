import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Send, X, Loader2 } from "lucide-react";

import { askTutor } from "@/lib/tutor.functions";
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';

type Msg = { role: "user" | "assistant"; content: string };

export function TutorChat({
  open,
  onOpenChange,
  question,
  options,
  area,
  explicacao,
  hintToken,
  review,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  options: string[];
  area: string;
  explicacao?: string | null;
  /** Incrementa a cada clique no botão de ajuda: dispara a primeira pista proativa. */
  hintToken: number;
  review?: { day:string; questionId:string };
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const { openUpgrade, isPremium } = useSubscription();
  const ask = useServerFn(askTutor);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastToken = useRef(0);

  async function request(next: Msg[]) {
    if (loading || (limitReached && !isPremium)) return;
    setError(null);
    setLoading(true);
    try {
      const res = await ask({
        data: { question, options, area, explicacao: explicacao ?? null, messages: next, review },
      });
      if (res.limitReached) { setLimitReached(true); return; }
      setLimitReached(false);
      if (review) window.dispatchEvent(new Event('nexem-game-change'));
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao falar com o tutor.");
    } finally {
      setLoading(false);
    }
  }

  // Pista proativa: ao clicar no botão, se ainda não houver conversa, o Nex começa sozinho.
  useEffect(() => {
    if (!open || hintToken === 0 || hintToken === lastToken.current) return;
    lastToken.current = hintToken;
    if (messages.length === 0 && !loading) void request([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintToken, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    void request(next);
  }

  return (
    <>
      {/* fundo escuro no celular */}
      <div
        onClick={() => onOpenChange(false)}
        className={`fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-500 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 z-50 flex h-[78dvh] flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl transition-all duration-500 ease-out lg:sticky lg:top-6 lg:z-auto lg:h-[calc(100vh-3rem)] lg:shrink-0 lg:rounded-2xl lg:shadow-none ${
          open
            ? "translate-y-0 lg:w-[40%] lg:translate-x-0 lg:opacity-100"
            : "pointer-events-none translate-y-full lg:w-0 lg:translate-y-0 lg:translate-x-8 lg:border-0 lg:opacity-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border lg:hidden" />
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Brain size={16} className="text-primary-foreground" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Tutor Socrático Nex</p>
              <p className="text-[11px] text-muted-foreground">Dicas, nunca a resposta</p>
            </div>
          </div>
          <Button variant="ghost" size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar chat do tutor"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </header>

        <div ref={scrollRef} className="min-w-[280px] flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {m.content}
                </p>
              </div>
            ) : (
              <p
                key={i}
                className="animate-fade-in-up max-w-full whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              >
                {m.content}
              </p>
            ),
          )}

          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Nex está preparando uma pista...
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
              {error}
            </p>
          )}
          {limitReached && !isPremium && <div role="alert" className="animate-fade-in-up rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
            <p>Você atingiu o limite gratuito de 3 consultas diárias. Faça o upgrade para o Nexem Pro para ter ajuda socrática ilimitada!</p>
            <Button variant="link" className="mt-2 block px-0" onClick={openUpgrade}>Assinar Agora</Button>
          </div>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex min-w-[280px] items-end gap-2 border-t border-border p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="Responda ao Nex ou peça outra pista..."
            className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim() || (limitReached && !isPremium)}
            aria-label="Enviar pergunta"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send size={15} />
          </Button>
        </form>
      </aside>
    </>
  );
}
