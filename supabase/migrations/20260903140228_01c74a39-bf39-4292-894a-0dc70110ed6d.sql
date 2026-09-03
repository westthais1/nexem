CREATE TABLE public.user_tri_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  materia text NOT NULL,
  current_difficulty text NOT NULL DEFAULT 'Media',
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_tri_profiles TO anon;
GRANT SELECT ON public.user_tri_profiles TO authenticated;
GRANT ALL ON public.user_tri_profiles TO service_role;

ALTER TABLE public.user_tri_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to tri profiles"
  ON public.user_tri_profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role manages tri profiles"
  ON public.user_tri_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_tri_profiles_updated_at
BEFORE UPDATE ON public.user_tri_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_tri_profiles (materia, current_difficulty, observacao) VALUES
  ('Ciências da Natureza', 'Facil', 'Instabilidade detectada em fundamentos.'),
  ('Ciências Humanas', 'Media', 'Desempenho equilibrado.'),
  ('Linguagens', 'Media', 'Desempenho equilibrado.'),
  ('Matemática', 'Dificil', 'Alta consistência TRI nas últimas tentativas.'),
  ('Redação', 'Media', 'Desempenho equilibrado.');