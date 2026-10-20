CREATE TABLE public.nexem_subscriptions (
 user_id uuid PRIMARY KEY,
 tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premium')),
 status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','canceled','past_due')),
 current_period_end timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nexem_subscriptions TO authenticated;
GRANT ALL ON public.nexem_subscriptions TO service_role;
ALTER TABLE public.nexem_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read subscription" ON public.nexem_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service manages subscription" ON public.nexem_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.nexem_tutor_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','succeeded','failed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
GRANT SELECT ON public.nexem_tutor_transactions TO authenticated;
GRANT ALL ON public.nexem_tutor_transactions TO service_role;
ALTER TABLE public.nexem_tutor_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read tutor usage" ON public.nexem_tutor_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service manages tutor usage" ON public.nexem_tutor_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX nexem_tutor_usage_window ON public.nexem_tutor_transactions (user_id, created_at);
CREATE FUNCTION public.reserve_nexem_tutor_consultation(p_request_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid(); premium boolean; used integer;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(caller::text, 0));
 IF EXISTS (SELECT 1 FROM public.nexem_tutor_transactions WHERE id = p_request_id) THEN RETURN false; END IF;
 SELECT EXISTS (SELECT 1 FROM public.nexem_subscriptions WHERE user_id = caller AND tier = 'premium' AND status = 'active' AND current_period_end > now()) INTO premium;
 SELECT count(*) INTO used FROM public.nexem_tutor_transactions WHERE user_id = caller AND created_at > now() - interval '24 hours' AND status IN ('reserved','succeeded');
 IF NOT premium AND used >= 3 THEN RETURN false; END IF;
 INSERT INTO public.nexem_tutor_transactions(id, user_id) VALUES (p_request_id, caller);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_nexem_tutor_consultation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_nexem_tutor_consultation(uuid) TO authenticated;
