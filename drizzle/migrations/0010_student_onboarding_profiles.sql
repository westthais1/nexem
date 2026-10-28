CREATE TABLE public.student_profiles (
 user_id uuid PRIMARY KEY,
 answers jsonb NOT NULL DEFAULT '{}'::jsonb,
 area_levels jsonb NOT NULL DEFAULT '{}'::jsonb,
 availability jsonb NOT NULL DEFAULT '{}'::jsonb,
 onboarding_step integer NOT NULL DEFAULT 0,
 onboarding_completed boolean NOT NULL DEFAULT false,
 consent_at timestamptz,
 summary_confirmed_at timestamptz,
 schedule jsonb,
 schedule_needs_regeneration boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads student profile" ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts student profile" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates student profile" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE FUNCTION public.validate_student_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF jsonb_typeof(NEW.answers) <> 'object' OR jsonb_typeof(NEW.area_levels) <> 'object' OR jsonb_typeof(NEW.availability) <> 'object' OR octet_length(NEW.answers::text) > 24000 OR NEW.onboarding_step NOT BETWEEN 0 AND 40 THEN RAISE EXCEPTION 'Invalid student profile'; END IF;
 IF NEW.onboarding_completed AND (NEW.consent_at IS NULL OR NEW.summary_confirmed_at IS NULL OR NEW.schedule IS NULL) THEN RAISE EXCEPTION 'Confirm profile before completion'; END IF;
 NEW.updated_at := now();
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_student_profile BEFORE INSERT OR UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.validate_student_profile();