CREATE TABLE public.enem_essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema text NOT NULL,
  texto text NOT NULL,
  c1 integer NOT NULL,
  c2 integer NOT NULL,
  c3 integer NOT NULL,
  c4 integer NOT NULL,
  c5 integer NOT NULL,
  nota_total integer NOT NULL,
  feedback jsonb NOT NULL DEFAULT '[]'::jsonb,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.enem_essays TO service_role;

ALTER TABLE public.enem_essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages essays"
  ON public.enem_essays FOR ALL TO service_role
  USING (true) WITH CHECK (true);