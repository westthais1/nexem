// Raio-X do ENEM: frequência histórica por matéria (2009–2024).
// Os percentuais são a faixa observada nas provas; usamos "peso" (média da faixa)
// para ordenar o que mais rende ponto por hora de estudo.

export type Topico = {
  nome: string;
  min: number;
  max: number;
  nota?: string;
};

export type Materia = {
  nome: string;
  area: "Matemática" | "Ciências da Natureza" | "Ciências Humanas" | "Linguagens";
  resumo?: string;
  topicos: Topico[];
};

export function peso(t: Topico) {
  return (t.min + t.max) / 2;
}

export const MATERIAS: Materia[] = [
  {
    nome: "Matemática",
    area: "Matemática",
    resumo: "Prova isolada, 45 questões no dia 2.",
    topicos: [
      { nome: "Geometria (plana + espacial)", min: 22, max: 30, nota: "Maior peso individual" },
      { nome: "Escala, razão e proporção", min: 14, max: 22 },
      { nome: "Aritmética básica (frações, %, potenciação)", min: 11, max: 33 },
      { nome: "Estatística (média, mediana, desvio)", min: 8, max: 22 },
      { nome: "Gráficos e tabelas / leitura de dados", min: 9, max: 9 },
      { nome: "Funções", min: 9, max: 9 },
      { nome: "Probabilidade", min: 5, max: 8 },
      { nome: "Análise combinatória", min: 3, max: 5 },
      { nome: "Equações elementares", min: 3, max: 4 },
      { nome: "Matemática financeira", min: 2, max: 4, nota: "Baixa %, mas recorrente" },
    ],
  },
  {
    nome: "Biologia",
    area: "Ciências da Natureza",
    resumo: "Cobrada em contexto de meio ambiente e saúde pública, não decoreba.",
    topicos: [
      { nome: "Ecologia / impacto humano nos ecossistemas", min: 14, max: 18 },
      { nome: "Histologia e fisiologia (corpo humano)", min: 12, max: 12 },
      { nome: "Citologia", min: 11, max: 11 },
      { nome: "Fundamentos da ecologia", min: 9, max: 9 },
      { nome: "Biotecnologia", min: 7, max: 8 },
      { nome: "Microbiologia e doenças", min: 7, max: 7 },
      { nome: "Biologia molecular / genética", min: 6, max: 8 },
      { nome: "Evolução", min: 6, max: 6 },
      { nome: "Botânica", min: 6, max: 6 },
    ],
  },
  {
    nome: "Química",
    area: "Ciências da Natureza",
    topicos: [
      { nome: "Físico-química (termoquímica, cinética, equilíbrio)", min: 27, max: 28 },
      { nome: "Química geral (atomística, ligações, tabela periódica)", min: 27, max: 27 },
      { nome: "Química orgânica (funções orgânicas)", min: 19, max: 19 },
      { nome: "Meio ambiente / química verde", min: 10, max: 10 },
      { nome: "Energia", min: 6, max: 6 },
    ],
  },
  {
    nome: "Física",
    area: "Ciências da Natureza",
    resumo: "Sempre contextualizada no cotidiano — contas de luz, usinas, ondas.",
    topicos: [
      { nome: "Mecânica", min: 28, max: 30 },
      { nome: "Eletricidade e energia", min: 25, max: 28 },
      { nome: "Ondulatória", min: 17, max: 17 },
      { nome: "Termologia", min: 16, max: 16 },
      { nome: "Óptica", min: 8, max: 8 },
    ],
  },
  {
    nome: "História",
    area: "Ciências Humanas",
    topicos: [
      { nome: "Idade Contemporânea (XIX–XX, guerras, ditaduras)", min: 15, max: 15 },
      { nome: "Brasil Colônia", min: 13, max: 13 },
      { nome: "Brasil Império", min: 11, max: 12 },
      { nome: "História política / poder", min: 11, max: 11 },
      { nome: "Patrimônio histórico-cultural e memória", min: 9, max: 9 },
      { nome: "Idade Moderna", min: 6, max: 14 },
      { nome: "Primeira República", min: 6, max: 6 },
      { nome: "Idade Antiga", min: 5, max: 6 },
      { nome: "Idade Média", min: 5, max: 5 },
    ],
  },
  {
    nome: "Geografia",
    area: "Ciências Humanas",
    topicos: [
      { nome: "Meio ambiente", min: 18, max: 18 },
      { nome: "Geografia agrária / espaço rural", min: 13, max: 18 },
      { nome: "Geopolítica (blocos, conflitos, globalização)", min: 9, max: 13 },
      { nome: "Espaço / geografia urbana", min: 10, max: 11 },
      { nome: "Demografia e cultura", min: 10, max: 10 },
      { nome: "Tecnologia, transporte e comunicação", min: 4, max: 4 },
      { nome: "Cartografia", min: 3, max: 3 },
    ],
  },
  {
    nome: "Filosofia",
    area: "Ciências Humanas",
    topicos: [
      { nome: "Filosofia Antiga", min: 16, max: 28 },
      { nome: "Ética e justiça", min: 18, max: 18 },
      { nome: "Filosofia Moderna", min: 11, max: 19 },
      { nome: "Filosofia Contemporânea", min: 14, max: 14 },
      { nome: "Natureza do conhecimento (epistemologia)", min: 12, max: 12 },
      { nome: "Filosofia política", min: 6, max: 10 },
    ],
  },
  {
    nome: "Sociologia",
    area: "Ciências Humanas",
    topicos: [
      { nome: "Mundo do trabalho", min: 22, max: 22 },
      { nome: "Cultura e indústria cultural", min: 11, max: 19 },
      { nome: "Movimentos sociais", min: 12, max: 18 },
      { nome: "Estado, cidadania e direitos", min: 10, max: 16 },
      { nome: "Desigualdades sociais", min: 10, max: 10 },
      { nome: "Ideologia", min: 9, max: 9 },
    ],
  },
  {
    nome: "Português / Linguagens",
    area: "Linguagens",
    topicos: [
      {
        nome: "Leitura e interpretação de textos",
        min: 34,
        max: 48,
        nota: "Maior peso individual de toda a prova",
      },
      { nome: "Estrutura textual e análise do discurso", min: 16, max: 16 },
      { nome: "Leitura e artes (pintura, música, cinema)", min: 11, max: 11 },
      { nome: "Gênero textual", min: 9, max: 9 },
      { nome: "Literatura", min: 9, max: 9 },
      { nome: "Variação linguística", min: 7, max: 7 },
      { nome: "Funções da linguagem / intertextualidade", min: 4, max: 4 },
      { nome: "Gramática pura", min: 2, max: 2, nota: "O que MENOS cai" },
    ],
  },
  {
    nome: "Inglês / Espanhol",
    area: "Linguagens",
    topicos: [
      { nome: "Leitura e interpretação de texto", min: 50, max: 50 },
      { nome: "Vocabulário / domínio lexical", min: 12, max: 16 },
      { nome: "Charges, tirinhas, poemas e músicas", min: 10, max: 12 },
      { nome: "Gramática isolada", min: 1, max: 2, nota: "Quase não aparece" },
    ],
  },
];

