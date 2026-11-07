/**
 * Níveis de Maestria — treino estruturado por matéria (separado do Desafio Diário).
 * 15 trilhas de matéria, cada uma com 3 níveis sequenciais e faixas fixas de dificuldade.
 */

import { TRACKS, clampTheta, type TrackKey, type Tracks } from "@/lib/progress";

export type Subject = {
  slug: string;
  label: string;
  track: TrackKey;
  /** Palavras-chave para casar com a coluna `materia` do banco. */
  match: string[];
};

export const SUBJECTS: Subject[] = [
  { slug: "mat-numerica", label: "Matemática Numérica", track: "matematica", match: ["numéric", "numeric", "aritmét", "porcentagem", "razão", "proporc"] },
  { slug: "mat-algebrica", label: "Matemática Algébrica", track: "matematica", match: ["algébric", "algebric", "álgebra", "algebra", "função", "funcao", "funções", "equac", "equaç"] },
  { slug: "mat-geometrica", label: "Matemática Geométrica", track: "matematica", match: ["geométric", "geometric", "geometria"] },
  { slug: "mat-metrica", label: "Matemática Métrica", track: "matematica", match: ["métric", "metric", "escala", "unidade"] },
  { slug: "mat-estatistica", label: "Matemática Estatística", track: "matematica", match: ["estatíst", "estatist", "análise de dados", "conjuntos"] },
  { slug: "mat-combinatoria", label: "Matemática Combinatória", track: "matematica", match: ["combinat"] },
  { slug: "mat-probabilistica", label: "Matemática Probabilística", track: "matematica", match: ["probabil"] },
  { slug: "biologia", label: "Biologia", track: "natureza", match: ["biolog", "ecolog", "genétic", "fotossín", "fotossin"] },
  { slug: "fisica", label: "Física", track: "natureza", match: ["físic", "fisic", "cinemát", "dinâmic", "termodin", "eletrodin", "energia elétrica", "calor"] },
  { slug: "quimica", label: "Química", track: "natureza", match: ["químic", "quimic", "reaç", "soluç", "tratamento de água"] },
  { slug: "historia", label: "História", track: "humanas", match: ["históri", "histori", "vargas", "império", "descoloniz", "industrializ"] },
  { slug: "geografia", label: "Geografia", track: "humanas", match: ["geograf", "urbaniz", "população", "segregaç"] },
  { slug: "sociologia", label: "Sociologia", track: "humanas", match: ["sociolog", "antropolog", "durkheim", "sociedade"] },
  { slug: "filosofia", label: "Filosofia", track: "humanas", match: ["filosof", "ética", "etica", "kant", "racionalismo"] },
  { slug: "portugues", label: "Língua Portuguesa", track: "linguagens", match: ["gramátic", "gramatic", "interpretaç", "texto", "literatur", "linguagem", "linguíst", "variação", "coesiv", "gênero", "poesia", "leitura"] },
];

export const SUBJECT_BY_SLUG = new Map(SUBJECTS.map((s) => [s.slug, s]));

export type LevelId = 1 | 2 | 3;

export type MasteryLevel = {
  id: LevelId;
  label: string;
  descricao: string;
  min: number;
  max: number;
  /** Proficiência mínima na trilha para destravar o nível. */
  requisito: number;
};

export const LEVELS: MasteryLevel[] = [
  {
    id: 1,
    label: "Nível 1: Fundações",
    descricao: "Conceitos-base e leitura de enunciado. Dificuldade 20 a 40.",
    min: 20,
    max: 40,
    requisito: 0,
  },
  {
    id: 2,
    label: "Nível 2: Aprofundamento",
    descricao: "Aplicação em contexto e pegadinhas clássicas. Dificuldade 41 a 65.",
    min: 41,
    max: 65,
    requisito: 45,
  },
  {
    id: 3,
    label: "Nível 3: Domínio Avançado",
    descricao: "Questões de alto peso na TRI. Dificuldade 66 a 95.",
    min: 66,
    max: 95,
    requisito: 66,
  },
];

export const BLOCK_SIZE = 5;

function normalize(v: string | null | undefined): string {
  return (v ?? "").toLowerCase();
}

/** Descobre a matéria de uma questão a partir de `materia` (e da área como reserva). */
export function subjectOf(materia: string | null, area: string | null): Subject | null {
  const bySlug = materia ? SUBJECT_BY_SLUG.get(materia) : undefined;
  if (bySlug) return bySlug;
  const m = normalize(materia);
  if (m) {
    const hit = SUBJECTS.find((s) => s.match.some((k) => m.includes(k)));
    if (hit) return hit;
  }
  const a = normalize(area);
  if (m.includes("matem") || a.includes("matem")) return SUBJECT_BY_SLUG.get("mat-algebrica") ?? null;
  return null;
}

export function unlocked(level: MasteryLevel, theta: number): boolean {
  return theta >= level.requisito;
}

/** Barreira imediatamente acima do nível atual (usada no badge "Nível Liberado!"). */
export function nextGate(theta: number): MasteryLevel | null {
  return LEVELS.find((l) => l.requisito > theta) ?? null;
}

/** Calibração: acerto consistente +12 / isolado +6; erro em série −12 / isolado −6. */
export function calibrate(theta: number, results: boolean[]): number {
  let value = theta;
  results.forEach((correto, i) => {
    const janela = results.slice(Math.max(0, i - 4), i + 1);
    const acc = janela.filter(Boolean).length / janela.length;
    value += correto ? (acc >= 0.6 ? 12 : 6) : acc < 0.4 ? -12 : -6;
  });
  return clampTheta(value);
}

export function withTrack(tracks: Tracks, track: TrackKey, value: number): Tracks {
  const next = { ...tracks };
  next[track] = clampTheta(value);
  return next;
}

export function averageOf(tracks: Tracks): number {
  return clampTheta(TRACKS.reduce((s, t) => s + tracks[t], 0) / TRACKS.length);
}
