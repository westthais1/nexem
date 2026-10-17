import { createFileRoute } from "@tanstack/react-router";

import { PublicPageShell } from "@/components/PublicPageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/perguntas-frequentes")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — Nexem" },
      {
        name: "description",
        content:
          "Tire suas dúvidas sobre o Nexem: treino adaptativo, Tutor Nex, progresso salvo, nota estimada e Redação Inteligente.",
      },
      { property: "og:title", content: "Perguntas frequentes — Nexem" },
      {
        property: "og:description",
        content: "Tudo o que você precisa saber antes de começar seu primeiro desafio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerguntasFrequentesPage,
});

const FAQ = [
  {
    q: "Como o Nexem seleciona as questões?",
    a: "Mapeamos os padrões neurais da prova para estruturar treinos que se adaptam exatamente à zona de desenvolvimento proximal e à carga cognitiva de cada aluno.",
  },
  {
    q: "O que significa treino adaptativo?",
    a: "O Nexem usa seu histórico de respostas para ajustar os próximos desafios ao seu desempenho.",
  },
  {
    q: "O Tutor Nex entrega a resposta?",
    a: "Não. Ele usa pistas, perguntas e explicações para ajudar você a construir o raciocínio.",
  },
  {
    q: "Preciso estudar horas por dia?",
    a: "Não. O Desafio Diário foi criado para transformar cerca de 15 minutos em um hábito consistente.",
  },
  {
    q: "Por que o Nexem é diferente de um simulado tradicional?",
    a: "Um simulado tradicional é estático e passivo: você responde a uma lista fixa de perguntas e recebe apenas uma nota fria dias depois. O Nexem funciona como um organismo vivo. Nosso motor de Inteligência Adaptativa recalibrado via TRI recalibra o nível de cada questão em tempo real à medida que você avança, entregando um diagnóstico preciso e imediato dos seus pontos cegos sem desperdiçar seu tempo.",
  },
  {
    q: "Como o Nexem se posiciona como um modelo de aprendizagem completo e atualizado para o ENEM?",
    a: "Nós unimos engenharia de dados, neurociência cognitiva e inteligência artificial socrática em quatro verticais complementares. Você cria consistência diária com o Desafio de 10 Questões, aprofunda conteúdos específicos de forma cirúrgica nos Níveis de Maestria, corrige lacunas ativamente conversando com o Tutor Nex (Claude AI) e treina sua resistência mental no Simulado Completo. É um ciclo contínuo e fechado de diagnóstico, prática e evolução focado no seu 800+.",
  },
  {
    q: "O que acontece depois que eu crio minha conta?",
    a: "Na primeira entrada, você responde um questionário sobre sua série, objetivo e nota desejada. Depois, pode começar o Desafio Diário ou escolher uma matéria no Treine com Tutor Nex. Essas respostas ficam salvas na sua conta.",
  },
  {
    q: "Meu progresso fica salvo se eu trocar de aparelho?",
    a: "Sim. O progresso concluído no treino é salvo na sua conta. Entre com a mesma conta no celular ou no computador para continuar acompanhando sua evolução.",
  },
  {
    q: "A nota estimada pelo Nexem é a nota oficial do ENEM?",
    a: "Não. Ela é uma referência de treino, não um resultado oficial. A nota do ENEM é calculada pelo Inep com os parâmetros dos itens da prova. Não é possível converter um número de acertos em uma nota oficial exata apenas com uma regra de três.",
  },
  {
    q: "O Nexem consegue saber se eu chutei?",
    a: "Não com certeza. Um padrão de respostas pode sugerir inconsistência, mas também pode refletir lacunas de conteúdo. O diagnóstico aponta possibilidades e orienta a revisão; não prova que você chutou.",
  },
  {
    q: "Como funciona a Redação Inteligente?",
    a: "Você pratica uma redação e recebe uma avaliação de treino nas cinco competências do ENEM: domínio da escrita formal, compreensão do tema, argumentação, coesão e proposta de intervenção. A devolutiva da IA ajuda a revisar o texto, mas não substitui a correção oficial ou a orientação de um professor.",
  },
  {
    q: "O Nexem garante aprovação ou uma nota acima de 800?",
    a: "Não. O Nexem oferece prática, orientação e acompanhamento, mas o resultado depende da sua preparação e do desempenho no exame. Sua meta ajuda a direcionar o estudo; não é uma promessa de nota.",
  },
] as const;

function PerguntasFrequentesPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-border bg-secondary/40 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase text-accent">Sem dúvida no caminho</p>
          <h1 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Perguntas frequentes</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Tudo o que você precisa saber antes de começar seu primeiro desafio.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-7 text-left text-xl font-semibold leading-snug md:text-2xl">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-7 text-lg leading-relaxed text-muted-foreground md:text-xl">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </PublicPageShell>
  );
}
