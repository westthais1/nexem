CREATE TABLE public.enem_user_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  question_id text NOT NULL,
  dificuldade_questao text,
  materia_questao text,
  foi_correto boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.enem_user_attempts TO service_role;

ALTER TABLE public.enem_user_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages attempts" ON public.enem_user_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);