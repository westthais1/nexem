/**
 * Progresso contínuo de proficiência por área (tabela public.nexem_user_progress).
 * Guarda os "thetas" de cada trilha para que o Desafio Diário continue de onde parou.
 */

import { questionsSupabase } from "@/lib/external-supabase";

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
  streakCounter: number;
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
    streakCounter: 0,
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

type Row = {
  user_id: string;
  theta_matematica: number | null;
  theta_linguagens: number | null;
  theta_humanas: number | null;
  theta_natureza: number | null;
  streak_counter: number | null;
  last_played_date: string | null;
  tri_consistency_rate: number | null;
};

function rowToProgress(row: Row): UserProgress {
  return {
    tracks: {
      matematica: clampTheta(Number(row.theta_matematica) || DEFAULT_TRACK_THETA),
      linguagens: clampTheta(Number(row.theta_linguagens) || DEFAULT_TRACK_THETA),
      humanas: clampTheta(Number(row.theta_humanas) || DEFAULT_TRACK_THETA),
      natureza: clampTheta(Number(row.theta_natureza) || DEFAULT_TRACK_THETA),
    },
    streakCounter: Number(row.streak_counter) || 0,
    lastPlayedDate: row.last_played_date,
    triConsistencyRate: Number(row.tri_consistency_rate ?? 100),
  };
}

/** Lê a linha do estudante; cria uma com os valores padrão quando ainda não existe. */
export async function fetchProgress(): Promise<UserProgress> {
  const userId = deviceUserId();
  const { data, error } = await questionsSupabase
    .from("nexem_user_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Erro ao carregar seu progresso: ${error.message}`);

  if (!data) {
    const base = defaultProgress();
    await questionsSupabase.from("nexem_user_progress").insert({
      user_id: userId,
      theta_matematica: base.tracks.matematica,
      theta_linguagens: base.tracks.linguagens,
      theta_humanas: base.tracks.humanas,
      theta_natureza: base.tracks.natureza,
      streak_counter: 0,
      tri_consistency_rate: 100,
    });
    cacheProgress(base);
    return base;
  }

  const progress = rowToProgress(data as Row);
  cacheProgress(progress);
  return progress;
}

/** Grava os novos níveis de proficiência para o desafio de amanhã. */
export async function saveProgress(next: UserProgress): Promise<void> {
  const userId = deviceUserId();
  const { error } = await questionsSupabase.from("nexem_user_progress").upsert(
    {
      user_id: userId,
      theta_matematica: next.tracks.matematica,
      theta_linguagens: next.tracks.linguagens,
      theta_humanas: next.tracks.humanas,
      theta_natureza: next.tracks.natureza,
      streak_counter: next.streakCounter,
      last_played_date: next.lastPlayedDate,
      tri_consistency_rate: next.triConsistencyRate,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Erro ao salvar seu progresso: ${error.message}`);
  cacheProgress(next);
}
