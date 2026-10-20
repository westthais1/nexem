import { useState } from 'react';
import { Check, Crown, ArrowRight, CircleCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PRO_PLANS } from '@/lib/subscription';

export function PremiumUpgradeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [notice, setNotice] = useState(false);
  const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="premium-surface max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border p-6 sm:p-8 data-[state=open]:slide-in-from-bottom-4">
      <DialogHeader className="items-center text-center sm:text-center">
        <Crown className="h-9 w-9 text-pro-highlight" />
        <p className="text-sm font-semibold text-pro-highlight">NEXEM PRO</p>
        <DialogTitle className="text-3xl leading-tight">Seu próximo nível começa aqui.</DialogTitle>
        <DialogDescription className="text-pro-muted">Mais profundidade no treino. Mais apoio em cada questão.</DialogDescription>
      </DialogHeader>
      <ul className="grid gap-3 py-3 text-sm sm:grid-cols-2">
        {['Todos os Níveis de Maestria', 'Prova Completa: os dois dias', 'Tutor Nex ilimitado', 'Desafio Diário sempre gratuito'].map(item => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-pro-highlight" />{item}</li>)}
      </ul>
      <div role="radiogroup" aria-label="Plano de assinatura" className="grid gap-4 sm:grid-cols-2">
        {(['monthly', 'annual'] as const).map(key => <Button key={key} variant="ghost" role="radio" aria-checked={plan === key} onClick={() => { setPlan(key); setNotice(false); }} className={`relative h-auto min-h-48 flex-col items-start gap-3 whitespace-normal border p-5 text-left text-pro-text hover:bg-pro-panel hover:text-pro-text ${plan === key ? 'border-pro-highlight bg-pro-panel' : 'border-pro-border bg-transparent'}`}>
          {key === 'annual' && <span className="pro-popular absolute -top-3 left-4 rounded px-3 py-1 text-xs font-bold">Mais Popular · Economia de 50%</span>}
          <span className="flex w-full items-center justify-between text-base font-semibold">{PRO_PLANS[key].label}{plan === key && <CircleCheck className="text-pro-highlight" />}</span>
          <span className="text-3xl font-bold">{money(PRO_PLANS[key].monthlyCents)}<span className="text-sm font-normal text-pro-muted"> / mês</span></span>
          <span className="text-sm leading-relaxed text-pro-muted">{key === 'monthly' ? 'Flexibilidade total, cancele quando quiser.' : `Cobrado em parcela única de ${money(PRO_PLANS.annual.billedCents)}.`}</span>
        </Button>)}
      </div>
      <Button size="lg" className="pro-checkout mt-2 h-12 w-full text-base font-semibold transition-transform duration-200 active:scale-95 motion-reduce:transition-none" onClick={() => setNotice(true)}>Ativar Nexem Pro <ArrowRight /></Button>
      {notice && <p role="status" className="rounded-md border border-pro-border bg-pro-panel p-3 text-center text-sm text-pro-muted">As assinaturas ainda não estão disponíveis para pagamento. Nenhuma cobrança foi realizada.</p>}
      <p className="text-center text-xs text-pro-muted">Gratuito: Desafio Diário + 3 consultas ao Tutor a cada 24 horas.</p>
    </DialogContent>
  </Dialog>;
}