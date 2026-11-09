import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Award, BookOpen, ChevronRight, Flag, GraduationCap, Loader2, RefreshCw, Sparkles, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { processMaterial } from "@/lib/materials.functions";
import { gradeMaterialQuiz, hasAchievementPath, isStepUnlocked, LEVEL_REQUIRED_CORRECT, PASS_PERCENT, statusOf, type MaterialProgress, type QuizAttempt } from "@/lib/material-path";
import type { PathStep } from "@/lib/materials";
import { cn } from "@/lib/utils";
import { awardXp } from "@/lib/xp";
import { AREA_INFO, areaOfMateria, canonicalSubjectName } from "@/lib/stats-areas";
import { subjectOf } from "@/lib/mastery";
import { getStudentStats } from "@/lib/stats.functions";
import { Link } from "@tanstack/react-router";

/** Slug do Treine com Tutor Nex para um assunto livre do material (mesmos nomes do resto do app). */
function practiceSlug(raw: string | null | undefined): string | undefined {
  const s = subjectOf(raw ?? null, null);
  if (s) return s.slug;
  const area = areaOfMateria(raw ?? null);
  return area ? AREA_INFO[area].subject : undefined;
}

function PracticeLink({ subject }: { subject: string | null | undefined }) {
  return <Link to="/simulado" search={{ subject: practiceSlug(subject) }} className="inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent hover:border-accent">Praticar questões deste assunto</Link>;
}

type Moved = { area: string; before: number | null; after: number | null; total: number };
import { RewardModal, SnakePath, type SnakeNode } from "@/components/SnakePath";

const MATERIAL_XP = 30;

