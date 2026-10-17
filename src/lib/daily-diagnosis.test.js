import { describe, expect, test } from "bun:test";
import { gradeDaily } from "./daily-diagnosis";

const session = (correct) => Array.from({ length: 10 }, (_, i) => ({
  questionId: String(i), letra: "A", correto: i < correct, dificuldade: 50,
}));

describe("daily challenge diagnosis", () => {
  for (const correct of [2, 4, 5, 8]) {
    test(`${correct}/10 requires improvement and cannot earn consistency bonus`, () => {
      const result = gradeDaily(session(correct), 50);
      expect(result.precisaMelhorar).toBe(true);
      expect(result.consistente).toBe(false);
      expect(result.taxaConsistencia).toBe(correct * 10);
    });
  }
  test("2/10 signals possible guessing even without easy/hard inversion", () => {
    expect(gradeDaily(session(2), 50).possivelChute).toBe(true);
  });
  test("zero correct cannot be classified as consistent", () => {
    expect(gradeDaily(session(0), 50).consistente).toBe(false);
  });
  test("9/10 can earn a high-performance bonus", () => {
    expect(gradeDaily(session(9), 50).consistente).toBe(true);
  });
  test("hard correct with easy wrong remains inconsistent and retains the 40% penalty", () => {
    const answers = session(9).map((a, i) => ({ ...a, dificuldade: i === 0 ? 80 : i === 9 ? 30 : 50 }));
    const result = gradeDaily(answers, 50);
    expect(result.consistente).toBe(false);
    expect(result.possivelChute).toBe(true);
    expect(result.pontos).toBe(448);
  });
  test("an incomplete perfect run does not receive the daily consistency bonus", () => {
    expect(gradeDaily(session(10).slice(0, 2), 50).consistente).toBe(false);
  });
});