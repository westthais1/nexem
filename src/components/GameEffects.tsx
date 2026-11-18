import { useEffect, useState } from 'react';
import { Coins, Flame, PackageOpen, Swords } from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';

export function CountUp({ value }: { value: number }) {
  const display = useCountUp(value);
  return <span className="tabular-nums"><span aria-hidden="true">{display}</span><span className="sr-only">{value}</span></span>;
}

export function ChestReward({ xp }: { xp: number }) {
  return <div className="relative flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 p-5">
    <div className="relative isolate flex h-20 w-24 items-center justify-center">
      <span aria-hidden="true" className="chest-glow pointer-events-none absolute inset-0 -z-10"/>
      <PackageOpen aria-hidden="true" className="chest-open h-12 w-12 text-primary"/>
      <span aria-hidden="true" className="game-coins pointer-events-none absolute inset-0">{Array.from({ length: 10 }, (_, i) => <Coins key={i} className="game-coin absolute left-1/2 top-1/2 h-4 w-4 text-warning-foreground"/>)}</span>
    </div>
    <h3 className="mt-2 font-semibold">Baú diário aberto</h3><p className="mt-1 text-sm text-primary">+<CountUp value={xp}/> XP recebidos</p>
  </div>;
}

export function ComboBadge({ combo }: { combo: number }) {
  const [visible, setVisible] = useState(combo);
  useEffect(() => {
    if (combo >= 2) { setVisible(combo); return; }
    const timer = setTimeout(() => setVisible(0), 220);
    return () => clearTimeout(timer);
  }, [combo]);
  if (visible < 2 && combo < 2) return null;
  const shown = combo >= 2 ? combo : visible;
  return <span key={shown} className={`combo-badge inline-flex items-center gap-1 rounded-full border border-warning/50 bg-warning/15 px-2.5 py-1 text-sm font-semibold text-warning-foreground ${combo < 2 ? 'combo-out' : 'game-pop'} ${shown >= 5 ? 'combo-hot' : shown >= 3 ? 'combo-warm' : ''}`}><Flame aria-hidden="true" className="game-flame h-4 w-4"/>Combo x{shown}</span>;
}

export function BossEntrance() {
  return <div className="boss-entrance pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-3 rounded-t-lg py-5 font-display text-xl font-bold text-foreground" aria-hidden="true"><Swords className="h-7 w-7"/>CHEFE FINAL</div>;
}

export function AnswerBurst() {
  return <span aria-hidden="true" className="pointer-events-none absolute right-5 top-1/2">{Array.from({ length: 8 }, (_, i) => <i key={i} className="clean-particle"/>)}</span>;
}

/** A native progress element preserves readable values, with a decorative fill over it. */
export function AnimatedProgress({ value, max, label, className = '' }: { value: number; max: number; label: string; className?: string }) {
  const fill = max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
  return <span className={`relative block overflow-hidden rounded-full bg-secondary ${className}`}>
    <progress className="sr-only" aria-label={label} value={value} max={max}/>
    <span aria-hidden="true" className="game-fill absolute inset-y-0 left-0 overflow-hidden rounded-full bg-primary" style={{ width: `${fill}%` }}><span className="game-shine pointer-events-none absolute inset-0" key={value}/></span>
  </span>;
}