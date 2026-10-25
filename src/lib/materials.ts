export const FREE_MATERIAL_LIMIT = 3;

export type Flashcard = { front: string; back: string };
export type PathStep = { title: string; description: string; minutes: number; concepts: string[]; format: string };
export type DetailedSection = { heading: string; paragraphs: string[] };
export type StepStatus = "todo" | "doing" | "done";
export type StudyData = { title: string; bullets: string[]; detailed: DetailedSection[]; flashcards: Flashcard[]; path: PathStep[] };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function parseStudyJson(raw: string): StudyData | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { obj = JSON.parse(m[0]); } catch { return null; }
  }
  const bullets = arr(obj["bullets"]).map(str).filter(Boolean);
  const detailed = arr(obj["detailed"]).map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return { heading: str(o["heading"]), paragraphs: arr(o["paragraphs"]).map(str).filter(Boolean) };
  }).filter((s) => s.heading || s.paragraphs.length);
  const flashcards = arr(obj["flashcards"]).map((c) => {
    const o = (c ?? {}) as Record<string, unknown>;
    return { front: str(o["front"]), back: str(o["back"]) };
  }).filter((c) => c.front && c.back);
  const path = arr(obj["path"]).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>;
    const minutes = Math.max(5, Math.min(240, Math.round(Number(o["minutes"]) || 30)));
    return { title: str(o["title"]), description: str(o["description"]), minutes, concepts: arr(o["concepts"]).map(str).filter(Boolean), format: str(o["format"]) };
  }).filter((p) => p.title);
  if (!bullets.length && !flashcards.length) return null;
  return { title: str(obj["title"]) || "Material de estudo", bullets, detailed, flashcards, path };
}

export function pathProgress(statuses: StepStatus[]): number {
  if (!statuses.length) return 0;
  const pts = statuses.reduce((s, st) => s + (st === "done" ? 1 : st === "doing" ? 0.5 : 0), 0);
  return Math.round((pts / statuses.length) * 100);
}
