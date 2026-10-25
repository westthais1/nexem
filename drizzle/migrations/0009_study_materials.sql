CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  detailed text NOT NULL DEFAULT '',
  flashcards jsonb NOT NULL DEFAULT '[]'::jsonb,
  path jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  step_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads materials" ON public.study_materials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts materials" ON public.study_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates materials" ON public.study_materials FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes materials" ON public.study_materials FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX study_materials_user_idx ON public.study_materials(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_study_material_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE premium boolean; used integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('mat' || NEW.user_id::text, 0));
  SELECT EXISTS (SELECT 1 FROM public.nexem_subscriptions WHERE user_id = NEW.user_id AND tier='premium' AND status='active' AND current_period_end > now()) INTO premium;
  IF premium THEN RETURN NEW; END IF;
  SELECT count(*) INTO used FROM public.study_materials WHERE user_id = NEW.user_id;
  IF used >= 3 THEN RAISE EXCEPTION 'FREE_LIMIT_REACHED'; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_study_material_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER study_materials_limit BEFORE INSERT ON public.study_materials FOR EACH ROW EXECUTE FUNCTION public.enforce_study_material_limit();