import { useEffect, useState } from "react";

import { XP_EVENT, levelInfo, readXpState, stageForLevel, type XpState } from "@/lib/xp";

const EMPTY: XpState = { totalXp: 0, streak: 0, lastActiveDay: null, lastActivity: null };

/** Estado de XP reativo — atualiza em qualquer tela assim que uma atividade é concluída. */
export function useXp() {
  const [state, setState] = useState<XpState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readXpState());
    setHydrated(true);
    const onChange = (e: Event) => setState((e as CustomEvent<XpState>).detail);
    const onStorage = () => setState(readXpState());
    window.addEventListener(XP_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(XP_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const info = levelInfo(state.totalXp);
  return { ...state, ...info, stage: stageForLevel(info.level), hydrated };
}
