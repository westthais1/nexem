import { useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  Clock3,
  FileText,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedProgress, ChestReward } from "@/components/GameEffects";
import fox from "@/assets/daily/fox.png.asset.json";
import logo from "@/assets/nexem-logo.png.asset.json";
import { MATERIAS } from "@/lib/enem-frequencia";

export function MockupTop({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
      <img src={logo.url} alt="" className="h-5 w-auto" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ChallengeMockup() {
  return (
    <div
      aria-hidden="true"
      className="landing-demo relative rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/10 sm:p-7"
    >
      <MockupTop label="Desafio Diário" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-primary">Física · Fundações</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
          <Clock3 className="h-3 w-3" />
          ≈15 min · 10 questões
        </span>
      </div>
      <AnimatedProgress value={4} max={10} label="Exemplo de jornada" className="mt-4 h-1.5" />
      <div className="mt-5 flex items-start gap-3">
        <img src={fox.url} alt="" className="fox-idle h-16 w-16 shrink-0 object-contain" />
        <p className="text-sm font-medium leading-relaxed">
          Uma bicicleta percorre 12 km em 40 minutos. Qual é sua velocidade média?
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {["12 km/h", "18 km/h", "24 km/h", "30 km/h"].map((answer, i) => (
          <div
            key={answer}
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${i === 1 ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
          >
            <span className="text-xs">{"ABCD"[i]}</span>
            {answer}
            {i === 1 && <Check className="ml-auto h-4 w-4" />}
          </div>
        ))}
      </div>
      <div className="mt-5 border-l-2 border-accent bg-accent/5 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          Tutor Nex
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          Antes de dividir, como você transforma 40 minutos em horas?
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Uma pista. Seu raciocínio.</span>
        <span className="game-pop font-semibold text-primary">+XP · passo concluído</span>
      </div>
    </div>
  );
}

const areas = [
  { name: "Linguagens", tone: "bg-aura-linguagens", width: "w-4/5" },
  { name: "Humanas", tone: "bg-aura-humanas", width: "w-3/5" },
  { name: "Natureza", tone: "bg-aura-natureza", width: "w-2/5" },
  { name: "Matemática", tone: "bg-primary", width: "w-1/2" },
];
export function DiagnosisMockup() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-primary/5">
        <MockupTop label="01 · Seu ponto de partida" />
        <p className="font-semibold">Cada área, um começo.</p>
        <div className="mt-4 grid gap-3">
          {areas.map((a) => (
            <div key={a.name} className="grid grid-cols-[100px_1fr] items-center gap-3 text-xs">
              <span>{a.name}</span>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className={`game-fill h-full rounded-full ${a.tone} ${a.width}`} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Ilustração do diagnóstico por área</p>
      </div>
      <div className="ml-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Montando seu desafio…</p>
          <p className="mt-1 text-xs text-muted-foreground">10 questões no seu nível</p>
        </div>
      </div>
      <div className="ml-8 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <Check className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold">Acertos e erros viram próximos passos.</p>
          <p className="mt-1 text-xs text-muted-foreground">Amanhã, um novo desafio.</p>
        </div>
      </div>
    </div>
  );
}

export function TutorMockup() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-accent/10 sm:p-7"
    >
      <MockupTop label="Tutor Nex" />
      <div className="space-y-4">
        <div className="ml-8 rounded-xl rounded-br-sm bg-secondary p-4 text-sm leading-relaxed">
          Travei nessa conta. É só dividir 12 por 40?
        </div>
        <div className="mr-6 rounded-xl rounded-bl-sm border border-accent/20 bg-accent/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-accent">
            <Sparkles className="h-4 w-4" />
            Tutor Nex
          </p>
          <p className="text-sm leading-relaxed">
            A velocidade está em km/h. Que unidade o tempo precisa ter? Quanto é 40 ÷ 60?
          </p>
        </div>
        <div className="ml-8 rounded-xl rounded-br-sm bg-secondary p-4 text-sm leading-relaxed">
          ⅔ de hora! Então 12 ÷ ⅔ = 18 km/h.
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-primary">
          <Check className="h-4 w-4" />A resposta veio do seu raciocínio.
        </div>
      </div>
    </div>
  );
}

export function JourneyMockup() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/10 sm:p-7"
    >
      <MockupTop label="Sua jornada · exemplo" />
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Flame className="game-flame h-6 w-6 text-warning-foreground" />
          Um dia de cada vez
        </span>
        <span className="combo-badge rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold">
          Combo x3
        </span>
      </div>
      <div className="relative my-7 flex h-28 items-end justify-between gap-2">
        <div className="absolute inset-x-5 bottom-5 h-1 bg-secondary">
          <div className="game-fill h-full w-3/5 bg-primary" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 ${i < 2 ? "game-pop border-primary bg-primary text-primary-foreground" : i === 2 ? "node-ring border-primary bg-card" : "border-border bg-secondary text-muted-foreground"} ${i % 2 ? "mb-5" : ""}`}
          >
            {i < 2 ? (
              <Check className="h-5 w-5" />
            ) : i === 2 ? (
              <img
                src={fox.url}
                alt=""
                className="fox-idle absolute bottom-3 h-20 w-20 max-w-none object-contain"
              />
            ) : i === 4 ? (
              <Trophy className="h-5 w-5" />
            ) : (
              i + 1
            )}
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between border-t border-border pt-4 text-xs">
        <span className="flex items-center gap-2">
          <Swords className="game-sway h-4 w-4 text-accent" />2 últimas questões: chefe final
        </span>
        <Award className="h-5 w-5 text-primary" />
      </div>
      <ChestReward xp={10} />
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Exemplo visual de recompensas, não de uma conta real.
      </p>
    </div>
  );
}

export function EssayMockup() {
  const competencies = [
    { label: "C1 · Escrita formal", value: 160 },
    { label: "C2 · Tema e repertório", value: 160 },
    { label: "C3 · Argumentação", value: 120 },
    { label: "C4 · Coesão", value: 160 },
    { label: "C5 · Intervenção", value: 160 },
  ];
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-accent/10 sm:p-7"
    >
      <MockupTop label="Redação · exemplo ilustrativo" />
      <p className="font-display text-lg font-semibold">Educação ambiental no cotidiano</p>
      <p className="mt-4 font-serif text-sm leading-7 text-muted-foreground">
        O consumo consciente exige informação e participação coletiva.{" "}
        <mark className="bg-warning/25 text-foreground">
          A falta de orientação dificulta mudanças nos hábitos da população.
        </mark>
      </p>
      <div className="my-4 border-l-2 border-accent bg-accent/5 p-3">
        <p className="text-xs font-semibold text-accent">C3 · Desenvolva a relação</p>
        <p className="mt-1 text-xs leading-relaxed">
          Explique como a falta de informação afeta uma escolha concreta. Um exemplo fortalece seu
          argumento.
        </p>
      </div>
      <div className="flex items-end justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Nota estimada no exemplo</span>
        <p className="font-display text-3xl font-semibold text-primary">
          760<span className="text-sm text-muted-foreground">/1000</span>
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {competencies.map((c) => (
          <div key={c.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{c.label}</span>
              <span>{c.value}/200</span>
            </div>
            <AnimatedProgress value={c.value} max={200} label={c.label} className="h-1.5" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">Nota estimada, não oficial.</p>
    </div>
  );
}

export function MaterialsMockup() {
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xl shadow-primary/10 sm:p-6">
      <MockupTop label="Meus Materiais · exemplo" />
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-lg bg-secondary p-2 text-primary">
          <FileText aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Ecologia: cadeias alimentares</p>
          <p className="text-xs text-muted-foreground">Um assunto do seu material</p>
        </div>
      </div>
      <Tabs defaultValue="resumo">
        <TabsList
          aria-label="Formas de estudar o material"
          className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4"
        >
          {(
            [
              ["resumo", "Resumo"],
              ["flashcards", "Flashcards"],
              ["questao", "Questão"],
              ["trilha", "Trilha de estudo"],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="px-2 py-2 text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-4 min-h-[285px]">
          <TabsContent value="resumo" className="m-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
              <BookOpen aria-hidden="true" className="h-4 w-4" />O essencial, sem perder o contexto
            </p>
            <h3 className="mt-4 font-display text-2xl font-semibold">A energia tem um caminho.</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Produtores transformam energia solar em matéria orgânica. Consumidores obtêm energia
              ao se alimentar de outros seres vivos.
            </p>
            <p className="mt-4 border-l-2 border-primary pl-3 text-sm leading-relaxed">
              A cada nível trófico, parte da energia é dissipada. Por isso, há menos energia
              disponível no topo da cadeia.
            </p>
          </TabsContent>
          <TabsContent value="flashcards" className="m-0">
            <p className="mb-3 text-xs text-muted-foreground">Cartão 1 · Cadeias alimentares</p>
            <Button
              variant="outline"
              aria-pressed={flipped}
              aria-label={
                flipped ? "Virar flashcard para a pergunta" : "Virar flashcard para a resposta"
              }
              onClick={() => setFlipped((f) => !f)}
              className="landing-flip h-56 w-full whitespace-normal border-primary/25 bg-primary/5 p-0 hover:bg-primary/10 hover:text-foreground"
            >
              <span className={`landing-flip-inner ${flipped ? "is-flipped" : ""}`}>
                <span aria-hidden={flipped} className="landing-flip-front">
                  <span className="text-xs uppercase text-primary">Pergunta</span>
                  <span className="font-display text-xl font-semibold">
                    Por que a energia diminui
                    <br />
                    ao longo da cadeia?
                  </span>
                  <RotateCcw aria-hidden="true" className="h-5 w-5" />
                </span>
                <span aria-hidden={!flipped} className="landing-flip-back">
                  <span className="text-xs uppercase text-primary">Resposta</span>
                  <span className="text-base leading-relaxed">
                    Parte da energia é usada no metabolismo e dissipada como calor a cada nível
                    trófico.
                  </span>
                  <RotateCcw aria-hidden="true" className="h-5 w-5" />
                </span>
              </span>
            </Button>
          </TabsContent>
          <TabsContent value="questao" className="m-0">
            <p className="mb-3 text-sm font-medium leading-relaxed">
              Em uma cadeia alimentar, quem introduz a energia solar no sistema?
            </p>
            <div role="group" aria-label="Alternativas da questão de exemplo" className="space-y-2">
              {["Decompositores", "Produtores", "Consumidores"].map((text, i) => (
                <Button
                  key={text}
                  variant="outline"
                  aria-pressed={answer === i}
                  onClick={() => setAnswer(i)}
                  className={`h-auto min-h-10 w-full justify-start whitespace-normal text-left ${answer === i ? (i === 1 ? "border-success bg-success/10" : "border-answer-error/30 bg-muted") : ""}`}
                >
                  <span className="text-xs text-muted-foreground">{"ABC"[i]}</span>
                  {text}
                  {answer === i && i === 1 && (
                    <Check aria-hidden="true" className="ml-auto h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
            {answer !== null && (
              <p role="status" className="mt-3 text-sm leading-relaxed text-primary">
                {answer === 1
                  ? "Isso! Produtores convertem energia solar em energia química."
                  : "Quase! Pense em quem realiza fotossíntese: os produtores."}
              </p>
            )}
          </TabsContent>
          <TabsContent value="trilha" className="m-0">
            <p className="mb-4 text-xs text-muted-foreground">Do primeiro conceito à aplicação</p>
            <ol className="space-y-3">
              {[
                "Fundações · produtores e consumidores",
                "Aprofundamento · fluxo de energia",
                "Domínio Avançado · impactos no ecossistema",
              ].map((text, i) => (
                <li key={text} className="flex items-center gap-3 border-b border-border pb-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {i === 0 ? <Check aria-hidden="true" className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-primary">
              <Trophy aria-hidden="true" className="h-4 w-4" />
              Simulado final sobre o material
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export function ExamMockup() {
  const topics = MATERIAS.find((m) => m.nome === "Matemática")?.topicos.slice(0, 3) ?? [];
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-accent/10 sm:p-7"
    >
      <MockupTop label="Prova completa" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">Dia 2 · 90 questões</span>
        <span className="pro-popular rounded-md px-2.5 py-1 text-xs font-semibold">Pro</span>
      </div>
      <div className="my-6 flex items-center gap-4">
        <Clock3 className="h-8 w-8 text-accent" />
        <div>
          <p className="font-display text-4xl font-semibold tabular-nums">05:00:00</p>
          <p className="mt-1 text-xs text-muted-foreground">Tempo total · Natureza + Matemática</p>
        </div>
      </div>
      <div className="border-t border-border pt-5">
        <p className="text-sm font-semibold">Raio-X · Matemática</p>
        <p className="mt-1 text-xs text-muted-foreground">Frequência histórica · ENEM 2009–2024</p>
        <div className="mt-5 space-y-4">
          {topics.map((t) => (
            <div key={t.nome}>
              <div className="mb-2 flex items-start justify-between gap-3 text-xs">
                <span className="max-w-[75%]">{t.nome}</span>
                <span className="shrink-0 text-primary">
                  {t.min}–{t.max}%
                </span>
              </div>
              <AnimatedProgress
                value={(t.min + t.max) / 2}
                max={40}
                label={t.nome}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimeMockup() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/10 sm:p-7"
    >
      <MockupTop label="Progresso salvo na sua conta" />
      <ol className="space-y-6">
        {[
          {
            day: "Dia 1",
            title: "Conhecer seu ponto de partida",
            detail: "Diagnóstico por área",
            icon: BookOpen,
          },
          {
            day: "Dia 7",
            title: "Criar continuidade",
            detail: "Sequência · Fundações → Aprofundamento",
            icon: Flame,
          },
          {
            day: "Dia 30",
            title: "Enxergar o caminho percorrido",
            detail: "Domínio Avançado · estatísticas por área",
            icon: Trophy,
          },
        ].map(({ day, title, detail, icon: Icon }, i) => (
          <li key={day} className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${i === 2 ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {i < 2 && <span className="h-8 w-px bg-border" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">{day}</p>
              <h3 className="mt-1 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
        Um exemplo de trajetória, não um prazo garantido. Os níveis acompanham seu desempenho.
      </p>
    </div>
  );
}
