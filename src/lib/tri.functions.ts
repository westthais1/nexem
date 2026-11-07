import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Attempt = {
  question_id: string;
  dificuldade_questao: string | null;
  materia_questao: string | null;
  foi_correto: boolean;
  created_at: string;
};

export type TriBucket = { total: number; acertos: number; taxa: number };

export type TriResult = {
  totalTentativas: number;
  faceis: TriBucket;
  medias: TriBucket;
  dificeis: TriBucket;
  nota: number;
  status: "consistente" | "chute" | "neutro" | "sem_dados";
  rotuloStatus: string;
  diagnostico: string;
  materiaFraca: string | null;
  serieSemanal: { dia: string; nota: number | null; tentativas: number }[];
};

const NORMALIZE: Record<string, "facil" | "media" | "dificil"> = {
  facil: "facil",
  media: "media",
  dificil: "dificil",
};

function nivel(raw: string | null): "facil" | "media" | "dificil" {
  const key = (raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return NORMALIZE[key] ?? "media";
}

function bucket(list: Attempt[]): TriBucket {
  const total = list.length;
  const acertos = list.filter((a) => a.foi_correto).length;
  return { total, acertos, taxa: total > 0 ? acertos / total : 0 };
}

function calcularNota(attempts: Attempt[]) {
  const faceis = bucket(attempts.filter((a) => nivel(a.dificuldade_questao) === "facil"));
  const medias = bucket(attempts.filter((a) => nivel(a.dificuldade_questao) === "media"));
  const dificeis = bucket(attempts.filter((a) => nivel(a.dificuldade_questao) === "dificil"));

  // Pesos padrão da lógica TRI: acertar difícil vale mais, desde que a base esteja sólida.
  let pesoFacil = 0.2;
  let pesoMedia = 0.3;
  let pesoDificil = 0.5;
  let multiplicador = 1;
  let status: TriResult["status"] = "neutro";

  const chute = faceis.total > 0 && dificeis.total > 0 && faceis.taxa < 0.4 && dificeis.taxa > 0.6;
  const consistente = faceis.total > 0 && faceis.taxa > 0.7 && dificeis.taxa < 0.4;

  if (chute) {
    // Padrão incoerente: o peso das difíceis é penalizado (provável chute).
    pesoFacil = 0.4;
    pesoMedia = 0.4;
    pesoDificil = 0.2;
    multiplicador = 0.85;
    status = "chute";
  } else if (consistente) {
    multiplicador = 1.08;
    status = "consistente";
  }

  const bruto = faceis.taxa * pesoFacil + medias.taxa * pesoMedia + dificeis.taxa * pesoDificil;
  const nota = Math.max(0, Math.min(1000, Math.round(bruto * 1000 * multiplicador)));

  return { faceis, medias, dificeis, nota, status };
}

export const getTriEstimate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TriResult> => {
  const { data, error } = await context.supabase
    .from("enem_user_attempts")
    .select("question_id,dificuldade_questao,materia_questao,foi_correto,created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Erro ao ler o histórico de tentativas: ${error.message}`);

  const attempts = (data ?? []) as Attempt[];

  if (attempts.length === 0) {
    const vazio: TriBucket = { total: 0, acertos: 0, taxa: 0 };
    return {
      totalTentativas: 0,
      faceis: vazio,
      medias: vazio,
      dificeis: vazio,
      nota: 0,
      status: "sem_dados",
      rotuloStatus: "Sem dados suficientes",
      diagnostico:
        "Você ainda não respondeu questões no Simulado. Responda algumas questões para o simulador estimar sua nota TRI.",
      materiaFraca: null,
      serieSemanal: [],
    };
  }

  const { faceis, medias, dificeis, nota, status } = calcularNota(attempts);

  // Matéria com mais erros em questões fáceis/médias (base frágil).
  const errosPorMateria = new Map<string, number>();
  for (const a of attempts) {
    if (a.foi_correto) continue;
    if (nivel(a.dificuldade_questao) === "dificil") continue;
    const m = a.materia_questao ?? "Conteúdos gerais";
    errosPorMateria.set(m, (errosPorMateria.get(m) ?? 0) + 1);
  }
  const materiaFraca =
    [...errosPorMateria.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  let rotuloStatus: string;
  let diagnostico: string;
  if (status === "chute") {
    rotuloStatus = "Alerta de Chute Detectado";
    diagnostico = `Sua nota está sofrendo penalização porque você está errando fundamentos fáceis enquanto acerta questões difíceis — a TRI interpreta esse padrão como chute. Foque em revisar a base de ${materiaFraca ?? "conteúdos fundamentais"}!`;
  } else if (status === "consistente") {
    rotuloStatus = "Consistência Padrão";
    diagnostico = `Seu padrão é coerente: você domina a base e erra apenas as questões mais difíceis, então a TRI valoriza sua nota. Agora avance no nível de dificuldade${materiaFraca ? `, sem descuidar de ${materiaFraca}` : ""}.`;
  } else {
    rotuloStatus = "Padrão equilibrado";
    diagnostico = materiaFraca
      ? `Seu desempenho está equilibrado entre os níveis. O maior ganho de nota agora vem de reforçar a base de ${materiaFraca}.`
      : "Seu desempenho está equilibrado entre os níveis de dificuldade. Continue praticando para consolidar o padrão.";
  }

  // Evolução dos últimos 7 dias: nota TRI acumulada até o fim de cada dia.
  const serieSemanal: TriResult["serieSemanal"] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date();
    dia.setUTCHours(23, 59, 59, 999);
    dia.setUTCDate(dia.getUTCDate() - i);
    const ateODia = attempts.filter((a) => new Date(a.created_at) <= dia);
    const doDia = attempts.filter((a) => {
      const d = new Date(a.created_at);
      return d <= dia && d > new Date(dia.getTime() - 24 * 60 * 60 * 1000);
    });
    serieSemanal.push({
      dia: dia.toISOString().slice(0, 10),
      nota: ateODia.length > 0 ? calcularNota(ateODia).nota : null,
      tentativas: doDia.length,
    });
  }

  return {
    totalTentativas: attempts.length,
    faceis,
    medias,
    dificeis,
    nota,
    status,
    rotuloStatus,
    diagnostico,
    materiaFraca,
    serieSemanal,
  };
});
