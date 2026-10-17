import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, LoaderCircle, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { LEARNING_GOALS, SCHOOL_GRADES, studentQuizSchema } from "@/lib/student-quiz";
import nexemLogo from "@/assets/nexem-logo.png.asset.json";

export function StudentQuiz({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState("");
  const [goal, setGoal] = useState("");
  const [score, setScore] = useState(800);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);

  async function finish() {
    if (saving) return;
    const answers = studentQuizSchema.safeParse({ school_grade: grade, learning_goal: goal, target_score: score });
    if (!answers.success) { setError("Confira suas respostas antes de continuar."); return; }
    setSaving(true);
    setError("");
    try {
      const { data, error: saveError } = await supabase.from("profiles").update({
        ...answers.data, quiz_completed_at: new Date().toISOString(),
      }).eq("id", userId).select("id").single();
      if (saveError || !data) throw saveError ?? new Error("Profile not saved");
      onComplete();
    } catch {
      setError("Não conseguimos salvar agora. Suas respostas continuam aqui; tente novamente.");
      setSaving(false);
    }
  }

  const titles = ["Em qual série você está?", "O que você quer conquistar?", "Qual nota você quer no ENEM?"];
  const Icon = [GraduationCap, Target, Trophy][step] ?? GraduationCap;
  const options = step === 0 ? SCHOOL_GRADES : LEARNING_GOALS;
  const canContinue = step === 0 ? Boolean(grade) : step === 1 ? Boolean(goal) : true;

  return (
    <main className="flex min-h-dvh w-full flex-col bg-background px-5 py-6 sm:px-8">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <img src={nexemLogo.url} alt="nexem" className="h-7 w-auto" />
        <span className="text-sm text-muted-foreground">Seu ponto de partida</span>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
        <div aria-label={`Pergunta ${step + 1} de 3`} className="mb-8 flex gap-2">
          {[0, 1, 2].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= step ? "bg-primary" : "bg-border"}`} />)}
        </div>
        <div className="mb-5 flex items-center gap-3 text-primary"><Icon className="h-7 w-7" /><span className="text-sm font-semibold">{String(step + 1).padStart(2, "0")} / 03</span></div>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold leading-tight tracking-normal text-foreground outline-none sm:text-4xl">{titles[step]}</h1>
        <p className="mt-3 text-base text-muted-foreground">{step === 0 ? "Cada jornada começa de um lugar diferente." : step === 1 ? "Sua preparação tem um propósito." : "Uma meta para chamar de sua. Você pode mirar alto."}</p>
        <div className="mt-7 min-h-64">
          {step < 2 ? <RadioGroup aria-label={titles[step]} value={step === 0 ? grade : goal} onValueChange={step === 0 ? setGrade : setGoal} className="gap-3">
            {options.map((option, i) => <label key={option} htmlFor={`quiz-${step}-${i}`} className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${option === (step === 0 ? grade : goal) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}>
              <RadioGroupItem id={`quiz-${step}-${i}`} value={option} /><span className="text-base font-medium">{option}</span>
            </label>)}
          </RadioGroup> : <div className="space-y-7 py-5">
            <div className="text-center"><label htmlFor="target-score" className="block text-sm font-medium text-muted-foreground">Minha meta de nota</label><div className="mt-2 flex items-baseline justify-center gap-2"><input id="target-score" type="number" min={0} max={1000} step={10} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-40 border-b border-primary/30 bg-transparent text-center font-display text-6xl font-semibold tracking-normal text-primary outline-none focus:border-primary" /><span className="text-sm text-muted-foreground">/ 1000</span></div></div>
            <Slider aria-label="Meta de nota no ENEM" min={0} max={1000} step={10} value={[score]} onValueChange={([value]) => setScore(value ?? 800)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>0 pontos</span><span>1000 pontos</span></div>
            <p className="text-center text-sm text-muted-foreground">{grade} · {goal}</p>
          </div>}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-7 flex items-center justify-between gap-3">
          <Button variant="ghost" aria-label="Voltar à pergunta anterior" disabled={step === 0 || saving} onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft />Voltar</Button>
          <Button size="lg" disabled={!canContinue || saving} onClick={() => step < 2 ? setStep(step + 1) : void finish()}>{saving ? <LoaderCircle className="animate-spin" /> : step === 2 ? <Check /> : null}{saving ? "Salvando…" : step === 2 ? "Começar minha jornada" : "Continuar"}{step < 2 && <ArrowRight />}</Button>
        </div>
      </div>
    </main>
  );
}