/** Trilha da Raposa: regra de pulos do Desafio Diário (espelhada na função do banco). */
export const PATH_LEVELS = ["Bronze", "Prata", "Ouro", "Diamante", "Mestre ENEM"] as const;
export const BOXES_PER_LEVEL = 5;
export const PATH_TOTAL = PATH_LEVELS.length * BOXES_PER_LEVEL;

export function jumpsFor(acertos: number): number {
  if (acertos >= 9) return 2;
  if (acertos >= 7) return 1;
  return 0;
}

/** Aplica o desafio do dia; só o primeiro desafio concluído no dia conta. */
export function advance(
  box: number,
  lastDay: string | null,
  acertos: number,
  day: string,
): { box: number; jumped: number } {
  if (lastDay === day) return { box, jumped: 0 };
  const jumped = jumpsFor(acertos);
  return { box: Math.min(box + jumped, PATH_TOTAL), jumped };
}

export function levelOf(box: number): number {
  return Math.min(Math.floor(box / BOXES_PER_LEVEL), PATH_LEVELS.length - 1);
}
