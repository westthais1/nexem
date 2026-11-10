/**
 * Sistema de XP e evolução do mascote (raposa).
 * Fonte da verdade: registro do estudante na conta (student_xp + study_activity_days).
 * O navegador guarda só um cache para a barra do topo aparecer na hora.
 */
import { getXpState, recordActivity, type XpSnapshot } from "./activity.functions";
import { supabase } from "@/integrations/supabase/client";
import type { UserProgress } from "./progress";

export const XP_REWARDS = {
  questao: 10,
  simuladoAdaptativo: 25,
  redacao: 50,
  desafioDiario: 75,
  provaCompleta: 100,
  materialEtapa: 30,
  blocoMaestria: 0,
} as const;

export type XpSource = keyof typeof XP_REWARDS;

export const XP_LABELS: Record<XpSource, string> = {
  questao: "Questão respondida",
  simuladoAdaptativo: "Simulado Adaptativo",
  redacao: "Redação corrigida",
  desafioDiario: "Desafio Diário Nexem",
  provaCompleta: "Prova Completa",
  materialEtapa: "Etapa da trilha do material",
  blocoMaestria: "Bloco do Treine com Tutor Nex",
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
  /** Conta dona deste cache (null = cache antigo, anterior ao salvamento na conta). */
  owner?: string | null;
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
  let stage: FoxStage = { id:1, name:'Raposinha', title:'Filhote curioso', minLevel:1 };
  for (const s of FOX_STAGES) if (level >= s.minLevel) stage = s;
  return stage;
}

/** Dia no fuso de São Paulo (o mesmo usado pelo banco). */
export function spDayKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
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
      bestStreak: Number(parsed.bestStreak) || Number(parsed.streak) || 0,
      lastActiveDay: parsed.lastActiveDay ?? null,
      lastActivity: parsed.lastActivity ?? null,
      history: Array.isArray(parsed.history) ? parsed.history.slice(-60) : [],
      owner: typeof parsed.owner === "string" ? parsed.owner : null,
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

function fromSnapshot(snap: XpSnapshot): XpState {
  return {
    totalXp: snap.totalXp,
    streak: snap.streak,
    bestStreak: snap.bestStreak,
    lastActiveDay: snap.lastActiveDay,
    lastActivity: snap.lastActivity,
    history: snap.history,
    owner: snap.userId,
  };
}

let syncedFor: string | null = null;
let syncing: Promise<void> | null = null;

/** Busca o XP salvo na conta; na primeira vez importa o cache antigo do navegador. */
export function syncXpFromAccount(force = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      if (!uid) return;
      if (!force && syncedFor === uid) return;
      const snap = await getXpState({ data: {} });
      syncedFor = uid;
      writeXpState(fromSnapshot(snap));
    } catch (e) {
      console.warn("[XP] Não foi possível sincronizar com a conta", e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

export type ActivityAttempt = {
  question_id: string;
  dificuldade_questao?: string | null;
  materia_questao?: string | null;
  foi_correto: boolean;
  letra?: 'A' | 'B' | 'C' | 'D' | 'E';
};

/**
 * Registra uma atividade concluída na conta (evento, XP, dia de estudo e progresso por área).
 * A barra do topo é atualizada na hora e depois confirmada com o valor salvo.
 */
export async function awardXp(
  source: XpSource,
  options?: { amount?: number; label?: string; subject?: string; attempts?: ActivityAttempt[]; progress?: UserProgress },
): Promise<void> {
  if (typeof window === "undefined") return;
  const amount = Math.max(0, Math.round(options?.amount ?? XP_REWARDS[source]));
  const label = options?.label ?? XP_LABELS[source];

  const before = readXpState();
  try {
    const snap = await recordActivity({
      data: {
        kind: source,
        xp: amount,
        label,
        ...(options?.subject ? { subject: options.subject } : {}),
        ...(options?.attempts?.length ? { attempts: options.attempts } : {}),
        ...(options?.progress ? { progress: options.progress } : {}),
      },
    });
    writeXpState(fromSnapshot(snap));
    const gained = Math.max(0,snap.totalXp-before.totalXp);
    if (gained > 0) {
      const previous = levelInfo(before.totalXp);
      const next = levelInfo(snap.totalXp);
      window.dispatchEvent(new CustomEvent<XpGainDetail>(XP_GAIN_EVENT,{detail:{amount:gained,label,leveledUp:next.level>previous.level,evolved:stageForLevel(next.level).id!==stageForLevel(previous.level).id,level:next.level,stageName:stageForLevel(next.level).name}}));
    }
  } catch (e) {
    console.error("[XP] Falha ao salvar atividade na conta", e);
    void syncXpFromAccount(true);
  }
}

export function foxMessage(state: XpState, level: number): string {
  if (state.totalXp === 0) return "Oi! Responda uma questão e eu começo a crescer com você.";
  if (state.streak >= 7) return `${state.streak} dias seguidos! Você está imparável — eu evoluí junto.`;
  if (state.streak >= 3) return `${state.streak} dias de sequência. Mantenha o ritmo e chegamos no nível ${level + 1}!`;
  if (state.lastActivity) return `Boa! "${state.lastActivity}" concluída. Bora buscar mais XP hoje?`;
  return "Que bom te ver de novo. Vamos treinar um pouco?";
}

/** Últimos N dias (mais antigo → hoje) com marcação de atividade. */
export function lastDays(history: string[], n = 7): { day: string; label: string; active: boolean }[] {
  const set = new Set(history);
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const out: { day: string; label: string; active: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = spDayKey(new Date(Date.now() - i * 86_400_000));
    const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
    out.push({ day: key, label: labels[weekday] ?? "", active: set.has(key) });
  }
  return out;
}
