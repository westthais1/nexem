import { describe, test, expect } from "bun:test";
import { gradeMaterialQuiz, isStepUnlocked, hasAchievementPath } from "./material-path";
const step = { questions: Array.from({ length: 10 }, () => ({ answer: 0 })) };
describe("Conquistas dos materiais", () => {
  test("primeiro nível começa liberado com progresso zero", () => expect(isStepUnlocked(0, {})).toBe(true));
  test("nível seguinte bloqueia até concluir todos os anteriores", () => {
    expect(isStepUnlocked(2, { 1: "done" })).toBe(false);
    expect(isStepUnlocked(2, { 0: "done", 1: "done" })).toBe(true);
  });
  test("dois acertos em três liberam o próximo nível", () => {
    const mission = { questions: [{ answer: 0 }, { answer: 0 }, { answer: 0 }] };
    const attempt = gradeMaterialQuiz(mission, [0,0,1]);
    expect(attempt.score).toBe(67);
    expect(attempt.passed).toBe(true);
    expect(isStepUnlocked(1, { 0: attempt.passed ? "done" : "doing" })).toBe(true);
  });
  test("um acerto em três não libera o próximo nível", () => {
    const mission = { questions: [{ answer: 0 }, { answer: 0 }, { answer: 0 }] };
    const attempt = gradeMaterialQuiz(mission, [0, 1, 1]);
    expect(attempt.score).toBe(33);
    expect(attempt.passed).toBe(false);
    expect(isStepUnlocked(1, { 0: attempt.passed ? "done" : "doing" })).toBe(false);
  });
  test("um acerto não libera o próximo nível", () => {
    expect(gradeMaterialQuiz(step, [0,1,1,1,1,1,1,1,1,1]).passed).toBe(false);
  });
  test("mais de dois acertos também libera", () => {
    expect(gradeMaterialQuiz(step, [0,0,0,1,1,1,1,1,1,1]).passed).toBe(true);
  });
  test("simulado final mantém 70% de aprovação", () => {
    expect(gradeMaterialQuiz({ ...step, final: true }, [0,0,0,0,0,0,0,1,1,1]).passed).toBe(true);
    expect(gradeMaterialQuiz({ ...step, final: true }, [0,0,0,0,0,0,1,1,1,1]).passed).toBe(false);
  });
  test("não concluir com respostas incompletas", () => expect(gradeMaterialQuiz(step, [0]).passed).toBe(false));
  test("simulado final só abre com toda trilha concluída", () => expect(isStepUnlocked(3, { 0: "done", 1: "done", 2: "doing" })).toBe(false));
  test("trilhas antigas precisam gerar questões", () => expect(hasAchievementPath([{ title: "Antigo" }])).toBe(false));
});