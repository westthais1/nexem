import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3, BookOpen, Check, Clock, FileText, Image as ImageIcon, Layers, Loader2, Lock, Map as MapIcon,
  RotateCcw, Trash2, Upload, X, ListChecks, Notebook,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processMaterial } from "@/lib/materials.functions";
import {
  FREE_MATERIAL_LIMIT, pathProgress,
  type DetailedSection, type Flashcard, type PathStep, type StepStatus,
} from "@/lib/materials";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materiais")({
  head: () => ({
    meta: [
      { title: "Meus Materiais — Nexem" },
      { name: "description", content: "Envie PDFs, anotações e fotos e receba resumos, flashcards e uma trilha de estudo para o ENEM." },
      { property: "og:title", content: "Meus Materiais — Nexem" },
      { property: "og:description", content: "Transforme seus arquivos em resumos, flashcards e trilha de estudo para o ENEM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MateriaisPage,
});

type Material = {
  id: string; file_name: string; file_type: string; file_size: number; title: string; created_at: string;
  bullets: string[]; detailed: string; flashcards: Flashcard[]; path: PathStep[];
  card_status: Record<string, "got" | "review">; step_status: Record<string, StepStatus>;
};
type Upload = { key: string; name: string; state: "reading" | "processing" | "error" | "limit"; error?: string };
type Tab = "docs" | "notes" | "cards" | "path" | "stats";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "docs", label: "Documentos", icon: FileText },
  { id: "notes", label: "Resumos", icon: Notebook },
  { id: "cards", label: "Flashcards", icon: Layers },
  { id: "path", label: "Trilha de estudo", icon: MapIcon },
  { id: "stats", label: "Progresso", icon: BarChart3 },
];
const MAX_BYTES = 10 * 1024 * 1024;

function toBase64(buf: ArrayBuffer) {
  let bin = ""; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function readFile(file: File): Promise<{ kind: "text" | "pdf" | "image"; content: string }> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return { kind: "pdf", content: toBase64(await file.arrayBuffer()) };
  if (file.type.startsWith("image/")) return { kind: "image", content: toBase64(await file.arrayBuffer()) };
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!value.trim()) throw new Error("Documento sem texto.");
    return { kind: "text", content: value };
  }
  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    const text = await file.text();
    if (!text.trim()) throw new Error("Arquivo vazio.");
    return { kind: "text", content: text };
  }
  throw new Error("Formato não suportado. Use PDF, TXT, DOCX ou imagem.");
}

