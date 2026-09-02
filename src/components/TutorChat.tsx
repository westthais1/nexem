import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircleQuestion, Send, X, Loader2 } from "lucide-react";

import { askTutor } from "@/lib/tutor.functions";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Por onde eu começo?",
  "Qual conceito está sendo cobrado?",
  "Como eliminar alternativas?",
];

export function TutorChat({
  open,
  onOpenChange,
  question,
  options,
  area,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  options: string[];
  area: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askTutor);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await ask({ data: { question, options, area, messages: next } });
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao falar com o tutor.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-glow-neon"
      >
        <MessageCircleQuestion size={16} className="text-primary" />
        Pedir ajuda ao Tutor
      </button>
    );
  }

  return (
    <aside className="flex h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-glow lg:h-[calc(100vh-8rem)] lg:w-[380px] lg:shrink-0">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <MessageCircleQuestion size={15} className="text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Tutor Socrático</p>
            <p className="text-[11px] text-muted-foreground">Dicas, nunca a resposta</p>
          </div>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Fechar chat do tutor"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Me conte onde você travou nesta questão. Eu te guio com pistas — a resposta final é sua.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {m.content}
              </p>
            </div>
          ) : (
            <p key={i} className="max-w-full whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {m.content}
            </p>
          ),
        )}

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Pensando numa boa pista...
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
            {error}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder="Escreva sua dúvida..."
          className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar pergunta"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
