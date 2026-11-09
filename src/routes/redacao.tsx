import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COMPETENCIA_INFO, weakestCompetencia } from "@/lib/next-steps";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Camera, CheckCircle2, Loader2, Sparkles, Trash2 } from "lucide-react";
import { corrigirRedacao, type EssayCorrection } from "@/lib/essay.functions";
import { awardXp } from "@/lib/xp";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";



export const Route = createFileRoute("/redacao")({
  head: () => ({
    meta: [
      { title: "Redação Inteligente — Nexem" },
      {
        name: "description",
        content:
          "Escreva sua redação do ENEM e receba correção competência por competência com o Professor Claude.",
      },
      { property: "og:title", content: "Redação Inteligente — Nexem" },
      {
        property: "og:description",
        content: "Correção inteligente de redação para o ENEM com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedacaoPage,
});

const WEEKLY_THEMES = [
  "Os caminhos para combater a intolerância religiosa no Brasil",
  "Desafios para a valorização da saúde mental dos jovens no Brasil",
  "Os impactos da inteligência artificial na sociedade brasileira",
  "Os riscos das apostas esportivas online para a população brasileira",
  "Caminhos para enfrentar a solidão e o isolamento social no Brasil",
  "O desafio do acesso à moradia digna nas cidades brasileiras",
  "Os efeitos das mudanças climáticas na vida da população brasileira",
  "Desafios para garantir o acesso à água potável no Brasil",
  "Os impactos da desinformação digital na democracia brasileira",
  "Caminhos para combater a evasão escolar no Brasil",
  "Desafios para a inclusão de pessoas com deficiência no mercado de trabalho",
  "O combate ao desperdício de alimentos no Brasil",
  "A persistência da violência contra a mulher na sociedade brasileira",
  "Os desafios da mobilidade urbana nas grandes cidades brasileiras",
  "A valorização dos povos indígenas e de sua cultura no Brasil",
  "Os impactos do uso excessivo de telas na infância e adolescência",
];

/** Tema muda toda segunda-feira (semana contada em horário de Brasília). */
function themeOfTheWeek(now = new Date()): string {
  const brt = now.getTime() - 3 * 3600 * 1000;
  const MONDAY_EPOCH = Date.UTC(1970, 0, 5); // primeira segunda-feira
  const week = Math.floor((brt - MONDAY_EPOCH) / (7 * 24 * 3600 * 1000));
  return WEEKLY_THEMES[((week % WEEKLY_THEMES.length) + WEEKLY_THEMES.length) % WEEKLY_THEMES.length] ?? WEEKLY_THEMES[0]!;
}

const THEME_OF_THE_WEEK = themeOfTheWeek();
const MAX_LINES = 30;
const MIN_LINES_TO_SEND = 8;

const ESSAY_INSTRUCTIONS: { title: string; body: string }[] = [
  {
    title: "Estrutura",
    body:
      "Texto dissertativo-argumentativo em prosa, com 30 linhas no máximo e 8 no mínimo.",
  },
  {
    title: "Competências",
    body:
      "São avaliadas 5 competências: domínio da norma culta, compreensão da proposta, argumentação, coesão e proposta de intervenção.",
  },
  {
    title: "Proposta de intervenção",
    body:
      "Apresente uma solução completa: agente, ação, meio, fim e detalhamento.",
  },
  {
    title: "Repertório",
    body:
      "Inclua repertório sociocultural (exemplos, dados, citações) que dialogue com o tema.",
  },
];

const COMPETENCIAS: { key: "c1" | "c2" | "c3" | "c4" | "c5"; label: string }[] = [
  { key: "c1", label: "C1 · Norma culta" },
  { key: "c2", label: "C2 · Compreensão do tema" },
  { key: "c3", label: "C3 · Defesa de ponto de vista" },
  { key: "c4", label: "C4 · Mecanismos coesivos" },
  { key: "c5", label: "C5 · Proposta de intervenção" },
];

const ESSAY_HISTORY_KEY = ["enem_essays", "historico"];

type SavedEssay = { id: string; tema: string; nota_total: number; c1: number; c2: number; c3: number; c4: number; c5: number; comentario: string | null; feedback: unknown; created_at: string };

async function fetchEssayHistory(): Promise<SavedEssay[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("enem_essays")
    .select("id,tema,nota_total,c1,c2,c3,c4,c5,comentario,feedback,created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Não foi possível carregar seu histórico de redações.");
  return data as SavedEssay[];
}

function NextStepsAfterEssay({ fb }: { fb: EssayCorrection }) {
  const k = weakestCompetencia(fb);
  const info = COMPETENCIA_INFO[k];
  const link = "rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40";
  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Sua competência mais fraca</p>
      <h3 className="mt-1 text-base font-semibold text-foreground">{info.titulo} · {fb[k]}/200</h3>
      <p className="mt-1 text-sm text-muted-foreground">{info.explica}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/guia-enem" className={link}>Como a redação é corrigida</Link>
        <Link to="/raio-x" className={link}>Repertório e temas recorrentes</Link>
        <Link to="/estatisticas" className={link}>Histórico nas Estatísticas</Link>
      </div>
    </div>
  );
}

function EssayHistory({ onOpen }: { onOpen: (e: SavedEssay) => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ESSAY_HISTORY_KEY, queryFn: fetchEssayHistory });
  return (
    <section id="historico" className="mt-10 scroll-mt-20 rounded-2xl border border-border bg-card p-6 card-glow">
      <h2 className="text-lg font-semibold text-foreground">Suas redações anteriores</h2>
      {isLoading && <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>}
      {isError && <p className="mt-3 text-sm text-destructive">Não foi possível carregar seu histórico.</p>}
      {data && data.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhuma redação corrigida ainda. Sua primeira correção aparecerá aqui.</p>}
      {data && data.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {data.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onOpen(e)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm hover:text-primary">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{e.tema}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
                </span>
                <span className="shrink-0 font-semibold text-foreground">{e.nota_total}/1000</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RedacaoPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EssayCorrection | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();
  const corrigir = useServerFn(corrigirRedacao);

  // Conta linhas com base em quebras reais (\n) — simula as linhas da folha do ENEM.
  const lineCount = useMemo(() => {
    const raw = text.split("\n");
    let count = 0;
    for (const line of raw) {
      if (!line) count += 1;
      else count += Math.max(1, Math.ceil(line.length / 90));
    }
    return Math.min(MAX_LINES, count);
  }, [text]);

  const textReady = lineCount >= MIN_LINES_TO_SEND && text.trim().length >= 200;
  const canSend = status !== "sending" && !uploading && (Boolean(imagePath) || textReady);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Envie apenas imagens PNG ou JPG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("A imagem precisa ter no máximo 10MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setUploadError("Entre na sua conta para enviar a foto da redação.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("redacao-fotos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("redacao-fotos")
        .createSignedUrl(path, 600);
      if (signErr) throw signErr;
      setImagePath(path);
      setPreviewUrl(signed?.signedUrl ?? null);
    } catch (err) {
      console.error("[Redação] Falha no upload da imagem:", err);
      setUploadError(
        err instanceof Error ? err.message : "Não foi possível enviar a imagem. Tente novamente.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage() {
    setImagePath(null);
    setPreviewUrl(null);
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleSubmit() {
    if (!canSend) return;
    setStatus("sending");
    setError(null);
    setFeedback(null);
    try {
      const result = await corrigir({
        data: {
          tema: THEME_OF_THE_WEEK,
          texto: text.trim(),
          ...(imagePath ? { imagem_path: imagePath } : {}),
        },
      });
      setFeedback(result);
      setStatus("done");
      awardXp("redacao");
      void queryClient.invalidateQueries({ queryKey: ESSAY_HISTORY_KEY });
    } catch (err) {
      console.error("[Redação] Erro na correção:", err);
      setError(
        err instanceof Error ? err.message : "Não foi possível corrigir sua redação agora.",
      );
      setStatus("idle");
    }
  }

  const uploadCard = (
    <div className="rounded-2xl border border-border bg-card p-6 card-glow">
      <h3 className="text-sm font-semibold text-foreground">
        Tirar Foto ou Enviar Imagem da Redação
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Fotografe a folha manuscrita como na prova real. Aceita PNG ou JPG (até 10MB).
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        {...(isMobile ? { capture: "environment" as const } : {})}
        onChange={handleFileChange}
        className="hidden"
      />

      {!imagePath ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-6 py-10 text-center transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </span>
          <span className="text-sm font-medium text-foreground">
            {uploading
              ? "Enviando imagem…"
              : isMobile
                ? "Abrir câmera e fotografar a folha"
                : "Tirar Foto ou Enviar Imagem da Redação"}
          </span>
          <span className="text-xs text-muted-foreground">PNG ou JPG</span>
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Miniatura da folha de redação enviada"
              className="h-32 w-32 rounded-xl border border-border object-cover"
              loading="lazy"
            />
          )}
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Imagem enviada com sucesso
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              A IA vai ler sua letra e corrigir pelas 5 competências.
            </p>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover e tirar outra
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );


  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <header>
          <span className="text-xs font-medium uppercase tracking-wider text-accent">
            Redação Inteligente
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            Escreva. Corrija. Evolua.
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Escreva sua redação seguindo o tema da semana e envie para o Professor
            Claude corrigir competência por competência.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Coluna esquerda — tema + instruções */}
          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card card-glow">
              <div className="bg-aurora absolute inset-0 opacity-60" />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
              <div className="relative p-6 md:p-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-accent backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Tema da Semana
                </span>
                <h2 className="mt-4 text-2xl font-semibold leading-snug text-foreground">
                  {THEME_OF_THE_WEEK}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Redija um texto dissertativo-argumentativo sobre o tema acima,
                  com base na situação-problema e nos textos motivadores.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <h3 className="text-sm font-semibold text-foreground">
                Instruções da redação ENEM
              </h3>
              <ul className="mt-4 space-y-4">
                {ESSAY_INSTRUCTIONS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      ›
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Coluna direita — upload + textarea + envio + feedback */}
          <section className="space-y-6">
            {uploadCard}
            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <div className="flex items-center justify-between">
                <label htmlFor="essay" className="text-sm font-medium text-foreground">
                  {imagePath ? "Observações (opcional)" : "Ou digite sua redação"}
                </label>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    lineCount >= MAX_LINES
                      ? "text-destructive"
                      : lineCount >= MIN_LINES_TO_SEND
                        ? "text-accent"
                        : "text-muted-foreground"
                  }`}
                >
                  {lineCount} / {MAX_LINES} linhas
                </span>
              </div>

              <textarea
                id="essay"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva sua redação aqui, uma ideia por linha, simulando as 30 linhas da folha do ENEM…"
                className="mt-3 h-80 w-full resize-none rounded-lg border border-input bg-background/40 p-4 font-sans text-[15px] leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Trilha de linhas simulada */}
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: MAX_LINES }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 min-w-[6px] rounded-full transition-colors ${
                      i < lineCount
                        ? lineCount >= MAX_LINES
                          ? "bg-destructive/70"
                          : "bg-gradient-to-r from-accent to-primary"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {imagePath
                  ? "Sua foto já está pronta para correção — o texto digitado é opcional."
                  : lineCount < MIN_LINES_TO_SEND
                    ? `Mínimo de ${MIN_LINES_TO_SEND} linhas para enviar. Faltam ${MIN_LINES_TO_SEND - lineCount}.`
                    : lineCount >= MAX_LINES
                      ? "Você atingiu o limite de 30 linhas."
                      : `${MAX_LINES - lineCount} linhas restantes.`}
              </p>

              <div className="mt-5 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  O Professor Claude analisa as 5 competências do ENEM.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 hover:shadow-[0_0_24px_-6px_var(--electric)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Sparkles className="h-4 w-4" />
                  Enviar para Correção da IA
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Estado de envio / carregamento */}
            {status === "sending" && (
              <div className="rounded-2xl border border-accent/40 bg-card p-6 card-glow">
                <div className="flex items-center gap-3 text-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="text-sm font-medium">
                    O Professor Claude está analisando sua redação…
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-full animate-pulse rounded bg-border/60"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resultado da correção */}
            {status === "done" && feedback && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-6 card-glow">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold text-foreground text-glow-electric">
                      {feedback.nota_total}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">
                      / 1000
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nota atribuída pelo Professor Claude
                  </p>
                  {feedback.comentario && (
                    <div className="mt-3 max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground/90">
                      {feedback.comentario.replace(/^##\s*/gm, "")}
                    </div>
                  )}
                  <div className="mt-5 space-y-3">
                    {COMPETENCIAS.map((row) => (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium text-foreground">
                            {feedback[row.key]}/200
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                            style={{ width: `${(feedback[row.key] / 200) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {feedback.transcricao && (
                  <div className="rounded-2xl border border-border bg-card p-6 card-glow">
                    <h3 className="text-sm font-semibold text-foreground">
                      Transcrição lida pela IA
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {feedback.transcricao}
                    </p>
                  </div>
                )}
                <NextStepsAfterEssay fb={feedback} />
                <div className="rounded-2xl border border-border bg-card p-6 card-glow">

                  <h3 className="text-sm font-semibold text-foreground">
                    Dicas do Professor Claude
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {feedback.dicas.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="text-accent">›</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </section>
        </div>
        <EssayHistory
          onOpen={(e) => {
            setFeedback({ c1: e.c1, c2: e.c2, c3: e.c3, c4: e.c4, c5: e.c5, nota_total: e.nota_total, comentario: e.comentario ?? "", dicas: Array.isArray(e.feedback) ? (e.feedback as string[]) : [], transcricao: "" });
            setStatus("done");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </main>
  );
}
