export type SubscriptionTier = 'free' | 'premium';
export const FREE_TUTOR_LIMIT = 3;
export const USAGE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const PRO_PLANS = {
  monthly: { label: 'Plano Mensal', monthlyCents: 2990, billedCents: 2990 },
  annual: { label: 'Plano Anual', monthlyCents: 1490, billedCents: 17880 },
} as const;
export function activeTier(row: { tier: string; status: string; current_period_end: string | null } | null, now = Date.now()): SubscriptionTier {
  return row?.tier === 'premium' && row.status === 'active' && row.current_period_end !== null && Date.parse(row.current_period_end) > now ? 'premium' : 'free';
}
export function canAccess(tier: SubscriptionTier, feature: 'daily' | 'mastery' | 'exam') {
  return feature === 'daily' || tier === 'premium';
}
export function canConsult(tier: SubscriptionTier, transactions: { created_at: string; status: string }[], now = Date.now()) {
  return tier === 'premium' || transactions.filter(t => t.status !== 'failed' && Date.parse(t.created_at) > now - USAGE_WINDOW_MS).length < FREE_TUTOR_LIMIT;
}