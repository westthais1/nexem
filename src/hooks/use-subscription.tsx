import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getSubscription } from '@/lib/subscription.functions';
import type { SubscriptionTier } from '@/lib/subscription';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';

type SubscriptionContextValue = { tier: SubscriptionTier; isPremium: boolean; isLoading: boolean; openUpgrade: () => void };
const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
export function SubscriptionProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const get = useServerFn(getSubscription);
  const query = useQuery({ queryKey: ['subscription', userId], queryFn: () => get(), enabled: !!userId, staleTime: 0, refetchInterval: 60_000, retry: 1 });
  useEffect(() => { setOpen(false); }, [userId]);
  const tier = query.data?.userId === userId && !query.isError ? query.data.tier : 'free';
  return <SubscriptionContext.Provider value={{ tier, isPremium: tier === 'premium', isLoading: !!userId && query.isPending, openUpgrade: () => setOpen(true) }}>
    {children}<PremiumUpgradeModal open={open} onOpenChange={setOpen} />
  </SubscriptionContext.Provider>;
}
export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) throw new Error('SubscriptionProvider is required');
  return value;
}