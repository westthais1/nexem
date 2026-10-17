import { describe, expect, test } from "bun:test";
import { needsStudentQuiz, studentQuizSchema, SCHOOL_GRADES, LEARNING_GOALS } from "./student-quiz";

const answers = { school_grade: SCHOOL_GRADES[2], learning_goal: LEARNING_GOALS[0], target_score: 800 };

describe("student onboarding quiz", () => {
  test("collects the school grade", () => {
    expect(studentQuizSchema.safeParse({ ...answers, school_grade: "" }).success).toBe(false);
    expect(studentQuizSchema.parse(answers).school_grade).toBe("2º ano do Ensino Médio");
  });
  test("collects the student's goal", () => {
    expect(studentQuizSchema.safeParse({ ...answers, learning_goal: "" }).success).toBe(false);
    expect(studentQuizSchema.parse(answers).learning_goal).toBe("Entrar na universidade");
  });
  test("accepts a desired ENEM score and rejects invalid scores", () => {
    expect(studentQuizSchema.parse(answers).target_score).toBe(800);
    expect(studentQuizSchema.safeParse({ ...answers, target_score: 1001 }).success).toBe(false);
    expect(studentQuizSchema.safeParse({ ...answers, target_score: -1 }).success).toBe(false);
  });
  test("shows the quiz only until the saved completion", () => {
    expect(needsStudentQuiz({ quiz_completed_at: null })).toBe(true);
    expect(needsStudentQuiz({ quiz_completed_at: "2026-10-17T17:55:00Z" })).toBe(false);
  });
});