function MateriaisPage() {
  const [tab, setTab] = useState<Tab>("docs");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const qc = useQueryClient();
  const process = useServerFn(processMaterial);
  const { isPremium, openUpgrade } = useSubscription();

  const { data: materials = [], isPending } = useQuery({
    queryKey: ["study-materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_materials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Material[];
    },
  });
  const selected = materials.find((m) => m.id === selectedId) ?? materials[0] ?? null;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_MATERIAL_LIMIT - materials.length);

  const handleFiles = useCallback(async (files: File[]) => {
    let slots = remaining - uploads.filter((u) => u.state === "reading" || u.state === "processing").length;
    for (const file of files) {
      const key = crypto.randomUUID();
      const set = (patch: Partial<Upload>) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));
      if (slots <= 0) {
        setUploads((l) => [...l, { key, name: file.name, state: "limit" }]);
        continue;
      }
      slots--;
      setUploads((l) => [...l, { key, name: file.name, state: "reading" }]);
      void (async () => {
        try {
          if (file.size > MAX_BYTES) throw new Error("Arquivo maior que 10 MB.");
          const { kind, content } = await readFile(file);
          set({ state: "processing" });
          const res = await process({ data: { fileName: file.name, mimeType: file.type, kind, content, size: file.size } });
          if (res.limitReached) { set({ state: "limit" }); return; }
          setUploads((l) => l.filter((u) => u.key !== key));
          await qc.invalidateQueries({ queryKey: ["study-materials"] });
          setSelectedId(res.id);
        } catch (e) {
          set({ state: "error", error: e instanceof Error ? e.message : "Falha ao processar." });
        }
      })();
    }
  }, [remaining, uploads, process, qc]);

  const updateMaterial = useCallback(async (id: string, patch: Partial<Pick<Material, "card_status" | "step_status">>) => {
    qc.setQueryData<Material[]>(["study-materials"], (old) => old?.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const { error } = await supabase.from("study_materials").update(patch).eq("id", id);
    if (error) void qc.invalidateQueries({ queryKey: ["study-materials"] });
  }, [qc]);

  const remove = async (id: string) => {
    qc.setQueryData<Material[]>(["study-materials"], (old) => old?.filter((m) => m.id !== id));
    await supabase.from("study_materials").delete().eq("id", id);
    void qc.invalidateQueries({ queryKey: ["study-materials"] });
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Meus Materiais</h1>
        <p className="text-muted-foreground">Envie provas antigas, resumos e anotações. O Nex transforma tudo em resumos, flashcards e uma trilha de estudo.</p>
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Seções">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </nav>

      {tab !== "docs" && tab !== "stats" && materials.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {materials.map((m) => (
            <button key={m.id} onClick={() => setSelectedId(m.id)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", selected?.id === m.id ? "border-primary text-primary" : "border-border text-muted-foreground")}>
              {m.title || m.file_name}
            </button>
          ))}
        </div>
      )}

      {tab === "docs" && (
        <DocsTab materials={materials} uploads={uploads} loading={isPending} isPremium={isPremium} remaining={remaining}
          onFiles={handleFiles} onRemove={remove} onDismiss={(k) => setUploads((l) => l.filter((u) => u.key !== k))}
          onOpen={(id) => { setSelectedId(id); setTab("notes"); }} onUpgrade={openUpgrade} />
      )}
      {tab !== "docs" && !selected && <Empty onGo={() => setTab("docs")} />}
      {tab === "notes" && selected && <NotesTab m={selected} />}
      {tab === "cards" && selected && <CardsTab key={selected.id} m={selected} onStatus={(cs) => updateMaterial(selected.id, { card_status: cs })} />}
      {tab === "path" && selected && <PathTab m={selected} onStatus={(ss) => updateMaterial(selected.id, { step_status: ss })} />}
      {tab === "stats" && <StatsTab materials={materials} />}
    </main>
  );
}

function Empty({ onGo }: { onGo: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="mb-4 text-muted-foreground">Envie um arquivo para gerar seu material de estudo.</p>
      <Button onClick={onGo}>Enviar arquivos</Button>
    </div>
  );
}

