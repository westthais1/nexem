CREATE TABLE public.student_xp (
  user_id uuid PRIMARY KEY,
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  last_active_day date,
  last_activity text,
  browser_imported_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.student_xp TO authenticated;
GRANT ALL ON public.student_xp TO service_role;
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads xp" ON public.student_xp FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.student_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  label text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX student_activity_events_user_idx ON public.student_activity_events(user_id, created_at DESC);
GRANT SELECT ON public.student_activity_events TO authenticated;
GRANT ALL ON public.student_activity_events TO service_role;
ALTER TABLE public.student_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads activity events" ON public.student_activity_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.student_area_progress (
  user_id uuid PRIMARY KEY,
  theta_matematica integer NOT NULL DEFAULT 50,
  theta_linguagens integer NOT NULL DEFAULT 50,
  theta_humanas integer NOT NULL DEFAULT 50,
  theta_natureza integer NOT NULL DEFAULT 50,
  last_played_date date,
  tri_consistency_rate numeric NOT NULL DEFAULT 100,
  source text NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.student_area_progress TO authenticated;
GRANT ALL ON public.student_area_progress TO service_role;
ALTER TABLE public.student_area_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads area progress" ON public.student_area_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts area progress" ON public.student_area_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates area progress" ON public.student_area_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_student_area_progress_updated_at BEFORE UPDATE ON public.student_area_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.enem_exam_attempts ADD COLUMN por_area jsonb;

-- Records one finished activity atomically: event, XP, streak and study day. Server-only.
CREATE OR REPLACE FUNCTION public.record_activity(p_user uuid, p_kind text, p_xp integer, p_label text, p_subject text)
RETURNS public.student_xp LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; r public.student_xp; x integer := GREATEST(0, LEAST(COALESCE(p_xp,0), 300));
BEGIN
  INSERT INTO public.student_activity_events(user_id, kind, xp, label, subject) VALUES (p_user, p_kind, x, p_label, p_subject);
  INSERT INTO public.student_xp(user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.student_xp WHERE user_id = p_user FOR UPDATE;
  IF r.last_active_day IS DISTINCT FROM d THEN
    r.streak := CASE WHEN r.last_active_day = d - 1 THEN r.streak + 1 ELSE 1 END;
  END IF;
  IF r.streak < 1 THEN r.streak := 1; END IF;
  UPDATE public.student_xp SET total_xp = total_xp + x, streak = r.streak, best_streak = GREATEST(best_streak, r.streak),
    last_active_day = d, last_activity = COALESCE(p_label, last_activity), updated_at = now()
    WHERE user_id = p_user RETURNING * INTO r;
  INSERT INTO public.study_activity_days(user_id, day) VALUES (p_user, d) ON CONFLICT DO NOTHING;
  RETURN r;
END $$;

-- One-time import of the browser cache: never lowers saved values. Server-only.
CREATE OR REPLACE FUNCTION public.import_browser_xp(p_user uuid, p_total integer, p_streak integer, p_best integer, p_last_day date, p_last_activity text, p_days date[])
RETURNS public.student_xp LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.student_xp;
BEGIN
  INSERT INTO public.student_xp(user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.student_xp WHERE user_id = p_user FOR UPDATE;
  IF r.browser_imported_at IS NOT NULL THEN RETURN r; END IF;
  UPDATE public.student_xp SET
    total_xp = GREATEST(total_xp, LEAST(GREATEST(COALESCE(p_total,0),0), 1000000)),
    best_streak = GREATEST(best_streak, COALESCE(p_best,0), COALESCE(p_streak,0)),
    streak = CASE WHEN p_last_day IS NOT NULL AND (last_active_day IS NULL OR p_last_day > last_active_day) THEN GREATEST(COALESCE(p_streak,0),0) ELSE streak END,
    last_activity = CASE WHEN p_last_day IS NOT NULL AND (last_active_day IS NULL OR p_last_day > last_active_day) THEN COALESCE(p_last_activity, last_activity) ELSE last_activity END,
    last_active_day = GREATEST(last_active_day, p_last_day),
    browser_imported_at = now(), updated_at = now()
    WHERE user_id = p_user RETURNING * INTO r;
  INSERT INTO public.study_activity_days(user_id, day)
    SELECT p_user, x FROM unnest(COALESCE(p_days, '{}')) x WHERE x <= (now() AT TIME ZONE 'America/Sao_Paulo')::date ON CONFLICT DO NOTHING;
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION public.record_activity(uuid, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.import_browser_xp(uuid, integer, integer, integer, date, text, date[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_activity(uuid, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_browser_xp(uuid, integer, integer, integer, date, text, date[]) TO service_role;