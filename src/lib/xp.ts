/**
 * Sistema de XP e evolução do mascote (raposa).
 * Estado local do navegador — atualiza instantaneamente em toda a interface.
 */

export const XP_REWARDS = {
  questao: 10,
  simuladoAdaptativo: 25,
  redacao: 50,
  provaCompleta: 100,
} as const;

export type XpSource = keyof typeof XP_REWARDS;

export const XP_LABELS: Record<XpSource, string> = {
  questao: "Questão respondida",
  simuladoAdaptativo: "Simulado Adaptativo",
  redacao: "Redação corrigida",
  provaCompleta: "Prova Completa",
};

const STORAGE_KEY = "nexem-xp-v1";
export const XP_EVENT = "nexem-xp-change";
export const XP_GAIN_EVENT = "nexem-xp-gain";

export type XpState = {
  totalXp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  lastActivity: string | null;
  /** Dias (YYYY-MM-DD) em que houve atividade — usado no calendário da sequência. */
  history: string[];
};

export type XpGainDetail = {
  amount: number;
  label: string;
  leveledUp: boolean;
  evolved: boolean;
  level: number;
  stageName: string;
};

export const EMPTY_XP: XpState = {
  totalXp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  lastActivity: null,
  history: [],
};
const EMPTY = EMPTY_XP;

/** XP necessário para sair do nível informado. */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export type LevelInfo = {
  level: number;
  xpNoNivel: number;
  xpParaProximo: number;
  progresso: number; // 0..1
};

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let restante = Math.max(0, totalXp);
  while (restante >= xpForLevel(level)) {
    restante -= xpForLevel(level);
    level += 1;
  }
  const xpParaProximo = xpForLevel(level);
  return {
    level,
    xpNoNivel: restante,
    xpParaProximo,
    progresso: xpParaProximo > 0 ? restante / xpParaProximo : 0,
  };
}

export type FoxStage = {
  id: 1 | 2 | 3 | 4;
  name: string;
  title: string;
  minLevel: number;
};

export const FOX_STAGES: FoxStage[] = [
  { id: 1, name: "Raposinha", title: "Filhote curioso", minLevel: 1 },
  { id: 2, name: "Raposa Jovem", title: "Pegando o ritmo", minLevel: 3 },
  { id: 3, name: "Raposa Aventureira", title: "Domina a estratégia", minLevel: 6 },
  { id: 4, name: "Raposa Anciã", title: "Sábia do ENEM", minLevel: 10 },
];

export function stageForLevel(level: number): FoxStage {
  let stage = FOX_STAGES[0]!;
  for (const s of FOX_STAGES) if (level >= s.minLevel) stage = s;
  return stage;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function readXpState(): XpState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<XpState>;
    return {
      totalXp: Number(parsed.totalXp) || 0,
      streak: Number(parsed.streak) || 0,
      lastActiveDay: parsed.lastActiveDay ?? null,
      lastActivity: parsed.lastActivity ?? null,
    };
  } catch {
    return EMPTY;
  }
}

function writeXpState(state: XpState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<XpState>(XP_EVENT, { detail: state }));
}

/** Credita XP por uma atividade concluída e dispara os eventos de celebração. */
export function awardXp(source: XpSource, options?: { amount?: number; label?: string }) {
  if (typeof window === "undefined") return;
  const amount = Math.max(0, Math.round(options?.amount ?? XP_REWARDS[source]));
  if (amount === 0) return;

  const before = readXpState();
  const antes = levelInfo(before.totalXp);
  const stageAntes = stageForLevel(antes.level);

  const day = today();
  let streak = before.streak;
  if (before.lastActiveDay !== day) {
    streak = before.lastActiveDay === yesterday() ? before.streak + 1 : 1;
  }
  if (streak === 0) streak = 1;

  const label = options?.label ?? XP_LABELS[source];
  const next: XpState = {
    totalXp: before.totalXp + amount,
    streak,
    lastActiveDay: day,
    lastActivity: label,
  };
  writeXpState(next);

  const depois = levelInfo(next.totalXp);
  const stageDepois = stageForLevel(depois.level);
  const detail: XpGainDetail = {
    amount,
    label,
    leveledUp: depois.level > antes.level,
    evolved: stageDepois.id !== stageAntes.id,
    level: depois.level,
    stageName: stageDepois.name,
  };
  window.dispatchEvent(new CustomEvent<XpGainDetail>(XP_GAIN_EVENT, { detail }));
}

export function foxMessage(state: XpState, level: number): string {
  if (state.totalXp === 0) return "Oi! Responda uma questão e eu começo a crescer com você.";
  if (state.streak >= 7) return `${state.streak} dias seguidos! Você está imparável — eu evoluí junto.`;
  if (state.streak >= 3) return `${state.streak} dias de sequência. Mantenha o ritmo e chegamos no nível ${level + 1}!`;
  if (state.lastActivity) return `Boa! "${state.lastActivity}" concluída. Bora buscar mais XP hoje?`;
  return "Que bom te ver de novo. Vamos treinar um pouco?";
}
