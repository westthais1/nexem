CREATE TABLE public.enem_tutor (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  topic text not null,
  enunciado text not null,
  opcao_a text not null,
  opcao_b text not null,
  opcao_c text not null,
  opcao_d text not null,
  opcao_e text not null,
  alternativa_correta text not null check (alternativa_correta in ('A','B','C','D','E')),
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.enem_tutor TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enem_tutor TO authenticated;
GRANT ALL ON public.enem_tutor TO service_role;

ALTER TABLE public.enem_tutor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to questions"
  ON public.enem_tutor
  FOR SELECT
  TO anon
  USING (true);

INSERT INTO public.enem_tutor (area, topic, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, alternativa_correta) VALUES
('Exatas', 'Funções e proporcionalidade', 'Uma empresa de streaming cobra uma taxa fixa mensal de R$ 12,00 mais R$ 1,50 por hora assistida acima de 20 horas. Um assinante que assistiu 46 horas em determinado mês deseja saber quanto pagará na fatura correspondente a esse período.

O valor total da fatura desse assinante, em reais, é', '39,00', '45,00', '51,00', '69,00', '81,00', 'C'),
('Exatas', 'Estatística', 'Em uma turma de 25 alunos, a média das notas de uma prova foi 6,4. Após a correção de um erro, a nota de um único aluno subiu de 4,0 para 9,0, e a média foi recalculada.

A nova média da turma é', '6,4', '6,6', '6,8', '7,0', '7,4', 'B'),
('Humanas', 'Brasil República', 'A Constituição de 1988 ficou conhecida como "Constituição Cidadã" por ampliar direitos sociais e mecanismos de participação popular após o período do regime militar.

Essa denominação relaciona-se principalmente ao fato de o texto constitucional ter', 'restringido o voto a cidadãos alfabetizados.', 'consolidado direitos sociais e instrumentos de participação democrática.', 'centralizado o poder político no Executivo federal.', 'eliminado a autonomia dos municípios brasileiros.', 'mantido a censura prévia aos meios de comunicação.', 'B'),
('Natureza', 'Ecologia', 'O aumento da concentração de nutrientes, sobretudo nitrogênio e fósforo, em um lago provoca a proliferação acelerada de algas na superfície. Com o tempo, observa-se mortandade de peixes no corpo d''água.

A mortandade descrita ocorre principalmente porque a proliferação de algas', 'eleva a temperatura média da água do lago.', 'reduz a disponibilidade de oxigênio dissolvido na água.', 'aumenta a salinidade da água superficial.', 'impede a evaporação da água do lago.', 'diminui a quantidade de matéria orgânica disponível.', 'B'),
('Linguagens', 'Interpretação de texto', '"Não é a linguagem que espelha o mundo; é o mundo que se organiza pela linguagem que usamos para nomeá-lo."

No trecho, o autor defende que a linguagem exerce papel', 'meramente decorativo na comunicação cotidiana.', 'secundário em relação à percepção sensorial.', 'constitutivo na forma como interpretamos a realidade.', 'restrito aos contextos formais de escrita.', 'irrelevante na construção de identidades sociais.', 'C');