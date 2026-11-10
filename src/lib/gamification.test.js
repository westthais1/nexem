import { describe, expect, test } from 'bun:test';
import { comboReward, starsFor, streakTransition, eligibleAchievements } from './gamification';
describe('recompensas determinísticas', () => {
  test('combo x2 e x3 têm bônus pequeno', () => { expect(comboReward(2, 0)).toBe(1); expect(comboReward(3, 1)).toBe(2); });
  test('combo tem teto de 15 e erro não remove XP', () => { expect(comboReward(10, 14)).toBe(1); expect(comboReward(10, 15)).toBe(0); expect(comboReward(0, 8)).toBe(0); });
  test('estrelas: 0–5 uma, 6–8 duas, 9–10 três', () => { expect([0,5,6,8,9,10].map(starsFor)).toEqual([1,1,2,2,3,3]); });
  test('escudo protege um único dia perdido', () => { expect(streakTransition(7, 2, 1)).toEqual({ streak: 8, shields: 0, consumed: true, earned: false }); });
  test('dois dias perdidos não são protegidos', () => { expect(streakTransition(7, 3, 2).streak).toBe(1); });
  test('cada sete dias ganha um escudo', () => { expect(streakTransition(6, 1, 0)).toEqual({ streak: 7, shields: 1, consumed: false, earned: true }); });
  test('repetição no mesmo dia não ganha outro escudo', () => { expect(streakTransition(7, 0, 1).shields).toBe(1); });
  const empty = { streak: 0, bossCorrect: 0, combo: 0, essayScore: 0, examCompleted: false };
  test('sequência 7 concede medalha', () => { expect(eligibleAchievements({...empty, streak: 6})).toEqual([]); expect(eligibleAchievements({...empty, streak: 7})).toEqual(['streak7']); });
  test('chefe exige dois acertos', () => { expect(eligibleAchievements({...empty, bossCorrect: 1})).toEqual([]); expect(eligibleAchievements({...empty, bossCorrect: 2})).toEqual(['boss']); });
  test('combo exige dez acertos', () => { expect(eligibleAchievements({...empty, combo: 9})).toEqual([]); expect(eligibleAchievements({...empty, combo: 10})).toEqual(['combo10']); });
  test('redação exige 800', () => { expect(eligibleAchievements({...empty, essayScore: 799})).toEqual([]); expect(eligibleAchievements({...empty, essayScore: 800})).toEqual(['essay800']); });
  test('prova exige conclusão', () => { expect(eligibleAchievements(empty)).toEqual([]); expect(eligibleAchievements({...empty, examCompleted: true})).toEqual(['exam']); });
});