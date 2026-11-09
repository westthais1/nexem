/**
 * Próximos passos determinísticos (sem IA) usados pelo painel, resultados e perfil.
 * Módulo puro e seguro para o navegador: não acessa banco nem rede.
 */

export const WEEKDAYS_PT = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"] as const;

/** Nome do dia da semana (horário de São Paulo), no mesmo formato do cronograma do onboarding. */
export function weekdayNamePt(date: Date = new Date()): string {
  const short = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Sao_Paulo" });
  const idx = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(short);
  return WEEKDAYS_PT[idx < 0 ? 0 : idx];
}

export type Tally = { key: string; total: number; acertos: number };

/** Item mais fraco: menor taxa de acerto entre os que têm respostas; empate → mais respostas. */
export function pickWeakest<T extends Tally>(items: T[]): T | null {
  const withData = items.filter((i) => i.total > 0);
  if (withData.length === 0) return null;
  return [...withData].sort((a, b) => a.acertos / a.total - b.acertos / b.total || b.total - a.total)[0] ?? null;
}

/** Os N mais fracos (mesma regra de pickWeakest). */
export function pickWeakestN<T extends Tally>(items: T[], n: number): T[] {
  return items
    .filter((i) => i.total > 0)
    .sort((a, b) => a.acertos / a.total - b.acertos / b.total || b.total - a.total)
    .slice(0, n);
}

type PlanArea = "linguagens" | "humanas" | "natureza" | "matematica" | "redacao";
export type PlanDay = { day: string; hours: number; period: string; sessions: { area: PlanArea; minutes: number; topic: string; format: string }[] };

export type TodayAction =
  | { kind: "perfil" }
  | { kind: "desafio"; day: PlanDay | null }
  | { kind: "treinar"; day: PlanDay; area: Exclude<PlanArea, "redacao"> }
  | { kind: "redacao"; day: PlanDay }
  | { kind: "livre" };

/**
 * Decide o botão principal do card "Hoje".
 * Sem cronograma → perfil. Desafio não feito hoje → Desafio Diário.
 * Feito → primeira sessão planejada para hoje (Redação ou Treine com Tutor Nex). Dia sem sessões → livre.
 */
export function planToday(schedule: PlanDay[] | null | undefined, weekday: string, desafioFeitoHoje: boolean): TodayAction {
  if (!schedule || schedule.length === 0) return { kind: "perfil" };
  const day = schedule.find((d) => d.day === weekday) ?? null;
  if (!desafioFeitoHoje) return { kind: "desafio", day };
  const first = day?.sessions[0];
  if (!day || !first) return { kind: "livre" };
  if (first.area === "redacao") return { kind: "redacao", day };
  return { kind: "treinar", day, area: first.area };
}

export const COMPETENCIA_INFO: Record<"c1" | "c2" | "c3" | "c4" | "c5", { titulo: string; explica: string }> = {
  c1: { titulo: "Competência 1 — Norma culta", explica: "Avalia o domínio da escrita formal: ortografia, acentuação, concordância, regência e pontuação." },
  c2: { titulo: "Competência 2 — Tema e repertório", explica: "Avalia se você entendeu a proposta, respeitou o tipo dissertativo-argumentativo e usou repertório sociocultural pertinente." },
  c3: { titulo: "Competência 3 — Argumentação", explica: "Avalia como você seleciona, organiza e interpreta informações e argumentos para defender um ponto de vista." },
  c4: { titulo: "Competência 4 — Coesão", explica: "Avalia o uso de conectivos e mecanismos linguísticos que ligam frases e parágrafos." },
  c5: { titulo: "Competência 5 — Proposta de intervenção", explica: "Avalia a proposta de solução: agente, ação, meio, finalidade e detalhamento, respeitando os direitos humanos." },
};

/** Competência com menor nota (empate → a de menor número). */
export function weakestCompetencia(c: Record<"c1" | "c2" | "c3" | "c4" | "c5", number>): "c1" | "c2" | "c3" | "c4" | "c5" {
  const keys = ["c1", "c2", "c3", "c4", "c5"] as const;
  return keys.reduce((min, k) => (c[k] < c[min] ? k : min), "c1");
}