function DocsTab(props: {
  materials: Material[]; uploads: Upload[]; loading: boolean; isPremium: boolean; remaining: number;
  onFiles: (f: File[]) => void; onRemove: (id: string) => void; onDismiss: (k: string) => void; onOpen: (id: string) => void; onUpgrade: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const locked = !props.isPremium && props.remaining <= 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="space-y-6 rounded-3xl bg-card p-4 sm:p-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (!locked) props.onFiles(Array.from(e.dataTransfer.files)); }}
          className={cn("rounded-2xl border-2 border-dashed p-8 text-center transition-colors", drag ? "border-primary bg-primary/5" : "border-border bg-background")}
        >
          <p className="font-semibold">Envie arquivos ou arraste e solte aqui</p>
          <p className="mb-4 text-sm text-muted-foreground">PDFs, TXT, DOCX e imagens · até 10 MB cada</p>
          {locked ? (
            <Button onClick={props.onUpgrade}><Lock /> Limite grátis atingido · Nexem Pro</Button>
          ) : (
            <Button onClick={() => input.current?.click()} className="rounded-full"><Upload /> Enviar arquivos</Button>
          )}
          <input ref={input} type="file" multiple hidden accept=".pdf,.txt,.md,.docx,image/*"
            onChange={(e) => { props.onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
          {!props.isPremium && (
            <p className="mt-3 text-xs text-muted-foreground">Plano grátis: {props.remaining} de {FREE_MATERIAL_LIMIT} arquivos disponíveis.</p>
          )}
        </div>

        {props.uploads.map((u) => (
          <div key={u.key} className="flex items-center gap-3 rounded-xl border border-border p-3">
            {u.state === "reading" || u.state === "processing" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" /> : <X className="h-5 w-5 shrink-0 text-destructive" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name}</p>
              {u.state === "reading" && <><p className="text-xs text-muted-foreground">Lendo arquivo…</p><Progress value={30} className="mt-1 h-1.5" /></>}
              {u.state === "processing" && <><p className="text-xs text-muted-foreground">Extraindo conteúdo e gerando resumos…</p><Progress value={70} className="mt-1 h-1.5 animate-pulse" /></>}
              {u.state === "error" && <p className="text-xs text-destructive">{u.error}</p>}
              {u.state === "limit" && <p className="text-xs text-destructive">Você usou os {FREE_MATERIAL_LIMIT} arquivos do plano grátis. <button className="underline" onClick={props.onUpgrade}>Assinar Nexem Pro</button></p>}
            </div>
            {(u.state === "error" || u.state === "limit") && <Button size="icon" variant="ghost" aria-label="Dispensar" onClick={() => props.onDismiss(u.key)}><X /></Button>}
          </div>
        ))}

        {props.loading ? <Loader2 className="mx-auto animate-spin text-primary" /> : props.materials.length === 0 && props.uploads.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Nenhum arquivo enviado ainda.</div>
        ) : (
          <ul className="space-y-2">
            {props.materials.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                {m.file_type.startsWith("image/") ? <ImageIcon className="h-5 w-5 shrink-0 text-accent" /> : <FileText className="h-5 w-5 shrink-0 text-primary" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title || m.file_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.file_name} · {m.flashcards.length} flashcards · {m.path.length} passos</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => props.onOpen(m.id)}>Ver</Button>
                <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => props.onRemove(m.id)}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="h-fit space-y-3 rounded-3xl bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Transforme seus arquivos em um kit de estudo</h2>
        {[{ i: ListChecks, t: "Resumo em tópicos" }, { i: BookOpen, t: "Anotações detalhadas" }, { i: Layers, t: "Flashcards" }, { i: MapIcon, t: "Trilha de estudo ENEM" }].map(({ i: I, t }) => (
          <div key={t} className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm font-medium"><I className="h-5 w-5 text-primary" />{t}</div>
        ))}
      </aside>
    </div>
  );
}

function Bold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="text-foreground">{p.slice(2, -2)}</strong> : p))}</>;
}

function NotesTab({ m }: { m: Material }) {
  const [mode, setMode] = useState<"bullets" | "detailed">("bullets");
  const detailed = useMemo<DetailedSection[]>(() => { try { return JSON.parse(m.detailed); } catch { return []; } }, [m.detailed]);
  return (
    <section className="rounded-3xl bg-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{m.title}</h2>
        <div className="flex rounded-full border border-border p-1">
          {(["bullets", "detailed"] as const).map((k) => (
            <button key={k} onClick={() => setMode(k)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", mode === k ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {k === "bullets" ? "Tópicos" : "Detalhado"}
            </button>
          ))}
        </div>
      </div>
      {mode === "bullets" ? (
        <ul className="space-y-3">
          {m.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><span><Bold text={b} /></span></li>
          ))}
        </ul>
      ) : (
        <article className="space-y-6 text-muted-foreground">
          {detailed.map((s, i) => (
            <div key={i}>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{s.heading}</h3>
              {s.paragraphs.map((p, j) => <p key={j} className="mb-2 leading-relaxed"><Bold text={p} /></p>)}
            </div>
          ))}
          <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
        </article>
      )}
    </section>
  );
}

function CardsTab({ m, onStatus }: { m: Material; onStatus: (cs: Material["card_status"]) => void }) {
  const [reviewOnly, setReviewOnly] = useState(false);
  const deck = m.flashcards.map((c, i) => ({ ...c, i })).filter((c) => !reviewOnly || m.card_status[c.i] !== "got");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck[Math.min(idx, Math.max(0, deck.length - 1))];
  const got = Object.values(m.card_status).filter((s) => s === "got").length;
  const mark = (s: "got" | "review") => {
    if (!card) return;
    onStatus({ ...m.card_status, [card.i]: s });
    setFlipped(false);
    setIdx((v) => (reviewOnly && s === "got" ? v : (v + 1) % Math.max(1, deck.length)));
  };
  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary">{got}/{m.flashcards.length} dominados</Badge>
        <Button variant={reviewOnly ? "default" : "outline"} size="sm" onClick={() => { setReviewOnly((v) => !v); setIdx(0); setFlipped(false); }}>
          <RotateCcw /> {reviewOnly ? "Modo revisão ativo" : "Modo revisão"}
        </Button>
      </div>
      {!card ? (
        <div className="rounded-3xl bg-card p-10 text-center text-muted-foreground">Tudo revisado! 🎉</div>
      ) : (
        <>
          <button onClick={() => setFlipped((f) => !f)} className="block h-72 w-full [perspective:1200px]" aria-label="Virar cartão">
            <div className={cn("relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
              <Face label="Pergunta">{card.front}</Face>
              <Face label="Resposta" back>{card.back}</Face>
            </div>
          </button>
          <p className="text-center text-xs text-muted-foreground">Cartão {Math.min(idx, deck.length - 1) + 1} de {deck.length} · toque para virar</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => mark("review")}>Preciso revisar</Button>
            <Button onClick={() => mark("got")}><Check /> Entendi</Button>
          </div>
        </>
      )}
    </section>
  );
}

