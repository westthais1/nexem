/**
 * Progresso contínuo de proficiência por área (tabela public.student_area_progress, na conta do estudante).
 * Guarda os "thetas" de cada trilha para que o Desafio Diário continue de onde parou.
 */

import { ensureAreaProgress } from "./area-progress.functions";
import { recordActivity } from "./activity.functions";

export const MASTERY_TARGET = 85;
export const DEFAULT_TRACK_THETA = 50;

export const TRACKS = ["matematica", "linguagens", "humanas", "natureza"] as const;
export type TrackKey = (typeof TRACKS)[number];

export type Tracks = Record<TrackKey, number>;

export const TRACK_LABEL: Record<TrackKey, string> = {
  matematica: "Matemática",
  linguagens: "Linguagens",
  humanas: "Ciências Humanas",
  natureza: "Ciências da Natureza",
};

export type UserProgress = {
  tracks: Tracks;
  lastPlayedDate: string | null;
  triConsistencyRate: number;
};

const USER_KEY = "nexem-user-id";
const CACHE_KEY = "nexem-progress-v1";
export const PROGRESS_EVENT = "nexem-progress-change";

export function clampTheta(v: number): number {
  return Math.min(100, Math.max(1, Math.round(v)));
}

export function defaultTracks(): Tracks {
  return {
    matematica: DEFAULT_TRACK_THETA,
    linguagens: DEFAULT_TRACK_THETA,
    humanas: DEFAULT_TRACK_THETA,
    natureza: DEFAULT_TRACK_THETA,
  };
}

export function defaultProgress(): UserProgress {
  return {
    tracks: defaultTracks(),
    lastPlayedDate: null,
    triConsistencyRate: 100,
  };
}

/** Identificador estável do estudante neste navegador (ainda não há login). */
export function deviceUserId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = window.localStorage.getItem(USER_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(USER_KEY, id);
  }
  return id;
}

/**
 * Após o login: passa a usar o id da conta como identificador e garante que
 * exista uma linha de proficiência para o estudante.
 * Retorna true quando a linha acabou de ser criada (estudante novo).
 */
export async function ensureProgressForUser(userId: string): Promise<boolean> {
  if (typeof window !== "undefined") window.localStorage.setItem(USER_KEY, userId);
  const res = await ensureAreaProgress();
  return res.created;
}

/** Área do banco -> trilha. */
export function trackOf(area: string | null | undefined): TrackKey | null {
  const a = (area ?? "").toLowerCase();
  if (a.includes("matem")) return "matematica";
  if (a.includes("linguagens")) return "linguagens";
  if (a.includes("humanas")) return "humanas";
  if (a.includes("natureza")) return "natureza";
  return null;
}

export function averageTheta(tracks: Tracks): number {
  return clampTheta(TRACKS.reduce((s, k) => s + tracks[k], 0) / TRACKS.length);
}

export function readCachedProgress(): UserProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserProgress;
    return { ...defaultProgress(), ...p, tracks: { ...defaultTracks(), ...p.tracks } };
  } catch {
    return null;
  }
}

function cacheProgress(p: UserProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent<UserProgress>(PROGRESS_EVENT, { detail: p }));
}

/** Lê os níveis por área salvos na conta (cria a linha na primeira vez). */
export async function fetchProgress(): Promise<UserProgress> {
  const res = await ensureAreaProgress();
  const progress: UserProgress = {
    tracks: res.tracks,
    lastPlayedDate: res.lastPlayedDate,
    triConsistencyRate: res.triConsistencyRate,
  };
  cacheProgress(progress);
  return progress;
}

/** Grava os novos níveis por área (via registro único de atividades). */
export async function saveProgress(next: UserProgress): Promise<void> {
  await recordActivity({ data: { kind: "blocoMaestria", xp: 0, progress: next } });
  cacheProgress(next);
}

/** Atualiza o cache local quando outra parte do app já salvou o progresso. */
export function setCachedProgress(next: UserProgress) {
  cacheProgress(next);
}
