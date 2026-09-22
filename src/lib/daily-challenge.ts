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
      ...(parsed.thetas ? { thetas: { ...defaultTracks(), ...parsed.thetas } } : {}),
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

/** Banco unificado de questões: só buscamos linhas desta prova. */
export const BANCO_GERAL = "Banco Geral Nexem";

export async function fetchDailyPool(): Promise<DailyQuestion[]> {
  const { data, error } = await questionsSupabase
    .from("enem_provas")
    .select(COLUMNS)
    .eq("nome_prova", BANCO_GERAL);
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

/** Deslocamento por posição: aquecimento (−15), nível real (0) e chefe final (+15). */
export function offsetOf(index: number): number {
  if (index < 2) return -15;
  if (index < 8) return 0;
  return 15;
}

/**
 * Monta a sessão do dia usando o nível salvo de CADA trilha como âncora:
 * alterna as quatro áreas e busca a questão mais próxima do alvo daquela trilha.
 */
export function buildDailySetFromTracks(pool: DailyQuestion[], tracks: Tracks): DailyQuestion[] {
  const used = new Set<string>();
  const picked: DailyQuestion[] = [];

  for (let i = 0; i < DAILY_TOTAL; i += 1) {
    const trilha = TRACKS[i % TRACKS.length] as TrackKey;
    const alvo = clampTrack((tracks[trilha] ?? DEFAULT_THETA) + offsetOf(i));
    const candidatos = pool.filter((q) => !used.has(String(q.id)));
    if (candidatos.length === 0) break;
    const daTrilha = candidatos.filter((q) => trackOf(q.area_conhecimento) === trilha);
    const lista = daTrilha.length > 0 ? daTrilha : candidatos;
    const escolhida = lista.reduce((melhor, q) =>
      Math.abs(diffOf(q, alvo) - alvo) < Math.abs(diffOf(melhor, alvo) - alvo) ? q : melhor,
    );
    used.add(String(escolhida.id));
    picked.push(escolhida);
  }

  return picked;
}

/**
 * Histórico de questões já respondidas (anti-repetição).
 * Guardado localmente porque o banco ainda não tem a tabela `historico_simulado`.
 */
const HISTORY_KEY = "nexem-historico-simulado-v1";

export function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function pushHistory(ids: Array<string | number>) {
  if (typeof window === "undefined") return;
  const set = new Set([...readHistory(), ...ids.map(String)]);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify([...set]));
}

/**
 * Sessão diária completa: 2 Natureza, 2 Humanas, 2 Linguagens, 2 Matemática
 * (slots 1–2 em θ−15, 3–8 em θ) e 2 coringas globais de alto nível (dificuldade > 75).
 * Questões já respondidas antes (histórico) são excluídas do sorteio.
 */
export function buildProgressiveDailySet(
  pool: DailyQuestion[],
  tracks: Tracks,
  excludedIds: string[] = [],
): DailyQuestion[] {
  const excluded = new Set(excludedIds.map(String));
  let disponiveis = pool.filter((q) => !excluded.has(String(q.id)));
  // Se o histórico já consumiu quase tudo, libera o banco inteiro novamente.
  if (disponiveis.length < DAILY_TOTAL) disponiveis = [...pool];

  const used = new Set<string>();
  const picked: DailyQuestion[] = [];

  const pick = (lista: DailyQuestion[], alvo: number) => {
    const candidatos = lista.filter((q) => !used.has(String(q.id)));
    if (candidatos.length === 0) return null;
    const escolhida = candidatos.reduce((melhor, q) =>
      Math.abs(diffOf(q, alvo) - alvo) < Math.abs(diffOf(melhor, alvo) - alvo) ? q : melhor,
    );
    used.add(String(escolhida.id));
    picked.push(escolhida);
    return escolhida;
  };

  // Slots 1–8: duas questões de cada área (as duas primeiras em modo aquecimento).
  const ordem: TrackKey[] = [
    "natureza",
    "humanas",
    "linguagens",
    "matematica",
    "natureza",
    "humanas",
    "linguagens",
    "matematica",
  ];
  ordem.forEach((trilha, i) => {
    const base = tracks[trilha] ?? DEFAULT_THETA;
    const alvo = clampTrack(base + (i < 2 ? -15 : 0));
    const daTrilha = disponiveis.filter((q) => trackOf(q.area_conhecimento) === trilha);
    pick(daTrilha.length > 0 ? daTrilha : disponiveis, alvo);
  });

  // Slots 9–10: coringas globais de alto nível (dificuldade > 75).
  const mediaBoss = clampTrack(
    TRACKS.reduce((s, t) => s + (tracks[t] ?? DEFAULT_THETA), 0) / TRACKS.length + 15,
  );
  for (let i = 0; i < 2; i += 1) {
    const dificeis = disponiveis.filter((q) => diffOf(q, 0) > 75 && !used.has(String(q.id)));
    pick(dificeis.length > 0 ? dificeis : disponiveis, Math.max(76, mediaBoss));
  }

  return picked;
}

