REVOKE SELECT ON public.daily_challenge_runs FROM authenticated;
GRANT SELECT (user_id,day,thetas,answers,combo,best_combo,combo_xp,base_xp,chest_xp,mission_xp,stars,completed_at) ON public.daily_challenge_runs TO authenticated;
CREATE OR REPLACE FUNCTION public.record_verified_training(p_user uuid,p_question text,p_correct boolean,p_subject text,p_difficulty text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF EXISTS(SELECT 1 FROM public.student_activity_events WHERE user_id=p_user AND reward_key='training:'||p_question) THEN RETURN; END IF;
 INSERT INTO public.enem_user_attempts(user_id,question_id,foi_correto,materia_questao,dificuldade_questao) VALUES(p_user,p_question,p_correct,p_subject,p_difficulty);
 PERFORM public.record_training_answer(p_user,p_question,p_correct);
END $$;
REVOKE ALL ON FUNCTION public.record_verified_training(uuid,text,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_training(uuid,text,boolean,text,text) TO service_role;
COMMENT ON COLUMN public.daily_challenge_runs.questions IS 'Private answer keys: only service-role server handlers may read; student DTOs redact unanswered keys.';