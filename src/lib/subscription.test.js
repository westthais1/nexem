import { describe, expect, test } from 'bun:test';
import { activeTier, canAccess, canConsult, PRO_PLANS, USAGE_WINDOW_MS } from './subscription';

describe('subscription rules', () => {
  const now = Date.parse('2026-10-20T22:00:00Z');
  test('unknown users default to free', () => expect(activeTier(null, now)).toBe('free'));
  test('active unexpired subscription unlocks premium', () => expect(activeTier({ tier: 'premium', status: 'active', current_period_end: '2026-11-20T22:00:00Z' }, now)).toBe('premium'));
  test('expired subscription defaults to free', () => expect(activeTier({ tier: 'premium', status: 'active', current_period_end: '2026-10-20T22:00:00Z' }, now)).toBe('free'));
  test('inactive subscription defaults to free', () => expect(activeTier({ tier: 'premium', status: 'inactive', current_period_end: '2026-11-20T22:00:00Z' }, now)).toBe('free'));
  test('daily challenge is free', () => expect(canAccess('free', 'daily')).toBe(true));
  test('mastery requires premium', () => expect(canAccess('free', 'mastery')).toBe(false));
  test('full exam requires premium', () => expect(canAccess('free', 'exam')).toBe(false));
  test('premium unlocks mastery and full exam', () => { expect(canAccess('premium', 'mastery')).toBe(true); expect(canAccess('premium', 'exam')).toBe(true); });
  const calls = n => Array.from({ length: n }, () => ({ created_at: new Date(now).toISOString(), status: 'succeeded' }));
  test('third free consultation is allowed', () => expect(canConsult('free', calls(2), now)).toBe(true));
  test('fourth free consultation is blocked', () => expect(canConsult('free', calls(3), now)).toBe(false));
  test('premium consultations are unlimited', () => expect(canConsult('premium', calls(100), now)).toBe(true));
  test('24-hour-old consultations no longer count', () => expect(canConsult('free', calls(3).map(t => ({ ...t, created_at: new Date(now - USAGE_WINDOW_MS).toISOString() })), now)).toBe(true));
  test('failed AI calls are refunded', () => expect(canConsult('free', calls(3).map(t => ({ ...t, status: 'failed' })), now)).toBe(true));
  test('monthly price is R$29.90', () => expect(PRO_PLANS.monthly.billedCents).toBe(2990));
  test('annual monthly equivalent is R$14.90', () => expect(PRO_PLANS.annual.monthlyCents).toBe(1490));
  test('annual single charge is R$178.80', () => expect(PRO_PLANS.annual.billedCents).toBe(17880));
});