/* ------------------------------------------------------------------ *
 * Anti-repetição persistente (public.historico_desafios)
 * ------------------------------------------------------------------ */

/** Todas as questões que este estudante já respondeu (qualquer dia). */
export async function fetchAnsweredQuestionIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await questionsSupabase
    .from("historico_desafios")
    .select("question_id")
    .eq("user_id", userId);
  if (error) {
    console.error("[Desafio] Falha ao ler o histórico", error.message);
    return [];
  }
  return (data ?? []).map((r: { question_id: number | string }) => String(r.question_id));
}

/** Trava a questão para sempre assim que o estudante a conclui. */
export async function recordAnsweredQuestion(
  userId: string,
  questionId: string | number,
  acertou: boolean,
): Promise<void> {
  if (!userId) return;
  const { error } = await questionsSupabase.from("historico_desafios").insert({
    user_id: userId,
    question_id: Number(questionId),
    acertou,
  });
  if (error) console.error("[Desafio] Falha ao gravar o histórico", error.message);
}

/* ------------------------------------------------------------------ *
 * Seleção progressiva com faixas de dificuldade garantidas
 * ------------------------------------------------------------------ */

const TRACK_PATTERN: Record<TrackKey, string> = {
  matematica: "%Matem%",
  linguagens: "%Linguagens%",
  humanas: "%Humanas%",
  natureza: "%Natureza%",
};

const MIN_BRACKET_ROWS = 3;

function idList(ids: Iterable<string>): string {
  const arr = [...ids].map((v) => Number(v)).filter((n) => Number.isFinite(n));
  return `(${arr.join(",")})`;
}

/** Busca dentro de uma faixa fechada de dificuldade, excluindo o que já foi visto. */
async function queryBracket(
  target: number,
  width: number,
  excluded: Set<string>,
  track: TrackKey | null,
): Promise<DailyQuestion[]> {
  let q = questionsSupabase
    .from("enem_provas")
    .select(COLUMNS)
    .eq("nome_prova", BANCO_GERAL)
    .gte("dificuldade", clampTheta(target - width))
    .lte("dificuldade", clampTheta(target + width));

  if (track) q = q.ilike("area_conhecimento", TRACK_PATTERN[track]);
  if (excluded.size > 0) q = q.not("id", "in", idList(excluded));

  const { data, error } = await q.limit(80);
  if (error) {
    console.error("[Desafio] Falha na busca por faixa", error.message);
    return [];
  }
  return (data ?? []) as DailyQuestion[];
}

/** Sorteio global de segurança quando nem a faixa larga tem questões. */
async function queryGlobal(excluded: Set<string>, track: TrackKey | null) {
  let q = questionsSupabase.from("enem_provas").select(COLUMNS).eq("nome_prova", BANCO_GERAL);
  if (track) q = q.ilike("area_conhecimento", TRACK_PATTERN[track]);
  if (excluded.size > 0) q = q.not("id", "in", idList(excluded));
  const { data } = await q.limit(80);
  return (data ?? []) as DailyQuestion[];
}

