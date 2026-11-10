/** Pure rules; only authenticated server handlers use these to authorize rewards. */
export const GAME_RULES = { chestXp: 25, missionXp: 10, achievementXp: 20, comboCap: 15 } as const;
export function starsFor(correct: number): number { return correct >= 9 ? 3 : correct >= 6 ? 2 : 1; }
export function comboReward(combo: number, alreadyAwarded: number): number {
  return Math.max(0, Math.min(3, combo - 1, GAME_RULES.comboCap - alreadyAwarded));
}
export function streakTransition(streak: number, gap: number, shields: number) {
  if (gap === 0) return { streak, shields, consumed: false, earned: false };
  const consumed = gap === 2 && shields > 0;
  const next = gap === 1 || consumed ? streak + 1 : 1;
  const earned = next % 7 === 0;
  return { streak: next, shields: shields - Number(consumed) + Number(earned), consumed, earned };
}
export const ACHIEVEMENTS = {
  streak7: { title: 'Primeira sequência de 7', description: 'Estude por 7 dias em sequência.' },
  boss: { title: 'Chefe derrotado', description: 'Acerte as duas questões do chefe final.' },
  combo10: { title: '10 acertos seguidos', description: 'Acerte 10 questões seguidas no Desafio ou treino.' },
  essay800: { title: 'Redação 800+', description: 'Receba pelo menos 800 em uma correção.' },
  exam: { title: 'Prova Completa concluída', description: 'Conclua e salve uma Prova Completa.' },
} as const;
export type AchievementKey = keyof typeof ACHIEVEMENTS;
export function eligibleAchievements(evidence: { streak: number; bossCorrect: number; combo: number; essayScore: number; examCompleted: boolean }): AchievementKey[] {
  const out: AchievementKey[] = [];
  if (evidence.streak >= 7) out.push('streak7');
  if (evidence.bossCorrect === 2) out.push('boss');
  if (evidence.combo >= 10) out.push('combo10');
  if (evidence.essayScore >= 800) out.push('essay800');
  if (evidence.examCompleted) out.push('exam');
  return out;
}
export function levelTitle(level: number): string { return level >= 10 ? 'Mestre ENEM' : level >= 5 ? 'Veterano' : 'Calouro'; }