/**
 * Desafio Diário Nexem — sessão travada de 10 questões por dia.
 * Estado local do navegador (mesma abordagem do sistema de XP).
 */

import { questionsSupabase } from "@/lib/external-supabase";
import {
  TRACKS,
  clampTheta as clampTrack,
  defaultTracks,
  trackOf,
  type TrackKey,
  type Tracks,
} from "@/lib/progress";

export const DAILY_TOTAL = 10;
const THETA_KEY = "nexem-theta-v1";
const SESSION_KEY = "nexem-daily-v1";
export const DAILY_EVENT = "nexem-daily-change";
export const DEFAULT_THETA = 50;

export type DailyQuestion = {
  id: number | string;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
  resposta_correta: string;
  area_conhecimento: string | null;
  materia: string | null;
  dificuldade: number | null;
  explicacao: string | null;
  imagem_url: string | null;
};

export type DailyAnswer = {
  questionId: string;
  letra: string;
  correto: boolean;
  dificuldade: number;
  /** Trilha (área) da questão, para calibrar o theta certo. */
  track?: TrackKey | null;
};

export type DailySession = {
  date: string;
  theta: number;
  /** Níveis por trilha no início da sessão (âncora vinda do banco). */
  thetas?: Tracks;
  questionIds: string[];
  answers: DailyAnswer[];
  completed: boolean;
  /** XP creditado ao concluir (evita crédito duplicado). */
  rewarded: boolean;
  /** Progresso já gravado no banco ao final da sessão. */
  saved?: boolean;
};

const COLUMNS =
  "id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,area_conhecimento,materia,dificuldade,explicacao,imagem_url";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clampTheta(v: number): number {
  return Math.min(100, Math.max(1, Math.round(v)));
}

/** Nível de proficiência (theta) guardado do estudante. */
export function readTheta(): number {
  if (typeof window === "undefined") return DEFAULT_THETA;
  const raw = Number(window.localStorage.getItem(THETA_KEY));
  return Number.isFinite(raw) && raw > 0 ? clampTheta(raw) : DEFAULT_THETA;
}

export function writeTheta(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THETA_KEY, String(clampTheta(value)));
}

export function readSession(): DailySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySession;
    if (parsed?.date !== todayKey()) return null;
    return {
      date: parsed.date,
      theta: clampTheta(Number(parsed.theta) || DEFAULT_THETA),
      questionIds: Array.isArray(parsed.questionIds) ? parsed.questionIds.map(String) : [],
      answers: Array.isArray(parsed.answers) ? parsed.answers : [],
      thetas: parsed.thetas ? { ...defaultTracks(), ...parsed.thetas } : undefined,
      completed: Boolean(parsed.completed),
      rewarded: Boolean(parsed.rewarded),
      saved: Boolean(parsed.saved),
    };
  } catch {
    return null;
  }
}

export function writeSession(session: DailySession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent<DailySession>(DAILY_EVENT, { detail: session }));
}

export function diffOf(q: DailyQuestion, fallback = DEFAULT_THETA): number {
  const d = Number(q.dificuldade);
  return Number.isFinite(d) && d > 0 ? clampTheta(d) : fallback;
}

export async function fetchDailyPool(): Promise<DailyQuestion[]> {
  const { data, error } = await questionsSupabase.from("enem_provas").select(COLUMNS);
  if (error) throw new Error(`Erro ao carregar as questões do desafio: ${error.message}`);
  return (data ?? []) as DailyQuestion[];
}

/** Alvos da sessão: 2 aquecimento (θ−15), 6 no nível (θ) e 2 desafio final (θ+15). */
export function dailyTargets(theta: number): number[] {
  const warm = clampTheta(theta - 15);
  const real = clampTheta(theta);
  const boss = clampTheta(theta + 15);
  return [warm, warm, real, real, real, real, real, real, boss, boss];
}

export type Phase = "Aquecimento" | "Seu nível" | "Chefe final";

export function phaseOf(index: number): Phase {
  if (index < 2) return "Aquecimento";
  if (index < 8) return "Seu nível";
  return "Chefe final";
}

/**
 * Monta a sessão do dia: para cada alvo, escolhe a questão mais próxima em
 * dificuldade, alternando as áreas para garantir mistura de matérias.
 */
export function buildDailySet(pool: DailyQuestion[], theta: number): DailyQuestion[] {
  const targets = dailyTargets(theta);
  const used = new Set<string>();
  const picked: DailyQuestion[] = [];
  const areas = [...new Set(pool.map((q) => q.area_conhecimento?.trim() || "Sem área"))];

  targets.forEach((target, i) => {
    const areaPreferida = areas.length > 0 ? areas[i % areas.length] : null;
    const candidatos = pool.filter((q) => !used.has(String(q.id)));
    if (candidatos.length === 0) return;
    const daArea = candidatos.filter(
      (q) => (q.area_conhecimento?.trim() || "Sem área") === areaPreferida,
    );
    const lista = daArea.length > 0 ? daArea : candidatos;
    const escolhida = lista.reduce((melhor, q) =>
      Math.abs(diffOf(q) - target) < Math.abs(diffOf(melhor) - target) ? q : melhor,
    );
    used.add(String(escolhida.id));
    picked.push(escolhida);
  });

  return picked;
}

export type DailyResult = {
  acertos: number;
  total: number;
  pontos: number;
  pontosPossiveis: number;
  nota: number;
  /** true quando NÃO houve padrão de chute (difícil certo + fácil errado). */
  consistente: boolean;
  acertosAvancados: number;
  errosBasicos: number;
  novoTheta: number;
};

/** Avaliação final com a mesma lógica TRI usada no simulado adaptativo. */
export function gradeDaily(answers: DailyAnswer[], theta: number): DailyResult {
  const acertosAvancados = answers.filter((a) => a.correto && a.dificuldade > 75).length;
  const errosBasicos = answers.filter((a) => !a.correto && a.dificuldade < 40).length;
  const erratico = acertosAvancados > 0 && errosBasicos > 0;

  let pontos = 0;
  let pontosPossiveis = 0;
  for (const a of answers) {
    pontosPossiveis += a.dificuldade;
    if (!a.correto) continue;
    pontos += erratico && a.dificuldade > 75 ? a.dificuldade * 0.6 : a.dificuldade;
  }

  const acertos = answers.filter((a) => a.correto).length;
  const taxa = answers.length > 0 ? acertos / answers.length : 0;
  const novoTheta = clampTheta(theta + Math.round((taxa - 0.6) * 20));

  return {
    acertos,
    total: answers.length,
    pontos: Math.round(pontos),
    pontosPossiveis: Math.round(pontosPossiveis),
    nota: pontosPossiveis > 0 ? Math.round((pontos / pontosPossiveis) * 1000) : 0,
    consistente: !erratico,
    acertosAvancados,
    errosBasicos,
    novoTheta,
  };
}
