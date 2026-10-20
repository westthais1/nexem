import type { ReactNode } from 'react';
import { Crown, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';

export function PremiumGate({ children }: { children: ReactNode }) {
  const { isPremium, isLoading, openUpgrade } = useSubscription();
  if (isLoading) return <div role="status" className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  if (isPremium) return children;
  return <main className="w-full flex-1 px-6 py-12"><div className="mx-auto max-w-xl space-y-5 text-center">
    <Crown className="mx-auto h-10 w-10 text-primary" />
    <h1 className="text-3xl font-semibold">Prova Completa · Nexem Pro</h1>
    <p className="text-muted-foreground">Os dois dias do ENEM, 90 questões por dia e seu cartão-resposta.</p>
    <Button size="lg" onClick={openUpgrade}><Lock /> Desbloquear com Nexem Pro</Button>
  </div></main>;
}