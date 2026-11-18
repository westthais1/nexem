import { useEffect, useState } from 'react';

/** Presentation only: the committed value remains the source of truth. */
export function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); setDisplay(value); };
    if (preference.matches) { setDisplay(value); return; }
    const start = performance.now();
    setDisplay(0);
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - start) / Math.min(duration, 1500));
      setDisplay(Math.round(value * (1 - (1 - fraction) ** 3)));
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    preference.addEventListener('change', finish);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', finish); };
  }, [value, duration]);
  return display;
}