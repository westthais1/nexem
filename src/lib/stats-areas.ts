import { subjectOf } from "./mastery";

export type AreaKey = "matematica" | "natureza" | "linguagens" | "humanas";

export const AREA_INFO: Record<AreaKey, { name: string; subject: string }> = {
  matematica: { name: "Matemática", subject: "mat-algebrica" },
  natureza: { name: "Ciências da Natureza", subject: "biologia" },
  linguagens: { name: "Linguagens e Códigos", subject: "portugues" },
  humanas: { name: "Ciências Humanas", subject: "historia" },
};

/** Agrupa a matéria de uma tentativa em uma das quatro áreas do ENEM. */
export function areaOfMateria(materia: string | null): AreaKey | null {
  const s = subjectOf(materia, null);
  if (s) return s.track as AreaKey;
  const m = (materia ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!m) return null;
  if (/matem/.test(m)) return "matematica";
  if (/natureza|biolog|fisic|quimic/.test(m)) return "natureza";
  if (/humanas|histor|geograf|filosof|sociolog/.test(m)) return "humanas";
  if (/linguag|portugu|ingles|espanhol|literat|artes|educacao fisica|redac/.test(m)) return "linguagens";
  return null;
}
