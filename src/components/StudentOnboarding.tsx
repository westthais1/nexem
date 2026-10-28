import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, GraduationCap, LoaderCircle, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AREAS, AREA_LABELS, COURSES, DAYS, DIFFICULTIES, PERIODS, SITUATIONS, STEPS, STYLES, SUBJECTS, SUMMARY_STEP, UNIVERSITIES, profileSummary, validateOnboardingStep, weeklyHours, advancesOnSingleChoice, type OnboardingAnswers, type StudyDay } from '@/lib/student-onboarding';
import { confirmStudentProfile, getOnboardingDiagnostic, saveStudentOnboarding } from '@/lib/student-onboarding.functions';
import type { StudentProfile } from '@/lib/student-profile';
import nexemLogo from '@/assets/nexem-logo.png.asset.json';

function Choices({ options, value, onChange, multiple = false }: { options: readonly string[]; value: string | string[]; onChange: (value: string) => void; multiple?: boolean }) {
  return <div className="grid gap-3 sm:grid-cols-2">{options.map(option => {
    const selected = Array.isArray(value) ? value.includes(option) : value === option;
    return <Button key={option} variant="outline" aria-pressed={selected} onClick={() => onChange(option)} className={`h-auto min-h-14 justify-between whitespace-normal rounded-lg px-4 py-3 text-left text-base ${selected ? 'border-primary bg-primary/10 text-primary' : 'bg-card'}`}><span>{option}</span>{selected ? <Check className="ml-2 h-4 w-4 shrink-0" /> : multiple ? <span className="h-4 w-4 rounded border border-input" /> : null}</Button>;
  })}</div>;
}
function SearchChoice({ options, value, onChange, label }: { options: string[]; value: string; onChange: (value: string) => void; label: string }) {
  const [search, setSearch] = useState('');
  const filtered = options.filter(x => x.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <div className="space-y-4"><Input aria-label={`Buscar ${label}`} placeholder={`Buscar ${label}…`} value={search} maxLength={100} onChange={e => setSearch(e.target.value)} className="h-12 text-base" />{value && <p className="text-sm font-medium text-primary">Sua escolha: {value}</p>}<div className="max-h-64 overflow-y-auto pr-1"><Choices options={filtered} value={value} onChange={onChange} /></div>{!filtered.length && <Button variant="outline" className="h-auto min-h-12 w-full whitespace-normal" onClick={() => onChange(search.trim())}>Escolher “{search}”</Button>}<Button variant={value === 'Ainda não sei' ? 'default' : 'ghost'} onClick={() => onChange('Ainda não sei')}>Ainda não sei</Button></div>;
}
export function PersonalSchedule({ schedule }: { schedule: StudyDay[] }) {
  return <div className="space-y-5"><h2 className="text-2xl font-semibold tracking-normal">Seu cronograma personalizado</h2><p className="text-sm text-muted-foreground">Um ponto de partida flexível. As prioridades combinam seu perfil com os assuntos mais frequentes no ENEM.</p><div className="grid gap-4 md:grid-cols-2">{schedule.map(day => <article key={day.day} className="rounded-lg border border-border bg-card p-5"><h3 className="font-semibold tracking-normal">{day.day}</h3><p className="mt-1 text-sm text-primary">{day.hours}h · {day.period}</p><ul className="mt-4 space-y-4">{day.sessions.map((session, i) => <li key={i} className="border-l-2 border-primary/40 pl-3"><p className="text-sm font-semibold">{AREA_LABELS[session.area]} · {session.minutes} min</p><p className="mt-1 text-sm text-muted-foreground">{session.topic}</p><span className="text-xs text-primary">{session.format}</span></li>)}</ul></article>)}</div></div>;
}
export function StudentOnboarding({ profile, editing = false, onComplete }: { profile: StudentProfile; editing?: boolean; onComplete: () => void }) {
  const [answers, setAnswers] = useState(profile.answers);
  const answersRef = useRef(answers);
  const [step, setStep] = useState(editing ? 0 : Math.min(profile.step, SUMMARY_STEP));
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState('Suas respostas ficam salvas na sua conta');
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState<StudyDay[] | null>(null);
  const [diagnostic, setDiagnostic] = useState<Awaited<ReturnType<typeof getOnboardingDiagnostic>> | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const save = useServerFn(saveStudentOnboarding);
  const confirm = useServerFn(confirmStudentProfile);
  const loadDiagnostic = useServerFn(getOnboardingDiagnostic);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvance = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summary = profileSummary(answers);

  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }, [step, quizIndex]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (autoAdvance.current) clearTimeout(autoAdvance.current); }, []);

  function persist(a: OnboardingAnswers, at: number, advance = false) {
    setSaveState('Salvando…');
    const request = pending.current.catch(() => undefined).then(() => save({ data: { answers: a, step: at, advance } }));
    pending.current = request;
    request.then(result => { setSaveState('Tudo salvo'); if (advance) { answersRef.current = result.answers; setAnswers(result.answers); } }).catch(() => { setSaveState('Não foi possível salvar'); setError('Não conseguimos salvar sua resposta. Tente continuar novamente.'); });
    return request;
  }
  function change<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K], immediate = true) {
    const next = { ...answersRef.current, [key]: value };
    answersRef.current = next; setAnswers(next); setError('');
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void persist(next, step);
    else { setSaveState('Salvando…'); timer.current = setTimeout(() => { void persist(answersRef.current, step); timer.current = null; }, 500); }
    const singleStep = advancesOnSingleChoice(step);
    if (immediate && singleStep && key !== 'targetScore') {
      if (autoAdvance.current) clearTimeout(autoAdvance.current);
      autoAdvance.current = setTimeout(() => { autoAdvance.current = null; void move(); }, 180);
    }
    if (key === 'diagnostic' && quizStarted && immediate && !(value as OnboardingAnswers['diagnostic'])?.skipped) {
      if (autoAdvance.current) clearTimeout(autoAdvance.current);
      autoAdvance.current = setTimeout(() => { autoAdvance.current = null; void advanceQuiz(); }, 180);
    }
  }
  function flushTimer() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }
  async function move(back = false) {
    if (saving) return;
    if (autoAdvance.current) { clearTimeout(autoAdvance.current); autoAdvance.current = null; }
    const issue = !back ? validateOnboardingStep(step, answersRef.current) : null;
    if (issue) { setError(issue); return; }
    flushTimer(); setSaving(true); setError('');
    let next = back ? Math.max(0, step - 1) : Math.min(SUMMARY_STEP, step + 1);
    if (next === 16 && answersRef.current.previousEnem === false) next = back ? 15 : 17;
    try { await persist(answersRef.current, next, !back); setStep(next); } catch { /* Error shown next to navigation. */ } finally { setSaving(false); }
  }
  async function finish() {
    flushTimer(); setSaving(true); setError('');
    try { await persist(answersRef.current, SUMMARY_STEP, true); const result = await confirm({ data: { confirmed: true } }); setSchedule(result.schedule); } catch { setError('Não conseguimos confirmar seu perfil. Confira suas respostas e tente novamente.'); } finally { setSaving(false); }
  }
  async function startQuiz() {
    setDiagnosticLoading(true); setDiagnosticError('');
    try { const q = await loadDiagnostic(); setDiagnostic(q); const savedAnswers = answersRef.current.diagnostic?.answers ?? {}; setQuizIndex(Math.min(7, q.filter(x => savedAnswers[x.id]).length)); setQuizStarted(true); } catch { setDiagnosticError('Não conseguimos carregar o diagnóstico. Tente novamente ou pule por agora.'); } finally { setDiagnosticLoading(false); }
  }
  async function advanceQuiz() {
    if (saving) return;
    if (autoAdvance.current) { clearTimeout(autoAdvance.current); autoAdvance.current = null; }
    setSaving(true); setError('');
    try {
      await persist(answersRef.current, step);
      if (quizIndex < 7) setQuizIndex(quizIndex + 1);
      else { const r = await persist(answersRef.current, 24, true); setAnswers(r.answers); answersRef.current = r.answers; setStep(24); }
    } catch { setError('Não conseguimos salvar a resposta. Tente novamente.'); } finally { setSaving(false); }
  }
  const currentQuestion = diagnostic?.[quizIndex];
  const selectedLetter = currentQuestion ? answers.diagnostic?.answers[currentQuestion.id] : null;
  const yesNo = (key: 'under18' | 'trainee' | 'previousEnem') => <Choices options={['Sim', 'Não']} value={answers[key] === null ? '' : answers[key] ? 'Sim' : 'Não'} onChange={v => change(key, v === 'Sim')} />;

  if (schedule) return <main className="mx-auto min-h-dvh w-full max-w-4xl px-5 py-10"><div className="mb-8 flex items-center gap-3 text-primary"><CheckCircle2 /><h1 className="text-2xl font-semibold tracking-normal">Sua jornada está pronta, {answers.name}!</h1></div><PersonalSchedule schedule={schedule} /><Button size="lg" className="mt-8" onClick={onComplete}>Ir para o início<ArrowRight /></Button></main>;
  return <main className="min-h-dvh w-full bg-background px-5 py-5 sm:px-8">
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3"><img src={nexemLogo.url} alt="nexem" className="h-7 w-auto" /><span role="status" className="text-right text-xs text-muted-foreground">{saveState}</span></header>
    <section className="mx-auto mt-6 w-full max-w-xl rounded-lg border border-border bg-card px-5 py-6 sm:mt-10 sm:px-8 sm:py-8">
      <div className="mb-7"><div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>{editing ? 'Editar meu perfil' : 'Seu ponto de partida'}</span><span>{step + 1} de {STEPS.length}</span></div><Progress value={Math.round(step / SUMMARY_STEP * 100)} aria-label="Progresso do seu perfil" className="h-2" /></div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{step === SUMMARY_STEP ? <Target /> : step === 24 ? <ShieldCheck /> : <GraduationCap />}</div>
      <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold leading-tight tracking-normal outline-none sm:text-4xl">{STEPS[step]}</h1>
      <p className="mb-7 mt-3 text-base text-muted-foreground">{step === SUMMARY_STEP ? 'Confira suas escolhas. O cronograma só será criado quando você confirmar.' : step === 23 ? 'São 8 questões: 2 por área objetiva, de nível fácil a médio. Sem pressão e sem nota oficial.' : step >= 8 && step <= 12 ? 'Não é uma prova. Sua percepção ajuda a encontrar o melhor ponto de partida.' : 'Cada resposta deixa sua preparação mais do seu jeito.'}</p>
      <fieldset disabled={saving} key={step} className="min-w-0 min-h-48 space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
        {step === 0 && <div><label htmlFor="student-name" className="mb-2 block text-sm font-medium">Seu nome ou apelido</label><Input id="student-name" autoComplete="given-name" maxLength={100} placeholder="Pode me chamar de…" value={answers.name} onChange={e => change('name', e.target.value, false)} onBlur={() => { flushTimer(); void persist(answersRef.current, step); }} className="h-14 text-lg" /><p className="mt-3 text-sm text-muted-foreground">Só o primeiro nome ou apelido já basta.</p></div>}
        {step === 1 && <>{yesNo('under18')}<p className="text-sm text-muted-foreground">Não precisamos da sua data de nascimento nem de documentos.</p></>}
        {step === 2 && <Choices options={SITUATIONS} value={answers.situation} onChange={v => change('situation', v as OnboardingAnswers['situation'])} />}
        {step === 3 && <>{yesNo('trainee')}<p className="text-sm text-muted-foreground">Treineiro faz o ENEM para praticar, antes de concluir o Ensino Médio.</p></>}
        {step === 4 && <SearchChoice options={COURSES.map(c => c.name)} value={answers.course} label="curso" onChange={v => { change('course', v); const c = COURSES.find(x => x.name === v); if (c) change('targetScore', Math.round((c.low + c.high) / 2)); }} />}
        {step === 5 && <SearchChoice options={UNIVERSITIES} value={answers.university} label="universidade" onChange={v => change('university', v)} />}
        {step === 6 && <><label htmlFor="onboarding-target" className="block text-sm font-medium">Sua meta de nota (0 a 1000)</label><Input id="onboarding-target" type="number" min={0} max={1000} step={1} value={answers.targetScore} onChange={e => { const n = Number(e.target.value); if (n >= 0 && n <= 1000) change('targetScore', n, false); }} className="h-16 text-3xl font-semibold text-primary" />{COURSES.find(c => c.name === answers.course) && <p className="text-sm text-muted-foreground">Referência indicativa para {answers.course}: {COURSES.find(c => c.name === answers.course)?.low}–{COURSES.find(c => c.name === answers.course)?.high} pontos. Não é uma nota de corte oficial ou atualizada do Sisu; varia por universidade, modalidade, pesos e ano. Ajuste livremente e consulte o edital da instituição.</p>}</>}
        {step === 7 && <Choices options={['Inglês', 'Espanhol']} value={answers.language} onChange={v => change('language', v as OnboardingAnswers['language'])} />}
        {step >= 8 && step <= 12 && <><div className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <Button key={n} variant={answers.levels[AREAS[step - 8] ?? 'linguagens'] === n ? 'default' : 'outline'} className="h-14 min-w-0 flex-1 text-lg" aria-label={`Nível ${n} em ${AREA_LABELS[AREAS[step - 8] ?? 'linguagens']}`} aria-pressed={answers.levels[AREAS[step - 8] ?? 'linguagens'] === n} onClick={() => change('levels', { ...answers.levels, [AREAS[step - 8] ?? 'linguagens']: n })}>{n}</Button>)}</div><div className="flex justify-between text-xs text-muted-foreground"><span>Preciso construir a base</span><span>Me sinto confiante</span></div></>}
        {(step === 13 || step === 14) && <><Choices options={SUBJECTS} value={step === 13 ? answers.disliked : answers.liked} onChange={v => change(step === 13 ? 'disliked' : 'liked', v as OnboardingAnswers['liked'])} />{step === 13 && <p className="text-sm text-muted-foreground">Sem julgamento: vamos tornar essa matéria menos assustadora.</p>}</>}
        {step === 15 && yesNo('previousEnem')}
        {step === 16 && <><p className="text-sm text-muted-foreground">Todas as notas são opcionais. Em “Média geral”, informe a média, não a soma.</p>{(['total', ...AREAS] as const).map(area => <div key={area}><label htmlFor={`previous-${area}`} className="mb-2 block text-sm font-medium">{area === 'total' ? 'Média geral' : AREA_LABELS[area]}</label><Input id={`previous-${area}`} type="number" placeholder="Não lembro / prefiro não informar" min={0} max={1000} value={answers.previousScores[area] ?? ''} onChange={e => { const n = e.target.value === '' ? null : Number(e.target.value); if (n === null || n >= 0 && n <= 1000) change('previousScores', { ...answers.previousScores, [area]: n }, false); }} /></div>)}</>}
        {step === 17 && <><label className="flex items-center justify-between gap-3 text-sm font-medium">Tenho aulas na escola<Switch checked={answers.schoolClasses} onCheckedChange={v => { change('schoolClasses', v); if (v) change('availability', Object.fromEntries(DAYS.map((d, i) => [d, Math.min(answersRef.current.availability[d] ?? 0, i < 5 ? 2 : 12)]))); }} /></label><p className="text-sm text-muted-foreground">Marque os dias e reserve horas realistas. Com aulas na escola, sugerimos menos tempo nos dias úteis.</p>{DAYS.map(day => { const h = answers.availability[day] ?? 0; return <div key={day} className="flex items-center justify-between gap-3 border-b border-border py-3"><label className="flex min-w-0 items-center gap-3 text-sm"><Checkbox checked={h > 0} onCheckedChange={v => change('availability', { ...answers.availability, [day]: v ? 1 : 0 })} />{day}</label><div className="flex shrink-0 items-center gap-2"><Input aria-label={`Horas em ${day}`} type="number" min={0} max={12} step={0.5} value={h} onChange={e => { const n = Number(e.target.value); if (n >= 0 && n <= 12) change('availability', { ...answers.availability, [day]: n }, false); }} className="w-20" /><span className="text-sm text-muted-foreground">h</span></div></div>; })}<p className="font-semibold text-primary">{weeklyHours(answers)} horas por semana</p></>}
        {step === 18 && <Choices options={PERIODS} value={answers.period} onChange={v => change('period', v as OnboardingAnswers['period'])} />}
        {step === 19 && <Choices options={STYLES} multiple value={answers.styles} onChange={v => { const x = v as typeof STYLES[number]; change('styles', answers.styles.includes(x) ? answers.styles.filter(y => y !== x) : [...answers.styles, x]); }} />}
        {step === 20 && <Choices options={DIFFICULTIES} value={answers.difficulty} onChange={v => change('difficulty', v as OnboardingAnswers['difficulty'])} />}
        {step === 21 && <><div className="text-center text-4xl font-semibold text-primary">{answers.motivation}/5</div><Slider aria-label="Nível de motivação" min={1} max={5} step={1} value={[answers.motivation]} onValueChange={([v]) => change('motivation', v ?? 3, false)} /><div className="flex justify-between text-sm text-muted-foreground"><span>Preciso de um incentivo</span><span>Estou com tudo!</span></div><p className="text-sm text-muted-foreground">Tudo bem se a motivação variar. Pequenos passos também contam.</p></>}
        {step === 22 && <><label className="flex justify-between gap-3">Notificações no dispositivo<Switch checked={answers.reminders.push} onCheckedChange={v => change('reminders', { ...answers.reminders, push: v })} /></label><label className="flex justify-between gap-3">Lembretes por e-mail<Switch checked={answers.reminders.email} onCheckedChange={v => change('reminders', { ...answers.reminders, email: v })} /></label><label htmlFor="reminder-time" className="block text-sm font-medium">Horário preferido (horário de Brasília)</label><Input id="reminder-time" type="time" value={answers.reminders.time} onChange={e => { if (e.target.value) change('reminders', { ...answers.reminders, time: e.target.value }); }} /><p className="text-sm text-muted-foreground">Guardaremos sua preferência. Nenhum lembrete é enviado por enquanto; notificações exigem sua permissão quando forem ativadas.</p></>}
        {step === 23 && <>{!quizStarted ? <><Button size="lg" className="w-full" disabled={diagnosticLoading} onClick={() => void startQuiz()}>{diagnosticLoading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{answers.diagnostic && !answers.diagnostic.skipped ? 'Retomar diagnóstico' : 'Fazer diagnóstico'}</Button><Button variant="outline" className="w-full" onClick={() => { change('diagnostic', { skipped: true, answers: {}, results: {} }); }}>Pular por agora</Button>{answers.diagnostic?.skipped && <p className="text-sm text-primary">Tudo bem! Vamos começar com sua autoavaliação.</p>}</> : currentQuestion && <><p className="text-sm font-medium text-primary">Questão {quizIndex + 1} de 8 · {AREA_LABELS[currentQuestion.area as keyof typeof AREA_LABELS]}</p><p className="whitespace-pre-line text-base leading-relaxed">{currentQuestion.text}</p>{currentQuestion.image && <img src={currentQuestion.image} alt="Imagem da questão" className="max-h-72 w-full object-contain" />}<Choices options={currentQuestion.options.map((o, i) => `${'ABCDE'[i]}. ${o}`)} value={selectedLetter ? `${selectedLetter}. ${currentQuestion.options['ABCDE'.indexOf(selectedLetter)]}` : ''} onChange={v => change('diagnostic', { skipped: false, answers: { ...answers.diagnostic?.answers, [currentQuestion.id]: v[0] as 'A' | 'B' | 'C' | 'D' | 'E' }, results: {} })} /><div className="flex justify-between gap-3"><Button variant="ghost" disabled={quizIndex === 0 || saving} onClick={() => setQuizIndex(quizIndex - 1)}><ArrowLeft />Anterior</Button><Button disabled={!selectedLetter || saving} onClick={async () => { setSaving(true); try { await persist(answersRef.current, step); if (quizIndex < 7) setQuizIndex(quizIndex + 1); else { const r = await persist(answersRef.current, 24, true); setAnswers(r.answers); answersRef.current = r.answers; setStep(24); } } finally { setSaving(false); } }}>{quizIndex === 7 ? 'Concluir diagnóstico' : 'Próxima questão'}<ArrowRight /></Button></div><Button variant="ghost" onClick={() => { setQuizStarted(false); change('diagnostic', { skipped: true, answers: {}, results: {} }); }}>Pular por agora</Button></>}{diagnosticError && <p role="alert" className="text-sm text-destructive">{diagnosticError}</p>}</>}
        {step === 24 && <><div className="space-y-3 text-sm leading-relaxed text-muted-foreground"><p>Usamos suas respostas para personalizar seus estudos, desafios e metas. Elas ficam vinculadas à sua conta e não ficam visíveis para outros alunos.</p><p>Não pedimos CPF, endereço, data de nascimento ou dados de responsáveis. As notas anteriores e o diagnóstico são opcionais. Você pode revisar suas respostas em “Editar meu perfil”.</p><p>Você pode solicitar acesso, correção ou exclusão dos seus dados ao Nexem. A exclusão não está disponível nesta tela; o canal de atendimento e a política completa ainda precisam ser definidos antes do lançamento.</p></div>{answers.under18 && <div className="rounded-lg border border-primary/30 bg-primary/5 p-4"><h2 className="font-semibold tracking-normal">Para quem tem menos de 18 anos</h2><p className="mt-2 text-sm text-muted-foreground">Converse com seu responsável sobre o uso do Nexem e este aviso. Vamos guardar apenas o apelido e as informações necessárias para seus estudos, sem coletar documentos seus ou do responsável. Esta confirmação não substitui uma autorização verificável do responsável, quando exigida.</p><label className="mt-4 flex items-start gap-3 text-sm"><Checkbox checked={answers.parentalNotice} onCheckedChange={v => change('parentalNotice', v === true)} /><span>Li o aviso e vou conversar com meu responsável.</span></label></div>}<label className="flex items-start gap-3 text-sm"><Checkbox checked={answers.consent} onCheckedChange={v => change('consent', v === true)} /><span>Li o aviso e concordo com o uso das minhas respostas para personalizar meus estudos.</span></label></>}
        {step === SUMMARY_STEP && <><p className="text-xl font-semibold text-primary">Vamos nessa, {answers.name}!</p><dl className="grid grid-cols-2 gap-5 border-y border-border py-5"><div><dt className="text-sm text-muted-foreground">Meta de nota</dt><dd className="mt-1 text-2xl font-semibold">{summary.target}</dd></div><div><dt className="text-sm text-muted-foreground">Horas por semana</dt><dd className="mt-1 text-2xl font-semibold">{summary.hours}h</dd></div><div className="col-span-2"><dt className="text-sm text-muted-foreground">Pontos fortes relativos</dt><dd className="mt-1 font-medium">{summary.strengths.map(a => AREA_LABELS[a]).join(' e ')}</dd></div><div className="col-span-2"><dt className="text-sm text-muted-foreground">Prioridades de estudo</dt><dd className="mt-1 font-medium">{summary.priorities.map(a => AREA_LABELS[a]).join(' e ')}</dd></div></dl><p className="text-sm text-muted-foreground">{answers.course} · {answers.university}<br />{answers.language} · {answers.period}<br />{answers.styles.join(', ')}</p><p className="text-sm text-muted-foreground">{answers.diagnostic?.skipped ? 'Perfil baseado na sua autoavaliação, não em uma medida oficial de proficiência.' : 'Diagnóstico curto: uma estimativa inicial, não uma nota TRI oficial. A redação usa sua autoavaliação.'}</p>{editing && <p className="font-medium text-primary">Mudou alguma resposta? Confirme para regenerar seu cronograma.</p>}<Button variant="outline" className="w-full" onClick={() => setStep(0)}>Revisar minhas respostas</Button></>}
      </fieldset>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"><Button variant="ghost" aria-label="Voltar à pergunta anterior" disabled={step === 0 || saving} onClick={() => void move(true)}><ArrowLeft />Voltar</Button>{!(step === 23 && quizStarted) && <Button size="lg" disabled={saving} className="h-auto min-h-12 max-w-[70%] whitespace-normal" onClick={() => step === SUMMARY_STEP ? void finish() : void move()}>{saving ? <LoaderCircle className="shrink-0 animate-spin" /> : step === SUMMARY_STEP ? <Check /> : null}{saving ? 'Salvando…' : step === SUMMARY_STEP ? editing ? 'Regenerar meu cronograma' : 'Gerar meu cronograma' : 'Continuar'}{step < SUMMARY_STEP && <ArrowRight className="shrink-0" />}</Button>}</div>
      {editing && <Button variant="ghost" className="mt-4 w-full" disabled={saving} onClick={async () => { flushTimer(); setSaving(true); try { await persist(answersRef.current, step); onComplete(); } finally { setSaving(false); } }}>Salvar e voltar sem regenerar</Button>}
    </section>
  </main>;
}