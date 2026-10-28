import { describe, expect, test } from 'bun:test';
import { DEFAULT_ANSWERS, AREAS, DAYS, SUMMARY_STEP, onboardingAnswersSchema, validateOnboardingStep, weeklyHours, refinedLevels, generatePersonalSchedule } from './student-onboarding';
const complete = { ...DEFAULT_ANSWERS, name: 'Dani', under18: false, situation: '3º ano EM', trainee: false, course: 'Medicina', university: 'UFMG', language: 'Inglês', disliked: 'Matemática', liked: 'Biologia', previousEnem: false, availability: { 'Segunda-feira': 1.5, 'Sábado': 3 }, period: 'Noite', styles: ['Exercícios'], difficulty: 'Falta de tempo', diagnostic: { skipped: true, answers: {}, results: {} }, consent: true };
describe('onboarding personalizado', () => {
  test('nome obrigatório e limitado', () => { expect(validateOnboardingStep(0, DEFAULT_ANSWERS)).not.toBeNull(); expect(onboardingAnswersSchema.safeParse({ ...complete, name: 'x'.repeat(101) }).success).toBe(false); });
  test('inclui as cinco áreas com níveis de 1 a 5', () => { expect(AREAS).toHaveLength(5); expect(onboardingAnswersSchema.safeParse({ ...complete, levels: { ...complete.levels, redacao: 6 } }).success).toBe(false); });
  test('nota editável entre 0 e 1000', () => { expect(onboardingAnswersSchema.parse({ ...complete, targetScore: 1000 }).targetScore).toBe(1000); expect(onboardingAnswersSchema.safeParse({ ...complete, targetScore: 1001 }).success).toBe(false); });
  test('permite notas anteriores em branco', () => { expect(onboardingAnswersSchema.parse(complete).previousScores.redacao).toBeNull(); });
  test('somente os dias selecionados contam', () => { expect(weeklyHours(complete)).toBe(4.5); expect(generatePersonalSchedule(complete).map(d => d.day)).toEqual(['Segunda-feira', 'Sábado']); });
  test('cronograma conserva exatamente minutos disponíveis', () => { expect(generatePersonalSchedule(complete).flatMap(d => d.sessions).reduce((s, x) => s + x.minutes, 0)).toBe(270); });
  test('não permite continuar sem disponibilidade', () => { expect(validateOnboardingStep(17, { ...complete, availability: {} })).not.toBeNull(); });
  test('diagnóstico pode ser pulado', () => { expect(validateOnboardingStep(23, complete)).toBeNull(); expect(refinedLevels(complete)).toEqual(complete.levels); });
  test('dois acertos refinam área objetiva sem inventar redação', () => { const levels = refinedLevels({ ...complete, diagnostic: { skipped: false, answers: {}, results: { matematica: { correct: 2, total: 2 } } } }); expect(levels.matematica).toBe(4); expect(levels.redacao).toBe(3); });
  test('menores precisam ler aviso de responsável', () => { expect(validateOnboardingStep(24, { ...complete, under18: true })).not.toBeNull(); expect(validateOnboardingStep(24, { ...complete, under18: true, parentalNotice: true })).toBeNull(); });
  test('consentimento é obrigatório', () => { expect(validateOnboardingStep(24, { ...complete, consent: false })).not.toBeNull(); });
  test('todas as etapas válidas permitem confirmação', () => { expect(Array.from({ length: SUMMARY_STEP }, (_, i) => validateOnboardingStep(i, complete)).filter(Boolean)).toEqual([]); });
  test('máximo doze horas por dia', () => { expect(onboardingAnswersSchema.safeParse({ ...complete, availability: { [DAYS[0]]: 13 } }).success).toBe(false); });
});