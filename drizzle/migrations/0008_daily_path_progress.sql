CREATE TABLE public.daily_path_progress (
  user_id uuid PRIMARY KEY,
  box integer NOT NULL DEFAULT 0,
  last_awarded_day date,
  last_jump integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_path_progress TO authenticated;
GRANT ALL ON public.daily_path_progress TO service_role;
ALTER TABLE public.daily_path_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads path" ON public.daily_path_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.advance_daily_path(p_acertos integer, p_day date)
RETURNS TABLE(new_box integer, jumped integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  j integer;
  cur_box integer;
  last_day date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  j := CASE WHEN p_acertos >= 9 THEN 2 WHEN p_acertos >= 7 THEN 1 ELSE 0 END;
  INSERT INTO public.daily_path_progress(user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT d.box, d.last_awarded_day INTO cur_box, last_day FROM public.daily_path_progress d WHERE d.user_id = uid FOR UPDATE;
  IF last_day IS NOT DISTINCT FROM p_day THEN
    RETURN QUERY SELECT cur_box, 0; RETURN;
  END IF;
  UPDATE public.daily_path_progress d SET box = LEAST(d.box + j, 25), last_awarded_day = p_day, last_jump = j, updated_at = now()
    WHERE d.user_id = uid RETURNING d.box INTO cur_box;
  RETURN QUERY SELECT cur_box, j;
END $$;
REVOKE EXECUTE ON FUNCTION public.advance_daily_path(integer, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_daily_path(integer, date) TO authenticated;