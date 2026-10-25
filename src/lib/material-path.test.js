import { describe, test, expect } from "bun:test";
import { gradeMaterialQuiz, isStepUnlocked, hasAchievementPath } from "./material-path";
const step = { questions: Array.from({ length: 10 }, () => ({ answer: 0 })) };
describe("Conquistas dos materiais", () => {
  test("primeiro nível começa liberado com progresso zero", () => expect(isStepUnlocked(0, {})).toBe(true));
  test("nível seguinte bloqueia até concluir todos os anteriores", () => {
    expect(isStepUnlocked(2, { 1: "done" })).toBe(false);
    expect(isStepUnlocked(2, { 0: "done", 1: "done" })).toBe(true);
  });
  test("70% libera conquista, 60% exige revisão", () => {
    expect(gradeMaterialQuiz(step, [0,0,0,0,0,0,0,1,1,1]).passed).toBe(true);
    expect(gradeMaterialQuiz(step, [0,0,0,0,0,0,1,1,1,1]).passed).toBe(false);
  });
  test("não concluir com respostas incompletas", () => expect(gradeMaterialQuiz(step, [0]).passed).toBe(false));
  test("simulado final só abre com toda trilha concluída", () => expect(isStepUnlocked(3, { 0: "done", 1: "done", 2: "doing" })).toBe(false));
  test("trilhas antigas precisam gerar questões", () => expect(hasAchievementPath([{ title: "Antigo" }])).toBe(false));
});