function Face({ children, label, back }: { children: ReactNode; label: string; back?: boolean }) {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border p-8 text-center [backface-visibility:hidden]",
      back ? "bg-primary text-primary-foreground [transform:rotateY(180deg)]" : "bg-card")}>
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <p className="text-lg font-medium leading-relaxed">{children}</p>
    </div>
  );
}

const NEXT: Record<StepStatus, StepStatus> = { todo: "doing", doing: "done", done: "todo" };
const LABEL: Record<StepStatus, string> = { todo: "Não iniciado", doing: "Em andamento", done: "Concluído" };

function PathTab({ m, onStatus }: { m: Material; onStatus: (ss: Material["step_status"]) => void }) {
  const statuses = m.path.map((_, i) => m.step_status[i] ?? "todo");
  const pct = pathProgress(statuses);
  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-card p-6">
        <p className="mb-2 font-medium">{pct}% da trilha ENEM concluída</p>
        <Progress value={pct} className="h-3" />
      </div>
      <ol className="space-y-4">
        {m.path.map((s, i) => {
          const st = statuses[i] ?? "todo";
          return (
            <li key={i} className={cn("rounded-3xl border bg-card p-6 transition-colors", st === "done" ? "border-primary" : "border-border")}>
              <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <Button size="sm" variant={st === "done" ? "default" : "outline"} onClick={() => onStatus({ ...m.step_status, [i]: NEXT[st] })}>
                  {st === "done" && <Check />}{LABEL[st]}
                </Button>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{s.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{s.minutes} min</Badge>
                {s.format && <Badge variant="outline">{s.format}</Badge>}
                {s.concepts.map((c) => <Badge key={c} variant="outline" className="text-muted-foreground">{c}</Badge>)}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatsTab({ materials }: { materials: Material[] }) {
  const cards = materials.reduce((s, m) => s + m.flashcards.length, 0);
  const got = materials.reduce((s, m) => s + Object.values(m.card_status).filter((x) => x === "got").length, 0);
  const allSteps = materials.flatMap((m) => m.path.map((_, i) => m.step_status[i] ?? "todo"));
  const minutesDone = materials.reduce((s, m) => s + m.path.reduce((a, p, i) => a + ((m.step_status[i] ?? "todo") === "done" ? p.minutes : 0), 0), 0);
  const stats = [
    { l: "Arquivos", v: materials.length },
    { l: "Flashcards dominados", v: `${got}/${cards}` },
    { l: "Trilha concluída", v: `${pathProgress(allSteps)}%` },
    { l: "Minutos estudados", v: minutesDone },
  ];
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <div key={s.l} className="rounded-3xl bg-card p-5"><p className="text-xs text-muted-foreground">{s.l}</p><p className="font-display text-2xl font-semibold">{s.v}</p></div>)}
      </div>
      <div className="space-y-4 rounded-3xl bg-card p-6">
        {materials.length === 0 && <p className="text-muted-foreground">Envie arquivos para acompanhar seu progresso.</p>}
        {materials.map((m) => {
          const pct = pathProgress(m.path.map((_, i) => m.step_status[i] ?? "todo"));
          return <div key={m.id}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{m.title || m.file_name}</span><span className="shrink-0 text-muted-foreground">{pct}%</span></div><Progress value={pct} className="h-2" /></div>;
        })}
      </div>
    </section>
  );
}
