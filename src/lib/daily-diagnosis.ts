import type { DailyAnswer } from "./daily-challenge";

export type DailyResult = {
  acertos: number;
  total: number;
  pontos: number;
  pontosPossiveis: number;
  nota: number;
  /** Desempenho alto em uma sessão completa, sem inversão fácil/difícil. */
  consistente: boolean;
  precisaMelhorar: boolean;
  possivelChute: boolean;
  padraoInconsistente: boolean;
  taxaConsistencia: number;
  acertosAvancados: number;
  errosBasicos: number;
  novoTheta: number;
};

/** Diagnóstico de treino: indícios não comprovam que o aluno chutou. */
export function gradeDaily(answers: DailyAnswer[], theta: number): DailyResult {
  const acertosAvancados = answers.filter((a) => a.correto && a.dificuldade > 75).length;
  const errosBasicos = answers.filter((a) => !a.correto && a.dificuldade < 40).length;
  const padraoInconsistente = acertosAvancados > 0 && errosBasicos > 0;
  const acertos = answers.filter((a) => a.correto).length;
  const taxa = answers.length > 0 ? acertos / answers.length : 0;
  const completa = answers.length >= 10;
  const consistente = completa && taxa > 0.8 && !padraoInconsistente;
  const possivelChute = padraoInconsistente || (completa && taxa <= 0.3);

  let pontos = 0;
  let pontosPossiveis = 0;
  for (const a of answers) {
    pontosPossiveis += a.dificuldade;
    if (!a.correto) continue;
    pontos += padraoInconsistente && a.dificuldade > 75 ? a.dificuldade * 0.6 : a.dificuldade;
  }

  return {
    acertos,
    total: answers.length,
    pontos: Math.round(pontos),
    pontosPossiveis: Math.round(pontosPossiveis),
    nota: pontosPossiveis > 0 ? Math.round((pontos / pontosPossiveis) * 1000) : 0,
    consistente,
    precisaMelhorar: !consistente,
    possivelChute,
    padraoInconsistente,
    taxaConsistencia: Math.round(taxa * 100 * (padraoInconsistente ? 0.6 : 1)),
    acertosAvancados,
    errosBasicos,
    novoTheta: Math.min(100, Math.max(1, Math.round(theta + Math.round((taxa - 0.6) * 20)))),
  };
}