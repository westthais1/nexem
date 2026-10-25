import type { PathStep, StepStatus } from "./materials";

export type QuizAttempt = { answers: number[]; score: number; passed: boolean };
export type MaterialProgress = Record<string, StepStatus | QuizAttempt>;
export const PASS_PERCENT = 70;
export function statusOf(value: StepStatus | QuizAttempt | undefined): StepStatus {
  return value === "done" || value === "doing" ? value : "todo";
}
export function gradeMaterialQuiz(step: PathStep, answers: number[]): QuizAttempt {
  const questions = step.questions ?? [];
  const complete = questions.length > 0 && answers.length === questions.length && answers.every((a) => Number.isInteger(a) && a >= 0 && a < 5);
  const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const score = questions.length ? Math.round(correct / questions.length * 100) : 0;
  return { answers, score, passed: complete && score >= PASS_PERCENT };
}
export function isStepUnlocked(index: number, progress: MaterialProgress): boolean {
  return Array.from({ length: index }, (_, i) => i).every((i) => statusOf(progress[i]) === "done");
}
export function hasAchievementPath(path: PathStep[]): boolean {
  return path.length > 0 && path.every((s) => (s.questions?.length ?? 0) > 0) && path.some((s) => s.final);
}