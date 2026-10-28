import { z } from 'zod';
import { MATERIAS, peso } from './enem-frequencia';

export const AREAS = ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'] as const;
export type Area = typeof AREAS[number];
export const AREA_LABELS: Record<Area, string> = { linguagens: 'Linguagens', humanas: 'Ciências Humanas', natureza: 'Ciências da Natureza', matematica: 'Matemática', redacao: 'Redação' };
export const SITUATIONS = ['1º ano EM', '2º ano EM', '3º ano EM', 'Já terminei o EM', 'Cursinho', 'EJA/Encceja'] as const;
export const SUBJECTS = ['Língua Portuguesa', 'Literatura', 'Inglês', 'Espanhol', 'História', 'Geografia', 'Filosofia', 'Sociologia', 'Biologia', 'Física', 'Química', 'Matemática', 'Redação'] as const;
export const STYLES = ['Vídeo-aulas', 'Resumos', 'Exercícios', 'Flashcards', 'Mapas mentais'] as const;
export const DIFFICULTIES = ['Falta de constância', 'Não sei por onde começar', 'Falta de tempo', 'Ansiedade', 'Interpretação de texto', 'Matemática básica', 'Redação'] as const;
export const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'] as const;
export const PERIODS = ['Manhã', 'Tarde', 'Noite'] as const;
// Indicative planning references, not official or live Sisu cutoffs.
export const COURSES = [
  { name: 'Medicina', low: 780, high: 850 }, { name: 'Direito', low: 680, high: 780 },
  { name: 'Engenharia Civil', low: 650, high: 780 }, { name: 'Engenharia de Computação', low: 700, high: 800 },
  { name: 'Ciência da Computação', low: 700, high: 810 }, { name: 'Enfermagem', low: 620, high: 750 },
  { name: 'Psicologia', low: 680, high: 780 }, { name: 'Administração', low: 600, high: 730 },
  { name: 'Pedagogia', low: 550, high: 680 }, { name: 'Arquitetura e Urbanismo', low: 650, high: 780 },
  { name: 'Odontologia', low: 700, high: 800 }, { name: 'Farmácia', low: 630, high: 760 },
  { name: 'Medicina Veterinária', low: 650, high: 780 }, { name: 'Nutrição', low: 620, high: 750 },
  { name: 'Fisioterapia', low: 630, high: 760 }, { name: 'Jornalismo', low: 620, high: 750 },
  { name: 'Ciências Econômicas', low: 620, high: 770 }, { name: 'Biologia', low: 580, high: 720 },
  { name: 'Matemática', low: 550, high: 700 }, { name: 'Letras', low: 550, high: 700 },
  { name: 'História', low: 550, high: 700 }, { name: 'Educação Física', low: 580, high: 710 },
];
export const UNIVERSITIES = ['UFRJ', 'UFMG', 'UFRGS', 'UFSC', 'UFPR', 'UnB', 'UFBA', 'UFPE', 'UFC', 'UFRN', 'UFPB', 'UFPA', 'UFAM', 'UFG', 'UFES', 'UFF', 'UFSCar', 'UFABC', 'UFV', 'UFJF', 'UFMS', 'UFMT', 'UFS', 'UFAL', 'UFPI', 'UFMA', 'UFT', 'UNIFESP', 'USP', 'Unicamp', 'Unesp'];
const text = z.string().trim().max(100);
const score = z.number().min(0).max(1000);
const levels = z.object({ linguagens: z.number().int().min(1).max(5), humanas: z.number().int().min(1).max(5), natureza: z.number().int().min(1).max(5), matematica: z.number().int().min(1).max(5), redacao: z.number().int().min(1).max(5) });
export const onboardingAnswersSchema = z.object({
  name: text.default(''), under18: z.boolean().nullable().default(null), situation: z.union([z.enum(SITUATIONS), z.literal('')]).default(''), trainee: z.boolean().nullable().default(null),
  course: text.default(''), university: text.default(''), targetScore: score.default(800), language: z.union([z.enum(['Inglês', 'Espanhol']), z.literal('')]).default(''),
  levels: levels.default({ linguagens: 3, humanas: 3, natureza: 3, matematica: 3, redacao: 3 }),
  disliked: z.union([z.enum(SUBJECTS), z.literal('')]).default(''), liked: z.union([z.enum(SUBJECTS), z.literal('')]).default(''),
  previousEnem: z.boolean().nullable().default(null), previousScores: z.object({ total: score.nullable().default(null), linguagens: score.nullable().default(null), humanas: score.nullable().default(null), natureza: score.nullable().default(null), matematica: score.nullable().default(null), redacao: score.nullable().default(null) }).default({}),
  availability: z.record(z.enum(DAYS), z.number().min(0).max(12)).default({}), period: z.union([z.enum(PERIODS), z.literal('')]).default(''), schoolClasses: z.boolean().default(false),
  styles: z.array(z.enum(STYLES)).max(5).default([]), difficulty: z.union([z.enum(DIFFICULTIES), z.literal('')]).default(''), motivation: z.number().int().min(1).max(5).default(3),
  reminders: z.object({ push: z.boolean().default(false), email: z.boolean().default(false), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('19:00') }).default({}),
  diagnostic: z.object({ skipped: z.boolean(), answers: z.record(z.string().max(80), z.enum(['A', 'B', 'C', 'D', 'E'])).refine(v => Object.keys(v).length <= 8), results: z.record(z.enum(AREAS), z.object({ correct: z.number().int().min(0).max(2), total: z.number().int().min(0).max(2) })).default({}) }).nullable().default(null),
  consent: z.boolean().default(false), parentalNotice: z.boolean().default(false),
}).strict();
export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;
export const DEFAULT_ANSWERS = onboardingAnswersSchema.parse({});
export const STEPS = [
  'Como você quer ser chamado?', 'Você tem menos de 18 anos?', 'Qual é sua situação hoje?', 'Vai fazer o ENEM como treineiro?',
  'Qual é o curso dos seus sonhos?', 'Em qual universidade você sonha estudar?', 'Qual nota você quer conquistar?', 'Qual língua estrangeira você escolheu?',
  ...AREAS.map(a => `Como você se sente em ${AREA_LABELS[a]}?`), 'Qual matéria você mais odeia?', 'Qual matéria você mais gosta?',
  'Você já fez o ENEM antes?', 'Quer contar suas notas anteriores?', 'Como é sua rotina de estudos?', 'Quando você prefere estudar?',
  'Como você gosta de aprender?', 'O que mais dificulta seus estudos?', 'Como está sua motivação?', 'Quer um lembrete para estudar?',
  'Vamos descobrir seu ponto de partida?', 'Seus dados, suas escolhas', 'Seu perfil Nexem',
];
export const SUMMARY_STEP = STEPS.length - 1;
export function validateOnboardingStep(step: number, a: OnboardingAnswers): string | null {
  if (step === 0 && !a.name) return 'Conte como você quer ser chamado.';
  if (step === 1 && a.under18 === null) return 'Escolha uma opção para continuarmos.';
  if (step === 2 && !a.situation) return 'Escolha sua situação atual.';
  if (step === 3 && a.trainee === null) return 'Escolha sim ou não.';
  if (step === 4 && !a.course) return 'Escolha um curso ou Ainda não sei.';
  if (step === 5 && !a.university) return 'Escolha uma universidade ou Ainda não sei.';
  if (step === 7 && !a.language) return 'Escolha Inglês ou Espanhol.';
  if (step === 13 && !a.disliked) return 'Escolha uma matéria.';
  if (step === 14 && !a.liked) return 'Escolha uma matéria.';
  if (step === 15 && a.previousEnem === null) return 'Escolha sim ou não.';
  if (step === 17 && weeklyHours(a) <= 0) return 'Reserve algum tempo em pelo menos um dia da semana.';
  if (step === 18 && !a.period) return 'Escolha seu período preferido.';
  if (step === 19 && !a.styles.length) return 'Escolha pelo menos um jeito de aprender.';
  if (step === 20 && !a.difficulty) return 'Escolha sua maior dificuldade.';
  if (step === 23 && !a.diagnostic) return 'Faça o diagnóstico ou escolha Pular por agora.';
  if (step === 24 && (!a.consent || (a.under18 && !a.parentalNotice))) return 'Confira os avisos e confirme sua escolha para continuar.';
  return null;
}
export function weeklyHours(a: OnboardingAnswers): number { return Object.values(a.availability).reduce((s, h) => s + h, 0); }
export function refinedLevels(a: OnboardingAnswers): Record<Area, number> {
  const result = { ...a.levels };
  if (!a.diagnostic?.skipped) for (const area of AREAS) {
    const r = a.diagnostic?.results[area];
    if (r?.total === 2) result[area] = Math.max(1, Math.min(5, Math.round((a.levels[area] + 1 + r.correct * 2) / 2)));
  }
  return result;
}
export function profileSummary(a: OnboardingAnswers) {
  const levels = refinedLevels(a);
  const sorted = [...AREAS].sort((x, y) => levels[x] - levels[y]);
  return { levels, priorities: sorted.slice(0, 2), strengths: sorted.slice(-2).reverse(), hours: weeklyHours(a), target: a.targetScore };
}
export type StudyDay = { day: string; hours: number; period: string; sessions: { area: Area; minutes: number; topic: string; format: string }[] };
export function generatePersonalSchedule(a: OnboardingAnswers): StudyDay[] {
  const s = profileSummary(a);
  const order = [...AREAS].sort((x, y) => s.levels[x] - s.levels[y]);
  const topic = (area: Area) => {
    if (area === 'redacao') return 'Argumentação e proposta de intervenção';
    const list = MATERIAS.filter(m => m.area === AREA_LABELS[area]).flatMap(m => m.topicos).sort((x, y) => peso(y) - peso(x));
    return list[0]?.nome ?? 'Interpretação de texto';
  };
  let cursor = 0;
  return DAYS.filter(day => (a.availability[day] ?? 0) > 0).map(day => {
    const hours = a.availability[day] ?? 0;
    const total = Math.round(hours * 60);
    const count = Math.min(4, Math.max(1, Math.ceil(total / 50)));
    const sessions = Array.from({ length: count }, (_, i) => {
      const area = order[cursor++ % order.length] ?? 'matematica';
      return { area, minutes: Math.floor(total / count) + (i < total % count ? 1 : 0), topic: topic(area), format: a.styles[i % a.styles.length] ?? 'Exercícios' };
    });
    return { day, hours, period: a.period, sessions };
  });
}