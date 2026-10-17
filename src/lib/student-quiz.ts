import { z } from "zod";

export const SCHOOL_GRADES = [
  "9º ano do Ensino Fundamental",
  "1º ano do Ensino Médio",
  "2º ano do Ensino Médio",
  "3º ano do Ensino Médio",
  "Já terminei o Ensino Médio",
] as const;

export const LEARNING_GOALS = [
  "Entrar na universidade",
  "Conquistar uma bolsa de estudos",
  "Melhorar minha nota no ENEM",
  "Descobrir e fortalecer meus pontos fracos",
] as const;

export const studentQuizSchema = z.object({
  school_grade: z.enum(SCHOOL_GRADES),
  learning_goal: z.enum(LEARNING_GOALS),
  target_score: z.number().int().min(0).max(1000),
});

export type StudentQuizAnswers = z.infer<typeof studentQuizSchema>;

export function needsStudentQuiz(profile: { quiz_completed_at?: string | null }): boolean {
  return !profile.quiz_completed_at;
}