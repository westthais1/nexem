import { describe, expect, test } from "bun:test";
import { pickWeakest, planToday, weakestCompetencia, weekdayNamePt } from "./next-steps";

const schedule = [
  { day: "Segunda-feira", hours: 1, period: "Noite", sessions: [{ area: "matematica", minutes: 50, topic: "Funções", format: "Exercícios" }] },
  { day: "Terça-feira", hours: 1, period: "Noite", sessions: [{ area: "redacao", minutes: 50, topic: "Proposta", format: "Exercícios" }] },
];

describe("Card Hoje", () => {
  test("sem cronograma leva ao perfil", () => expect(planToday(null, "Segunda-feira", false).kind).toBe("perfil"));
  test("desafio não feito vem primeiro", () => expect(planToday(schedule, "Segunda-feira", false).kind).toBe("desafio"));
  test("desafio feito leva à matéria planejada", () => expect(planToday(schedule, "Segunda-feira", true)).toMatchObject({ kind: "treinar", area: "matematica" }));
  test("sessão de redação leva à Redação", () => expect(planToday(schedule, "Terça-feira", true).kind).toBe("redacao"));
  test("dia sem sessão é livre", () => expect(planToday(schedule, "Domingo", true).kind).toBe("livre"));
  test("dia da semana em São Paulo", () => expect(weekdayNamePt(new Date("2026-11-09T15:00:00Z"))).toBe("Segunda-feira"));
});

describe("Mais fraco", () => {
  test("menor taxa de acerto", () =>
    expect(pickWeakest([{ key: "a", total: 10, acertos: 8 }, { key: "b", total: 4, acertos: 1 }, { key: "c", total: 0, acertos: 0 }])?.key).toBe("b"));
  test("sem dados", () => expect(pickWeakest([{ key: "a", total: 0, acertos: 0 }])).toBeNull());
  test("competência mais fraca", () => expect(weakestCompetencia({ c1: 160, c2: 80, c3: 120, c4: 80, c5: 200 })).toBe("c2"));
});
