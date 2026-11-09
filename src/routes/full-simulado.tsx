import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AREA_INFO } from "@/lib/stats-areas";
import { useServerFn } from "@tanstack/react-start";
import { Check, Clock, Loader2, Lock } from "lucide-react";

import { getPremiumQuestionPool } from '@/lib/subscription.functions';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { registrarProva } from "@/lib/exam.functions";
import { corrigirRedacao, type EssayCorrection } from "@/lib/essay.functions";
import { awardXp } from "@/lib/xp";

export const Route = createFileRoute("/full-simulado")({
  head: () => ({
    meta: [
      { title: "Prova Completa ENEM em 2 Dias — Nexem" },
      {
        name: "description",
        content:
          "Simule o ENEM real: Dia 1 (Linguagens, Humanas e Redação, 5h30) e Dia 2 (Natureza e Matemática, 5h), com cartão-resposta e nota TRI ao final.",
      },
      { property: "og:title", content: "Prova Completa ENEM em 2 Dias — Nexem" },
      {
        property: "og:description",
        content: "Ambiente de prova fiel ao ENEM: 90 questões por dia, cronômetro oficial e correção só na entrega.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvaCompletaPage,
});

/* --------------------------------- config --------------------------------- */

const BANCO = "Banco Geral Nexem";
const STORAGE_KEY = "nexem_prova_completa_sessao";
const LETTERS = ["A", "B", "C", "D", "E"] as const;
const TEMA_REDACAO = "Os caminhos para combater a intolerância religiosa no Brasil";

type Day = 1 | 2;
type AreaKey = "linguagens" | "humanas" | "natureza" | "matematica";

const AREA_LABEL: Record<AreaKey, string> = {
  linguagens: "Linguagens e Códigos",
  humanas: "Ciências Humanas",
  natureza: "Ciências da Natureza",
  matematica: "Matemática",
};

const DAY_CONFIG: Record<Day, { title: string; areas: [AreaKey, AreaKey]; minutes: number; essay: boolean }> = {
  1: { title: "Dia 1: Humanidades e Redação", areas: ["linguagens", "humanas"], minutes: 330, essay: true },
  2: { title: "Dia 2: Exatas e Natureza", areas: ["natureza", "matematica"], minutes: 300, essay: false },
};

type ExamQuestion = {
  id: number | string;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
  resposta_correta: string;
  area_conhecimento: string | null;
  materia: string | null;
  dificuldade: number | null;
  explicacao: string | null;
  imagem_url: string | null;
};

type Session = {
  day: Day;
  startedAt: number;
  questions: ExamQuestion[]; // 90, já ordenadas (1–45 área A, 46–90 área B)
  respostas: Record<string, string>; // índice (1..90) -> letra
  redacao: string;
  submittedAt: number | null;
};

const COLUMNS =
  "id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,area_conhecimento,materia,dificuldade,explicacao,imagem_url";

function areaOf(raw: string | null): AreaKey | null {
  const a = (raw ?? "").trim().toLowerCase();
  if (a.startsWith("linguagens")) return "linguagens";
  if (a.startsWith("ciências humanas") || a.startsWith("ciencias humanas")) return "humanas";
  if (a.startsWith("ciências da natureza") || a.startsWith("ciencias da natureza")) return "natureza";
  if (a.startsWith("matemática") || a.startsWith("matematica")) return "matematica";
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** IDs já vistos em provas completas anteriores do aluno. */
async function fetchAttemptedIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return ids;
  const { data } = await supabase
    .from("enem_exam_attempts")
    .select("respostas")
    .eq("user_id", auth.user.id);
  for (const row of data ?? []) {
    const r = row.respostas as Record<string, unknown> | null;
    const raw = r?.["__question_ids"];
    const qids: unknown[] = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    qids.forEach((id) => ids.add(String(id)));
  }
  return ids;
}

/** Monta 90 questões: 45 da 1ª área + 45 da 2ª, priorizando não tentadas. */
async function buildDay(day: Day, pool: ExamQuestion[]): Promise<{ questions: ExamQuestion[]; faltantes: number }> {
  const [areaA, areaB] = DAY_CONFIG[day].areas;
  const attempted = await fetchAttemptedIds();

  let faltantes = 0;
  const pick = (area: AreaKey) => {
    const doArea = pool.filter((q) => areaOf(q.area_conhecimento) === area);
    const novas = shuffle(doArea.filter((q) => !attempted.has(String(q.id))));
    const repetidas = shuffle(doArea.filter((q) => attempted.has(String(q.id))));
    const chosen = [...novas, ...repetidas].slice(0, 45);
    faltantes += Math.max(0, 45 - chosen.length);
    // ordena por dificuldade crescente, como o caderno oficial tende a progredir dentro da área
    return chosen;
  };
  return { questions: [...pick(areaA), ...pick(areaB)], faltantes };
}

/* ------------------------------ correção TRI ------------------------------ */

function diffOf(q: ExamQuestion) {
  const d = Number(q.dificuldade);
  return Number.isFinite(d) ? Math.min(100, Math.max(1, d)) : 50;
}

function gradeArea(items: { q: ExamQuestion; letra: string | undefined }[]) {
  const corretos = items.filter((i) => i.letra === i.q.resposta_correta?.trim().toUpperCase());
  const avancados = corretos.filter((i) => diffOf(i.q) > 75).length;
  const errosBase = items.filter(
    (i) => i.letra !== i.q.resposta_correta?.trim().toUpperCase() && diffOf(i.q) < 40,
  ).length;
  const erratico = avancados > 0 && errosBase > 0;
  let pontos = 0;
  let possiveis = 0;
  for (const i of items) {
    const peso = diffOf(i.q);
    possiveis += peso;
    if (i.letra !== i.q.resposta_correta?.trim().toUpperCase()) continue;
    pontos += erratico && peso > 75 ? peso * 0.6 : peso;
  }
  // Escala aproximada do ENEM: ~300 (piso) a ~900 (teto)
  const nota = possiveis > 0 ? Math.round(300 + (pontos / possiveis) * 600) : 300;
  return { acertos: corretos.length, total: items.length, nota, erratico, avancados, errosBase };
}

/* --------------------------------- página --------------------------------- */

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function ProvaCompletaPage() {
  const { isPremium, isLoading, openUpgrade } = useSubscription();
  const getPool = useServerFn(getPremiumQuestionPool);
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadingDay, setLoadingDay] = useState<Day | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session, hydrated]);

  const activeDay1 = session && session.day === 1 && !session.submittedAt;

  const start = async (day: Day) => {
    if (!isPremium) { openUpgrade(); return; }
    if (day === 2 && activeDay1) return;
    setError(null);
    setAviso(null);
    setLoadingDay(day);
    try {
      const { questions, faltantes } = await buildDay(day, await getPool() as ExamQuestion[]);
      if (faltantes > 0)
        setAviso(`O banco ainda não tem questões suficientes: ${faltantes} posição(ões) ficaram vazias.`);
      setSession({ day, startedAt: Date.now(), questions, respostas: {}, redacao: "", submittedAt: null });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingDay(null);
    }
  };

  if (!hydrated || isLoading) return <Shell><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Shell>;

  if (session && isPremium) {
    return (
      <ExamRoom
        session={session}
        aviso={aviso}
        onChange={setSession}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <Shell>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        O ENEM é aplicado em dois domingos. Cada dia tem 90 questões, e a nota de cada área é
        calculada pela TRI: acertar questões difíceis e errar fáceis indica chute e reduz o peso
        desses acertos. Nada de gabarito durante a prova — a correção aparece só na entrega.
      </p>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      <Link to="/prova" className="mb-4 flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm transition-colors hover:border-accent">
        <span><strong className="text-foreground">Provas anteriores</strong><span className="ml-2 text-muted-foreground">Refaça provas completas de edições passadas do ENEM.</span></span>
        <span className="font-semibold text-accent">Abrir →</span>
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
        {([1, 2] as Day[]).map((d) => {
          const cfg = DAY_CONFIG[d];
          const blocked = d === 2 && !!activeDay1;
          return (
            <Button
              key={d}
              type="button"
              disabled={blocked || loadingDay !== null}
              onClick={() => start(d)}
              variant="ghost"
              className="h-auto flex-col items-start whitespace-normal rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="text-lg font-semibold text-foreground">{cfg.title}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Questões 1–45: {AREA_LABEL[cfg.areas[0]]}</li>
                <li>Questões 46–90: {AREA_LABEL[cfg.areas[1]]}</li>
                {cfg.essay && <li>Redação dissertativo-argumentativa</li>}
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {cfg.minutes === 330 ? "5h30" : "5h"} de prova
                </li>
              </ul>
              {!isPremium && <span className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><Lock className="h-4 w-4" /> Desbloquear com Nexem Pro</span>}
              {blocked && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <Lock className="h-3.5 w-3.5" /> Conclua o Dia 1 em andamento antes.
                </p>
              )}
              {loadingDay === d && (
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Montando seu caderno...
                </p>
              )}
            </Button>
          );
        })}
      </div>
    </Shell>
  );
}

/* ------------------------------- sala de prova ----------------------------- */

function ExamRoom({
  session,
  aviso,
  onChange,
  onExit,
}: {
  session: Session;
  aviso: string | null;
  onChange: (s: Session) => void;
  onExit: () => void;
}) {
  const cfg = DAY_CONFIG[session.day];
  const submitted = session.submittedAt !== null;
  const [tab, setTab] = useState<"questoes" | "redacao">("questoes");
  const [now, setNow] = useState(Date.now());
  const endAt = session.startedAt + cfg.minutes * 60_000;
  const restante = Math.max(0, endAt - now);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const resultado = useMemo(() => {
    const [a, b] = cfg.areas;
    const items = session.questions.map((q, i) => ({ q, letra: session.respostas[String(i + 1)] }));
    return {
      [a]: gradeArea(items.slice(0, 45)),
      [b]: gradeArea(items.slice(45, 90)),
    } as Record<AreaKey, ReturnType<typeof gradeArea>>;
  }, [session, cfg.areas]);

  const entregar = useCallback(
    (porTempo: boolean) => {
      if (submitted) return;
      const final = { ...session, submittedAt: Date.now() };
      onChange(final);
      const [a, b] = cfg.areas;
      const acertos = resultado[a].acertos + resultado[b].acertos;
      const nota = Math.round((resultado[a].nota + resultado[b].nota) / 2);
      const tempo = Math.round((final.submittedAt - session.startedAt) / 1000);
      console.info("[Prova Completa] Estado final", {
        dia: session.day,
        porTempo,
        tempo_gasto_segundos: tempo,
        respondidas: Object.keys(session.respostas).length,
        por_area: resultado,
      });
      awardXp("provaCompleta", { label: `Prova Completa · Dia ${session.day}` });
      void registrarProva({
        data: {
          nome_prova: `${BANCO} · Dia ${session.day}`,
          respostas: {
            ...session.respostas,
            __question_ids: JSON.stringify(session.questions.map((q) => String(q.id))),
          } as Record<string, string>,
          acertos,
          total_questoes: session.questions.length,
          nota,
          tempo_gasto_segundos: tempo,
          finalizado_por_tempo: porTempo,
          por_area: {
            [a]: { acertos: resultado[a].acertos, total: resultado[a].total, nota: resultado[a].nota },
            [b]: { acertos: resultado[b].acertos, total: resultado[b].total, nota: resultado[b].nota },
          },
        },
      }).catch((e) => console.error("[Prova Completa] Falha ao salvar", e));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [submitted, session, onChange, cfg.areas, resultado],
  );

  // Entrega automática quando o tempo acaba
  const autoRef = useRef(false);
  useEffect(() => {
    if (!submitted && restante === 0 && !autoRef.current) {
      autoRef.current = true;
      entregar(true);
    }
  }, [restante, submitted, entregar]);

  const answer = (idx: number, letra: string) => {
    if (submitted) return;
    onChange({ ...session, respostas: { ...session.respostas, [String(idx)]: letra } });
  };

  const jump = (idx: number) => {
    setTab("questoes");
    requestAnimationFrame(() =>
      document.getElementById(`q-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const hh = Math.floor(restante / 3_600_000);
  const mm = Math.floor((restante % 3_600_000) / 60_000);
  const ss = Math.floor((restante % 60_000) / 1000);
  const respondidas = Object.keys(session.respostas).length;

  return (
    <main className="w-full flex-1">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div>
            <p className="text-sm font-semibold text-foreground">{cfg.title}</p>
            <p className="text-xs text-muted-foreground">{respondidas}/90 marcadas</p>
          </div>
          {!submitted ? (
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 font-mono text-lg font-semibold ${restante < 30 * 60_000 ? "text-destructive" : "text-foreground"}`}>
                <Clock className="h-4 w-4" />
                {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Entregar o caderno? Você não poderá alterar as respostas.")) entregar(false);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Entregar Caderno de Questões
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent/10"
            >
              Voltar à seleção de dias
            </button>
          )}
        </div>
        {cfg.essay && (
          <div className="mx-auto flex max-w-7xl gap-2 px-4 pb-2 md:px-8">
            {(["questoes", "redacao"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/10"}`}
              >
                {t === "questoes" ? "Caderno de Questões" : "Redação"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-5">
          {aviso && !submitted && (
            <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">{aviso}</div>
          )}
          {submitted && <Resultado resultado={resultado} areas={cfg.areas} />}

          {tab === "redacao" && cfg.essay ? (
            <RedacaoTab
              value={session.redacao}
              disabled={submitted}
              revelar={submitted}
              onChange={(v) => onChange({ ...session, redacao: v })}
            />
          ) : (
            session.questions.map((q, i) => {
              const idx = i + 1;
              const area = idx <= 45 ? cfg.areas[0] : cfg.areas[1];
              const marcada = session.respostas[String(idx)];
              const gabarito = q.resposta_correta?.trim().toUpperCase();
              return (
                <div key={idx}>
                  {(idx === 1 || idx === 46) && (
                    <h2 className="mb-3 mt-2 text-lg font-semibold text-foreground">
                      {AREA_LABEL[area]} · questões {idx}–{idx + 44}
                    </h2>
                  )}
                  <article id={`q-${idx}`} className="scroll-mt-32 rounded-2xl border border-border bg-card p-5">
                    <p className="text-sm font-semibold text-muted-foreground">Questão {idx}</p>
                    <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground">{q.enunciado}</p>
                    {q.imagem_url && (
                      <img src={q.imagem_url} alt={`Imagem da questão ${idx}`} loading="lazy" className="mx-auto mt-4 max-h-[420px] max-w-full rounded-xl border border-border" />
                    )}
                    <div className="mt-4 space-y-2">
                      {LETTERS.map((l) => {
                        let cls = "border-border bg-background hover:border-primary/40";
                        if (submitted) {
                          if (l === gabarito) cls = "border-success/60 bg-success/10";
                          else if (l === marcada) cls = "border-destructive/60 bg-destructive/10";
                        } else if (l === marcada) cls = "border-primary bg-primary/10";
                        return (
                          <button
                            key={l}
                            type="button"
                            disabled={submitted}
                            onClick={() => answer(idx, l)}
                            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2.5 text-left text-sm text-foreground disabled:cursor-default ${cls}`}
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">{l}</span>
                            <span>{optionText(q, l)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {submitted && (
                      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
                        Gabarito: <strong className="text-foreground">{gabarito}</strong>.{" "}
                        {q.explicacao ?? "Esta questão ainda não tem explicação cadastrada."}
                      </div>
                    )}
                  </article>
                </div>
              );
            })
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Cartão-Resposta</p>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-6">
              {Array.from({ length: 90 }, (_, i) => i + 1).map((idx) => {
                const marcada = session.respostas[String(idx)];
                const q = session.questions[idx - 1];
                let cls = "border-border bg-background text-muted-foreground";
                if (submitted && q) {
                  cls = marcada === q.resposta_correta?.trim().toUpperCase()
                    ? "border-success/60 bg-success/15 text-foreground"
                    : "border-destructive/50 bg-destructive/10 text-foreground";
                } else if (marcada) cls = "border-primary bg-primary text-primary-foreground";
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!q}
                    onClick={() => jump(idx)}
                    title={`Questão ${idx}`}
                    className={`relative flex h-9 flex-col items-center justify-center rounded-full border text-[10px] font-semibold transition-colors disabled:opacity-30 ${cls}`}
                  >
                    <span>{idx}</span>
                    {!submitted && (marcada ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    ))}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              1–45: {AREA_LABEL[cfg.areas[0]]} · 46–90: {AREA_LABEL[cfg.areas[1]]}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Resultado({
  resultado,
  areas,
}: {
  resultado: Record<AreaKey, ReturnType<typeof gradeArea>>;
  areas: [AreaKey, AreaKey];
}) {
  return (
    <section className="rounded-2xl border border-primary/40 bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Caderno entregue — resultado TRI estimado</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {areas.map((a) => {
          const r = resultado[a];
          return (
            <div key={a} className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">{AREA_LABEL[a]}</p>
              <p className="text-3xl font-semibold text-foreground">{r.nota}</p>
              <p className="text-sm text-muted-foreground">{r.acertos}/{r.total} acertos</p>
              {r.erratico && (
                <p className="mt-2 text-xs text-destructive">
                  Padrão de chute: {r.avancados} acerto(s) difíceis com {r.errosBase} erro(s) fáceis — peso reduzido em 40%.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Na TRI, a nota não é só a contagem de acertos: questões difíceis pesam mais e incoerências
        (errar fácil e acertar difícil) são penalizadas. Role para ver o gabarito comentado.
      </p>
      {(() => {
        const fraca = [...areas].sort((x, y) => resultado[x].nota - resultado[y].nota)[0] ?? areas[0];
        return (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/simulado" search={{ subject: AREA_INFO[fraca].subject }} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
              Treinar {AREA_INFO[fraca].name}
            </Link>
            <Link to="/estatisticas" className="rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40">Ver minhas estatísticas</Link>
          </div>
        );
      })()}
    </section>
  );
}

function RedacaoTab({
  value,
  disabled,
  revelar,
  onChange,
}: {
  value: string;
  disabled: boolean;
  revelar: boolean;
  onChange: (v: string) => void;
}) {
  const corrigir = useServerFn(corrigirRedacao);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [fb, setFb] = useState<EssayCorrection | null>(null);
  const linhas = value.split("\n").length;

  const enviar = async () => {
    setStatus("sending");
    setErro(null);
    try {
      setFb(await corrigir({ data: { tema: TEMA_REDACAO, texto: value } }));
      setStatus("done");
    } catch (e) {
      setErro((e as Error).message);
      setStatus("idle");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposta de redação</p>
      <p className="mt-1 text-base font-semibold text-foreground">{TEMA_REDACAO}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Texto dissertativo-argumentativo, 8 a 30 linhas. Vale até 1000 pontos (5 competências de 200); fuga do tema zera a nota.
      </p>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.split("\n").slice(0, 30).join("\n"))}
        rows={30}
        className="mt-4 w-full resize-none rounded-xl border border-border bg-background p-4 font-mono text-sm leading-7 text-foreground focus:border-primary focus:outline-none"
        placeholder="Escreva sua redação aqui..."
      />
      <p className="mt-1 text-xs text-muted-foreground">{linhas}/30 linhas</p>
      {revelar && (
        <div className="mt-4">
          {!fb && (
            <button
              type="button"
              onClick={enviar}
              disabled={status === "sending" || value.trim().length < 200}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {status === "sending" ? "Corrigindo..." : "Corrigir redação"}
            </button>
          )}
          {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
          {fb && (
            <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="text-2xl font-semibold text-foreground">{fb.nota_total}/1000</p>
              <p className="mt-1 text-muted-foreground">
                C1 {fb.c1} · C2 {fb.c2} · C3 {fb.c3} · C4 {fb.c4} · C5 {fb.c5}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {fb.dicas.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
              <Link to="/redacao" hash="historico" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Ver histórico de redações →</Link>
            </div>
          )}
        </div>
      )}
      {!revelar && (
        <p className="mt-3 text-xs text-muted-foreground">A correção da redação fica disponível após entregar o caderno.</p>
      )}
    </section>
  );
}

function optionText(q: ExamQuestion, l: string) {
  return l === "A" ? q.opcao_a : l === "B" ? q.opcao_b : l === "C" ? q.opcao_c : l === "D" ? q.opcao_d : q.opcao_e;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full flex-1">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Prova Completa</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">Escolha o dia e entre no ambiente oficial de prova.</p>
        {children}
      </div>
    </main>
  );
}
