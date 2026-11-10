CREATE OR REPLACE FUNCTION public.record_training_answer(p_user uuid,p_question text,p_correct boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF EXISTS(SELECT 1 FROM public.student_activity_events WHERE user_id=p_user AND reward_key='training:'||p_question) THEN RETURN; END IF;
 INSERT INTO public.student_xp(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 UPDATE public.student_xp SET answer_combo=CASE WHEN p_correct THEN answer_combo+1 ELSE 0 END WHERE user_id=p_user;
 PERFORM public.reward_student_once(p_user,'training:'||p_question,'questao',CASE WHEN p_correct THEN 10 ELSE 0 END,'Questão do Treine com Tutor Nex');
 -- record_activity checks achievements for this verified answer, including combo10.
END $$;
REVOKE ALL ON FUNCTION public.record_training_answer(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_training_answer(uuid,text,boolean) TO service_role;