export const TOP_PRIORIDADES = MATERIAS.flatMap((m) =>
  m.topicos.map((t) => ({ materia: m.nome, area: m.area, ...t })),
)
  .sort((a, b) => peso(b) - peso(a))
  .slice(0, 10);

export const COMPETENCIAS = [
  { n: 1, titulo: "Norma culta", desc: "Escrita formal: sem gírias, sem 1ª pessoa, sem coloquialismo." },
  { n: 2, titulo: "Tema e estrutura", desc: "Compreensão do tema + texto dissertativo-argumentativo." },
  { n: 3, titulo: "Argumentação", desc: "Seleção e organização de argumentos, fatos e opiniões." },
  { n: 4, titulo: "Coesão", desc: "Conectivos e articulação entre parágrafos." },
  { n: 5, titulo: "Proposta de intervenção", desc: "Agente + ação + meio + efeito + detalhamento, respeitando os direitos humanos." },
];

export const TEMAS_RECENTES = [
  { ano: 2016, tema: "Desperdício de alimentos" },
  { ano: 2017, tema: "Educação de surdos" },
  { ano: 2018, tema: "Dados e manipulação online" },
  { ano: 2019, tema: "Acesso ao cinema" },
  { ano: 2020, tema: "Estigma de doenças mentais" },
  { ano: 2021, tema: "Registro civil e cidadania" },
  { ano: 2022, tema: "Comunidades e povos tradicionais" },
  { ano: 2023, tema: "Trabalho de cuidado da mulher" },
  { ano: 2024, tema: "Herança africana e povos tradicionais" },
  { ano: 2025, tema: "Envelhecimento na sociedade brasileira" },
];

export const TEMAS_QUENTES = [
  "Saúde mental dos jovens",
  "IA e sociedade",
  "Apostas esportivas",
  "Solidão e isolamento social",
  "Crise habitacional",
  "Mudanças climáticas",
  "Acesso à água",
];
