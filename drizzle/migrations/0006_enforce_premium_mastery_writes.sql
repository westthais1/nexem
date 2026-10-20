CREATE FUNCTION public.has_nexem_premium() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.nexem_subscriptions WHERE user_id = auth.uid() AND tier = 'premium' AND status = 'active' AND current_period_end > now())
$$;
REVOKE ALL ON FUNCTION public.has_nexem_premium() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_nexem_premium() TO authenticated;
CREATE POLICY "Mastery writes require premium" ON public.mastery_progress AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.has_nexem_premium());
CREATE POLICY "Mastery updates require premium" ON public.mastery_progress AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_nexem_premium()) WITH CHECK (public.has_nexem_premium());
CREATE POLICY "Exam writes require premium" ON public.enem_exam_attempts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.has_nexem_premium());