type Props = { material: { id: string; file_name: string; path: PathStep[]; step_status: MaterialProgress }; onSave: (progress: MaterialProgress) => Promise<void>; onRefresh: () => Promise<void> };
export function MaterialStudyPath({ material: m, onSave, onRefresh }: Props) {
  const generate = useServerFn(processMaterial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [moved, setMoved] = useState<Moved | null>(null);
  const loadStats = useServerFn(getStudentStats);
  const ready = hasAchievementPath(m.path);
  const done = m.path.filter((_, i) => statusOf(m.step_status[i]) === "done").length;
  const groups = Array.from(new Set(m.path.filter((s) => !s.final).map((s) => s.subject || "Conteúdo do material")));
  const current = active === null ? null : m.path[active];
  const questions = current?.questions ?? [];
  const correctCount = result ? questions.reduce((sum, q, i) => sum + (result.answers[i] === q.answer ? 1 : 0), 0) : 0;
  async function upgrade() {
    setBusy(true); setError("");
    try {
      await generate({ data: { materialId: m.id, fileName: m.file_name, mimeType: "text/plain", kind: "text", content: "Gerar trilha do material salvo", size: 0 } });
      await onRefresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Não conseguimos gerar a trilha."); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (active === null || !current || busy) return;
    const attempt = gradeMaterialQuiz(current, answers);
    setBusy(true); setError("");
    try {
      await onSave({ ...m.step_status, [active]: attempt.passed ? "done" : statusOf(m.step_status[active]) === "done" ? "done" : "doing", [`quiz:${active}`]: attempt });
      setResult(attempt);
      const firstPass = attempt.passed && statusOf(m.step_status[active]) !== "done";
      const materia = canonicalSubjectName(current.subject) ?? "Conteúdo do material";
      const areaKey = areaOfMateria(materia);
      const before = areaKey ? await loadStats().catch(() => null) : null;
      setMoved(null);
      await awardXp("materialEtapa", {
        amount: firstPass ? MATERIAL_XP : 0,
        label: `Trilha: ${current.title}`,
        subject: materia,
        attempts: questions.map((q, i) => ({
          question_id: `material:${m.id}:${active}:${i}`,
          dificuldade_questao: current.final ? "Dificil" : current.level === 1 ? "Facil" : current.level === 3 ? "Dificil" : "Media",
          materia_questao: materia,
          foi_correto: attempt.answers[i] === q.answer,
        })),
      });
      if (firstPass) setReward(current.title);
      if (areaKey) {
        const after = await loadStats().catch(() => null);
        const a = after?.areas.find((x) => x.key === areaKey);
        const b = before?.areas.find((x) => x.key === areaKey);
        if (a) setMoved({ area: AREA_INFO[areaKey].name, before: b?.pct ?? null, after: a.pct, total: a.total });
      }
    } catch { setError("Não conseguimos salvar o resultado. Tente novamente."); }
    finally { setBusy(false); }
  }
  function open(i: number) {
    if (!isStepUnlocked(i, m.step_status)) return;
    setActive(i); setAnswers([]); setResult(null); setError("");
  }
  function retry() { setAnswers([]); setResult(null); setError(""); }
  if (!ready) return <section className="space-y-5 py-6">
    <div className="flex items-center gap-3"><GraduationCap className="h-10 w-10 text-primary" /><h2 className="font-display text-2xl font-semibold">Sua trilha de conquistas</h2></div>
    <p className="text-muted-foreground">Este material ainda usa a trilha anterior. Gere os níveis por assunto e o simulado final.</p>
    <Button onClick={upgrade} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? "Preparando assuntos e questões…" : "Gerar níveis e simulado"}</Button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
  if (current) return <section className="mx-auto max-w-3xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="secondary">{current.subject} · {current.final ? "Simulado final" : `Nível ${current.level}`}</Badge><div className="flex flex-wrap gap-2">{!current.final && <PracticeLink subject={current.subject} />}<Button variant="ghost" onClick={() => setActive(null)}><X />Voltar à trilha</Button></div></div>
    <h2 className="font-display text-2xl font-semibold">{current.title}</h2>
    {!result ? <>
      <p className="text-sm text-muted-foreground">{answers.filter((a) => a >= 0).length}/{questions.length} respondidas · {current.final ? `conquista com ${PASS_PERCENT}% de acertos` : `${LEVEL_REQUIRED_CORRECT} acertos liberam o próximo nível`}</p>
      {questions.map((q, i) => <fieldset key={i} className="space-y-3 border-b border-border pb-6">
        <legend className="mb-3 font-medium leading-relaxed">{i + 1}. {q.prompt}</legend>
        {q.options.map((option, j) => <label key={j} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors", answers[i] === j ? "border-primary bg-primary/5" : "border-border bg-card")}>
          <input type="radio" name={`question-${i}`} checked={answers[i] === j} disabled={busy} onChange={() => setAnswers((old) => Array.from({ length: questions.length }, (_, k) => k === i ? j : old[k] ?? -1))} className="mt-1 shrink-0 accent-primary" />
          <span className="leading-relaxed">{String.fromCharCode(65 + j)}. {option}</span>
        </label>)}
      </fieldset>)}
      <Button onClick={submit} disabled={busy || answers.length !== questions.length || answers.some((a) => a < 0)}>{busy ? <Loader2 className="animate-spin" /> : <Flag />}{current.final ? "Entregar simulado" : "Concluir missão"}</Button>
    </> : <>
      <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">{result.passed ? <Trophy className="h-12 w-12 shrink-0 text-primary" /> : <RefreshCw className="h-12 w-12 shrink-0 text-primary" />}<div><p className="font-display text-3xl font-semibold">{result.score}%</p><p className="text-sm text-muted-foreground">{result.passed ? current.final ? "Material concluído! Conquista final desbloqueada." : "Conquista desbloqueada! Próximo nível liberado." : current.final ? `Você acertou ${correctCount} de ${questions.length}. São necessários ${PASS_PERCENT}% para concluir o material.` : `Você acertou ${correctCount} de ${questions.length}. Bastam ${LEVEL_REQUIRED_CORRECT} acertos para liberar o próximo nível.`}</p>{!result.passed && <p className="mt-1 text-sm text-muted-foreground">Revise as explicações abaixo e tente de novo — você continua aqui, sem perder o progresso.</p>}</div></div>
      {questions.map((q, i) => <article key={i} className="space-y-2 border-b border-border pb-4"><h3 className="font-medium">{i + 1}. {q.prompt}</h3><p className={result.answers[i] === q.answer ? "text-primary" : "text-destructive"}>{result.answers[i] === q.answer ? "Acertou" : "Precisa revisar"} · Sua resposta: {String.fromCharCode(65 + (result.answers[i] ?? 0))}</p><p className="text-sm font-medium">Correta: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}</p><p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p></article>)}
      {moved && <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm"><p className="font-semibold text-foreground">Seu progresso em {moved.area}</p><p className="mt-1 text-muted-foreground">Acertos na área: {moved.before ?? "—"}% → <strong className="text-foreground">{moved.after ?? "—"}%</strong> · {moved.total} questões contadas nas suas Estatísticas.</p><Link to="/estatisticas" className="mt-2 inline-flex font-semibold text-primary hover:underline">Ver nas Estatísticas →</Link></div>}
      <div className="flex flex-wrap gap-3">{result.passed ? <><Button onClick={() => setActive(null)}>Ver conquistas<ChevronRight /></Button><Button variant="outline" onClick={retry}>Tentar novamente</Button></> : <><Button onClick={retry}><RefreshCw />Tentar novamente</Button><Button variant="outline" onClick={() => setActive(null)}>Ver conquistas<ChevronRight /></Button></>}</div>
    </>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <RewardModal open={reward !== null} xp={MATERIAL_XP} title={reward ?? ""} onClose={() => setReward(null)} />
  </section>;
  const toNode = (s: PathStep, i: number): SnakeNode => {
    const unlocked = isStepUnlocked(i, m.step_status);
    const complete = statusOf(m.step_status[i]) === "done";
    const attempt = m.step_status[`quiz:${i}`];
    const Icon = s.final ? Trophy : s.level === 1 ? BookOpen : s.level === 2 ? Sparkles : Award;
    return {
      key: i,
      title: s.final ? "Simulado do material" : `${s.subject || "Conteúdo"} · Nível ${s.level}`,
      subtitle: complete ? "Conquistado" : !unlocked ? "Bloqueado" : `${s.questions?.length ?? 0} questões${typeof attempt === "object" ? ` · última ${attempt.score}%` : ""}`,
      state: complete ? "done" : unlocked ? "active" : "locked",
      icon: <Icon />,
      onClick: () => open(i),
    };
  };
  const nodes = m.path.map(toNode);
  return <section className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">Trilha de conquistas</h2><p className="mt-1 text-sm text-muted-foreground">{groups.length} assuntos · {done}/{m.path.length} conquistas · +{MATERIAL_XP} XP por desafio</p></div><Badge variant="outline"><GraduationCap className="mr-2 h-4 w-4" />{done === m.path.length ? "Material dominado" : "Em evolução"}</Badge></header>
    <div className="flex flex-wrap gap-3">{groups.map((g) => <div key={g} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><span className="text-sm font-medium text-foreground">{g}</span><PracticeLink subject={g} /></div>)}</div>
    <SnakePath nodes={nodes} className="pb-8" />
  </section>;
}