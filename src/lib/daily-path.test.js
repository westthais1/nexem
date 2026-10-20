import { describe, expect, test } from "bun:test";
import { advance, jumpsFor } from "./daily-path";

describe("Trilha da Raposa", () => {
  test("10 acertos pula 2 caixas", () => expect(jumpsFor(10)).toBe(2));
  test("8 acertos pula 1 caixa", () => expect(jumpsFor(8)).toBe(1));
  test("6 acertos não pula", () => expect(jumpsFor(6)).toBe(0));
  test("segundo desafio no mesmo dia não conta", () =>
    expect(advance(3, "2026-10-20", 10, "2026-10-20")).toEqual({ box: 3, jumped: 0 }));
  test("novo dia avança", () =>
    expect(advance(3, "2026-10-19", 9, "2026-10-20")).toEqual({ box: 5, jumped: 2 }));
});
