CREATE TABLE public.mastery_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_slug text NOT NULL,
  theta integer NOT NULL DEFAULT 0,
  respondidas integer NOT NULL DEFAULT 0,
  acertos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mastery_progress TO authenticated;
GRANT ALL ON public.mastery_progress TO service_role;

ALTER TABLE public.mastery_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mastery progress" ON public.mastery_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mastery progress" ON public.mastery_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mastery progress" ON public.mastery_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages mastery progress" ON public.mastery_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_mastery_progress_updated_at
  BEFORE UPDATE ON public.mastery_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();