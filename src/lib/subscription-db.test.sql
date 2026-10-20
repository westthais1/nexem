-- Integration assertions run in a transaction and rolled back; no real account is changed.
BEGIN;
DO $$
DECLARE test_user uuid := gen_random_uuid(); accepted boolean; i integer;
BEGIN
 PERFORM set_config('request.jwt.claim.sub', test_user::text, true);
 FOR i IN 1..3 LOOP
  accepted := public.reserve_nexem_tutor_consultation(gen_random_uuid());
  IF NOT accepted THEN RAISE EXCEPTION 'Free consultation % must be allowed', i; END IF;
 END LOOP;
 IF public.reserve_nexem_tutor_consultation(gen_random_uuid()) THEN RAISE EXCEPTION 'Fourth free consultation must be denied'; END IF;
 UPDATE public.nexem_tutor_transactions SET created_at = now() - interval '24 hours' WHERE user_id = test_user;
 IF NOT public.reserve_nexem_tutor_consultation(gen_random_uuid()) THEN RAISE EXCEPTION '24-hour window must renew'; END IF;
 INSERT INTO public.nexem_subscriptions(user_id,tier,status,current_period_end) VALUES(test_user,'premium','active',now() + interval '1 day');
 FOR i IN 1..5 LOOP
  IF NOT public.reserve_nexem_tutor_consultation(gen_random_uuid()) THEN RAISE EXCEPTION 'Premium consultation must be unlimited'; END IF;
 END LOOP;
 UPDATE public.nexem_subscriptions SET current_period_end = now() WHERE user_id = test_user;
 IF public.reserve_nexem_tutor_consultation(gen_random_uuid()) THEN RAISE EXCEPTION 'Expired premium must be free'; END IF;
 IF has_table_privilege('authenticated','public.nexem_subscriptions','INSERT') THEN RAISE EXCEPTION 'Users cannot self-upgrade'; END IF;
 IF has_table_privilege('authenticated','public.nexem_tutor_transactions','UPDATE') THEN RAISE EXCEPTION 'Users cannot reset usage'; END IF;
END $$;
ROLLBACK;