function randomOf<T>(list: T[]): T | null {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}

/**
 * Escolhe UMA questão para o slot: faixa ±5 → se tiver menos de 3 opções,
 * abre para ±15 → só então cai no sorteio global.
 */
async function pickForTarget(
  target: number,
  excluded: Set<string>,
  track: TrackKey | null,
): Promise<DailyQuestion | null> {
  const estreita = await queryBracket(target, 5, excluded, track);
  if (estreita.length >= MIN_BRACKET_ROWS) return randomOf(estreita);

  const larga = await queryBracket(target, 15, excluded, track);
  if (larga.length >= MIN_BRACKET_ROWS) return randomOf(larga);
  if (estreita.length > 0) return randomOf(estreita);
  if (larga.length > 0) return randomOf(larga);

  const global = await queryGlobal(excluded, track);
  if (global.length > 0) {
    return global.reduce((melhor, q) =>
      Math.abs(diffOf(q, target) - target) < Math.abs(diffOf(melhor, target) - target) ? q : melhor,
    );
  }
  // Sem a trilha: tenta qualquer área.
  if (track) return pickForTarget(target, excluded, null);
  return null;
}

/** Alvo de dificuldade de cada slot: 1–2 θ−15, 3–8 θ, 9–10 θ+15. */
export function slotTarget(index: number, tracks: Tracks, track: TrackKey | null): number {
  const base =
    track != null
      ? (tracks[track] ?? DEFAULT_THETA)
      : TRACKS.reduce((s, t) => s + (tracks[t] ?? DEFAULT_THETA), 0) / TRACKS.length;
  return clampTrack(base + offsetOf(index));
}

const SLOT_TRACKS: Array<TrackKey | null> = [
  "natureza",
  "humanas",
  "linguagens",
  "matematica",
  "natureza",
  "humanas",
  "linguagens",
  "matematica",
  null,
  null,
];

/**
 * Monta as 10 questões do dia direto no banco: nenhuma questão já respondida
 * volta, e cada slot respeita a faixa de dificuldade do seu estágio.
 */
export async function buildDailySetFromDb(
  tracks: Tracks,
  answeredIds: string[],
): Promise<DailyQuestion[]> {
  const bloqueadas = new Set(answeredIds.map(String));
  const escolhidas: DailyQuestion[] = [];

  for (let i = 0; i < DAILY_TOTAL; i += 1) {
    const track = SLOT_TRACKS[i] ?? null;
    const alvo = slotTarget(i, tracks, track);
    const q = await pickForTarget(alvo, bloqueadas, track);
    if (!q) continue;
    bloqueadas.add(String(q.id));
    escolhidas.push(q);
  }

  return escolhidas;
}

/** Precisão das últimas 5 respostas (janela móvel). */
export function rollingAccuracy(answers: DailyAnswer[]): number {
  const janela = answers.slice(-5);
  if (janela.length === 0) return 0.6;
  return janela.filter((a) => a.correto).length / janela.length;
}

/**
 * Calibração contínua com janela móvel de 5 respostas:
 * acerto consistente +12, acerto isolado +6, erro consistente −6, erro em série −12.
 */
export function applyVelocity(tracks: Tracks, answers: DailyAnswer[]): Tracks {
  const next: Tracks = { ...tracks };
  answers.forEach((a, i) => {
    const trilha = a.track;
    if (!trilha) return;
    const acc = rollingAccuracy(answers.slice(0, i + 1));
    const delta = a.correto ? (acc >= 0.6 ? 12 : 6) : acc < 0.4 ? -12 : -6;
    next[trilha] = clampTrack(next[trilha] + delta);
  });
  return next;
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
