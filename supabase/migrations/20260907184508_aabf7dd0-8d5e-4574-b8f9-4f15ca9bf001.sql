CREATE TABLE public.enem_exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  nome_prova text NOT NULL,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  acertos integer NOT NULL,
  total_questoes integer NOT NULL,
  nota integer NOT NULL,
  tempo_gasto_segundos integer NOT NULL DEFAULT 0,
  finalizado_por_tempo boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.enem_exam_attempts TO service_role;

ALTER TABLE public.enem_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages exam attempts"
  ON public.enem_exam_attempts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);