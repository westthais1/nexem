import { questionsSupabase } from "@/lib/external-supabase";
import { getPremiumQuestionPool } from './subscription.functions';

export const EXAM_TABLE = "enem_provas";
export const EXAM_DURATION_SECONDS = 5 * 3600 + 30 * 60; // 5h30

export type ExamQuestion = {
  id: number | string;
  nome_prova: string;
  numero_questao: number;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_e: string;
  resposta_correta: string;
  area_conhecimento: string | null;
  materia: string | null;
  explicacao: string | null;
};

export type ExamSummary = { nome_prova: string; total: number };

const COLUMNS =
  "id,nome_prova,numero_questao,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,area_conhecimento,materia,explicacao";

export async function fetchExams(): Promise<ExamSummary[]> {
  const { data, error } = await questionsSupabase
    .from(EXAM_TABLE)
    .select("nome_prova")
    .order("nome_prova", { ascending: true });

  if (error) {
    console.error("[Prova] Falha ao listar provas", error);
    throw new Error(`Erro ao listar as provas disponíveis: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ nome_prova: string }>) {
    counts.set(row.nome_prova, (counts.get(row.nome_prova) ?? 0) + 1);
  }
  return [...counts.entries()].map(([nome_prova, total]) => ({ nome_prova, total }));
}

export async function fetchExamQuestions(nomeProva: string): Promise<ExamQuestion[]> {
  if (nomeProva !== 'Banco Geral Nexem') throw new Error('Esta prova não faz parte do Banco Geral Nexem.');
  const data = await getPremiumQuestionPool();
  return data.map((row, index) => ({ ...row, nome_prova: nomeProva, numero_questao: index + 1 })) as ExamQuestion[];
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
