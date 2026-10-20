REVOKE ALL ON public.nexem_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.nexem_subscriptions TO authenticated;
GRANT ALL ON public.nexem_subscriptions TO service_role;
REVOKE ALL ON public.nexem_tutor_transactions FROM anon, authenticated;
GRANT SELECT ON public.nexem_tutor_transactions TO authenticated;
GRANT ALL ON public.nexem_tutor_transactions TO service_role;
