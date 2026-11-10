ALTER TABLE public.student_xp ADD COLUMN streak_shields integer NOT NULL DEFAULT 0;
ALTER TABLE public.student_xp ADD COLUMN shield_day date;
ALTER TABLE public.student_xp ADD COLUMN answer_combo integer NOT NULL DEFAULT 0;
ALTER TABLE public.student_xp ADD COLUMN weekly_goal integer NOT NULL DEFAULT 200;
ALTER TABLE public.student_activity_events ADD COLUMN reward_key text;
CREATE UNIQUE INDEX activity_reward_once ON public.student_activity_events(user_id, reward_key) WHERE reward_key IS NOT NULL;
CREATE TABLE public.student_achievements (user_id uuid NOT NULL, achievement_key text NOT NULL, earned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, achievement_key));
GRANT SELECT ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads achievements" ON public.student_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.daily_challenge_runs (user_id uuid NOT NULL, day date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date, questions jsonb NOT NULL DEFAULT '[]', thetas jsonb NOT NULL DEFAULT '{}', answers jsonb NOT NULL DEFAULT '[]', combo integer NOT NULL DEFAULT 0, best_combo integer NOT NULL DEFAULT 0, combo_xp integer NOT NULL DEFAULT 0, base_xp integer NOT NULL DEFAULT 0, chest_xp integer NOT NULL DEFAULT 0, mission_xp integer NOT NULL DEFAULT 0, stars integer NOT NULL DEFAULT 0, completed_at timestamptz, PRIMARY KEY(user_id, day));
GRANT SELECT ON public.daily_challenge_runs TO authenticated;
GRANT ALL ON public.daily_challenge_runs TO service_role;
ALTER TABLE public.daily_challenge_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads daily run" ON public.daily_challenge_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.student_daily_missions (user_id uuid NOT NULL, day date NOT NULL, mission_key text NOT NULL, progress integer NOT NULL DEFAULT 0, target integer NOT NULL, rewarded_at timestamptz, PRIMARY KEY(user_id, day, mission_key));
GRANT SELECT ON public.student_daily_missions TO authenticated;
GRANT ALL ON public.student_daily_missions TO service_role;
ALTER TABLE public.student_daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads missions" ON public.student_daily_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.record_activity(p_user uuid, p_kind text, p_xp integer, p_label text, p_subject text)
RETURNS public.student_xp LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; r public.student_xp; x integer := GREATEST(0, LEAST(COALESCE(p_xp,0),300)); k text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 INSERT INTO public.student_xp(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM public.student_xp WHERE user_id=p_user FOR UPDATE;
 IF r.last_active_day IS DISTINCT FROM d THEN
  IF r.last_active_day=d-2 AND r.streak_shields>0 THEN
   r.streak_shields:=r.streak_shields-1; r.shield_day:=d-1;
   INSERT INTO public.student_activity_events(user_id,kind,xp,label,reward_key) VALUES(p_user,'escudoConsumido',0,'Escudo protegeu sua sequência','shield-use:'||d) ON CONFLICT DO NOTHING;
   r.streak:=r.streak+1;
  ELSIF r.last_active_day=d-1 THEN r.streak:=r.streak+1; ELSE r.streak:=1; END IF;
  IF r.streak%7=0 THEN
   r.streak_shields:=r.streak_shields+1;
   INSERT INTO public.student_activity_events(user_id,kind,xp,label,reward_key) VALUES(p_user,'escudoGanho',0,'Novo escudo de sequência','shield-earn:'||d) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 UPDATE public.student_xp SET total_xp=total_xp+x,streak=GREATEST(1,r.streak),best_streak=GREATEST(best_streak,r.streak),last_active_day=d,last_activity=COALESCE(p_label,last_activity),streak_shields=r.streak_shields,shield_day=r.shield_day,updated_at=now() WHERE user_id=p_user RETURNING * INTO r;
 INSERT INTO public.study_activity_days(user_id,day) VALUES(p_user,d) ON CONFLICT DO NOTHING;
 INSERT INTO public.student_activity_events(user_id,kind,xp,label,subject) VALUES(p_user,p_kind,x,p_label,p_subject);
 IF p_kind NOT IN ('conquista','missao','bauDiario','combo') THEN
  FOR k IN SELECT key FROM (VALUES
   ('streak7',r.streak>=7),
   ('combo10',r.answer_combo>=10),
   ('boss',EXISTS(SELECT 1 FROM public.daily_challenge_runs WHERE user_id=p_user AND completed_at IS NOT NULL AND (answers->8->>'correto')::boolean AND (answers->9->>'correto')::boolean)),
   ('essay800',p_kind='redacao' AND EXISTS(SELECT 1 FROM public.enem_essays WHERE user_id=p_user AND nota_total>=800)),
   ('exam',p_kind='provaCompleta' AND EXISTS(SELECT 1 FROM public.enem_exam_attempts WHERE user_id=p_user AND total_questoes>0))
  ) AS conditions(key,eligible) WHERE eligible LOOP
   INSERT INTO public.student_achievements(user_id,achievement_key) VALUES(p_user,k) ON CONFLICT DO NOTHING;
   IF FOUND THEN
    INSERT INTO public.student_activity_events(user_id,kind,xp,label,reward_key) VALUES(p_user,'conquista',20,CASE k WHEN 'streak7' THEN 'Primeira sequência de 7' WHEN 'combo10' THEN '10 acertos seguidos' WHEN 'boss' THEN 'Chefe derrotado' WHEN 'essay800' THEN 'Redação 800+' ELSE 'Prova Completa concluída' END,'achievement:'||k);
    UPDATE public.student_xp SET total_xp=total_xp+20 WHERE user_id=p_user;
   END IF;
  END LOOP;
 END IF;
 SELECT * INTO r FROM public.student_xp WHERE user_id=p_user;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.reward_student_once(p_user uuid,p_key text,p_kind text,p_xp integer,p_label text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF EXISTS(SELECT 1 FROM public.student_activity_events WHERE user_id=p_user AND reward_key=p_key) THEN RETURN false; END IF;
 PERFORM public.record_activity(p_user,p_kind,p_xp,p_label,'');
 UPDATE public.student_activity_events SET reward_key=p_key WHERE id=(SELECT id FROM public.student_activity_events WHERE user_id=p_user AND kind=p_kind AND reward_key IS NULL ORDER BY created_at DESC LIMIT 1);
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.progress_daily_mission(p_user uuid,p_key text,p_progress integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; m public.student_daily_missions;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF p_key NOT IN ('combo3','boss','review') THEN RAISE EXCEPTION 'invalid mission'; END IF;
 INSERT INTO public.student_daily_missions(user_id,day,mission_key,target) VALUES(p_user,d,p_key,CASE p_key WHEN 'combo3' THEN 3 WHEN 'boss' THEN 2 ELSE 1 END) ON CONFLICT DO NOTHING;
 UPDATE public.student_daily_missions SET progress=LEAST(target,GREATEST(progress,p_progress)) WHERE user_id=p_user AND day=d AND mission_key=p_key RETURNING * INTO m;
 IF m.progress>=m.target AND m.rewarded_at IS NULL THEN
  IF public.reward_student_once(p_user,'mission:'||d||':'||p_key,'missao',10,CASE p_key WHEN 'combo3' THEN 'Missão: 3 acertos seguidos' WHEN 'boss' THEN 'Missão: conclua o chefe final' ELSE 'Missão: revise um erro no Tutor' END) THEN
   UPDATE public.student_daily_missions SET rewarded_at=now() WHERE user_id=p_user AND day=d AND mission_key=p_key;
   UPDATE public.daily_challenge_runs SET mission_xp=mission_xp+10 WHERE user_id=p_user AND day=d;
  END IF;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.start_daily_run(p_user uuid,p_questions jsonb,p_thetas jsonb)
RETURNS public.daily_challenge_runs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.daily_challenge_runs; d date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 IF jsonb_array_length(p_questions)<>10 THEN RAISE EXCEPTION 'ten questions required'; END IF;
 INSERT INTO public.daily_challenge_runs(user_id,day,questions,thetas) VALUES(p_user,d,p_questions,p_thetas) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM public.daily_challenge_runs WHERE user_id=p_user AND day=d;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.submit_daily_answer(p_user uuid,p_index integer,p_letter text)
RETURNS public.daily_challenge_runs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; r public.daily_challenge_runs; q jsonb; correct boolean; n integer; hits integer; bonus integer; consistent boolean; inv boolean; tr text; theta integer; accuracy numeric; delta integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 SELECT * INTO r FROM public.daily_challenge_runs WHERE user_id=p_user AND day=d FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'run missing'; END IF;
 n:=jsonb_array_length(r.answers);
 IF p_index<n THEN RETURN r; END IF;
 IF p_index<>n OR n>=10 OR p_letter NOT IN ('A','B','C','D','E') THEN RAISE EXCEPTION 'invalid answer'; END IF;
 q:=r.questions->n; correct:=p_letter=upper(trim(q->>'resposta_correta'));
 tr:=q->>'track';
 r.combo:=CASE WHEN correct THEN r.combo+1 ELSE 0 END;
 r.best_combo:=GREATEST(r.best_combo,r.combo);
 bonus:=GREATEST(0,LEAST(3,r.combo-1,15-r.combo_xp));
 r.answers:=r.answers||jsonb_build_array(jsonb_build_object('questionId',q->>'id','letra',p_letter,'correto',correct,'dificuldade',q->'dificuldade','track',tr,'xp',bonus));
 UPDATE public.daily_challenge_runs SET answers=r.answers,combo=r.combo,best_combo=r.best_combo,combo_xp=combo_xp+bonus WHERE user_id=p_user AND day=d;
 INSERT INTO public.enem_user_attempts(user_id,question_id,dificuldade_questao,materia_questao,foi_correto) VALUES(p_user,q->>'id',q->>'dificuldade',COALESCE(q->>'materia',q->>'area_conhecimento'),correct);
 INSERT INTO public.student_xp(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 UPDATE public.student_xp SET answer_combo=CASE WHEN correct THEN answer_combo+1 ELSE 0 END WHERE user_id=p_user;
 PERFORM public.record_activity(p_user,'questao',0,'Questão do Desafio Diário',COALESCE(q->>'materia',''));
 IF bonus>0 THEN PERFORM public.reward_student_once(p_user,'combo:'||d||':'||n,'combo',bonus,'Combo x'||r.combo); END IF;
 PERFORM public.progress_daily_mission(p_user,'combo3',r.best_combo);
 IF n>=8 THEN PERFORM public.progress_daily_mission(p_user,'boss',n-7); END IF;
 IF n=9 THEN
  SELECT count(*) FILTER(WHERE (a->>'correto')::boolean), (count(*) FILTER(WHERE (a->>'correto')::boolean AND (a->>'dificuldade')::integer>75)>0 AND count(*) FILTER(WHERE NOT (a->>'correto')::boolean AND (a->>'dificuldade')::integer<40)>0) INTO hits,inv FROM jsonb_array_elements(r.answers) a;
  consistent:=hits>=9 AND NOT inv;
  UPDATE public.daily_challenge_runs SET completed_at=now(),base_xp=CASE WHEN consistent THEN 150 ELSE 75 END,chest_xp=25,stars=CASE WHEN hits>=9 THEN 3 WHEN hits>=6 THEN 2 ELSE 1 END WHERE user_id=p_user AND day=d;
  PERFORM public.reward_student_once(p_user,'daily:'||d,'desafioDiario',CASE WHEN consistent THEN 150 ELSE 75 END,'Desafio Diário concluído');
  PERFORM public.reward_student_once(p_user,'chest:'||d,'bauDiario',25,'Baú diário aberto');
  INSERT INTO public.daily_path_progress(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
  UPDATE public.daily_path_progress SET box=LEAST(25,box+CASE WHEN hits>=9 THEN 2 WHEN hits>=7 THEN 1 ELSE 0 END),last_awarded_day=d,last_jump=CASE WHEN hits>=9 THEN 2 WHEN hits>=7 THEN 1 ELSE 0 END,updated_at=now() WHERE user_id=p_user AND last_awarded_day IS DISTINCT FROM d;
  FOR tr IN SELECT unnest(ARRAY['matematica','linguagens','humanas','natureza']) LOOP
   theta:=COALESCE((r.thetas->>tr)::integer,50);
   FOR delta,accuracy IN SELECT CASE WHEN (a->>'correto')::boolean THEN 1 ELSE 0 END, (SELECT avg(CASE WHEN (b->>'correto')::boolean THEN 1 ELSE 0 END) FROM jsonb_array_elements(r.answers) WITH ORDINALITY w(b,j) WHERE j BETWEEN GREATEST(1,i-4) AND i) FROM jsonb_array_elements(r.answers) WITH ORDINALITY t(a,i) WHERE a->>'track'=tr ORDER BY i LOOP
    theta:=GREATEST(1,LEAST(100,theta+CASE WHEN delta=1 THEN CASE WHEN accuracy>=0.6 THEN 12 ELSE 6 END ELSE CASE WHEN accuracy<0.4 THEN -12 ELSE -6 END END));
   END LOOP;
   UPDATE public.student_area_progress SET theta_matematica=CASE WHEN tr='matematica' THEN theta ELSE theta_matematica END,theta_linguagens=CASE WHEN tr='linguagens' THEN theta ELSE theta_linguagens END,theta_humanas=CASE WHEN tr='humanas' THEN theta ELSE theta_humanas END,theta_natureza=CASE WHEN tr='natureza' THEN theta ELSE theta_natureza END,last_played_date=d,tri_consistency_rate=round(hits*10*CASE WHEN inv THEN 0.6 ELSE 1 END),updated_at=now() WHERE user_id=p_user;
  END LOOP;
 END IF;
 SELECT * INTO r FROM public.daily_challenge_runs WHERE user_id=p_user AND day=d;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.review_daily_error(p_user uuid,p_day date,p_question text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.daily_challenge_runs r,jsonb_array_elements(r.answers) a WHERE r.user_id=p_user AND r.day=p_day AND a->>'questionId'=p_question AND NOT (a->>'correto')::boolean) THEN PERFORM public.progress_daily_mission(p_user,'review',1); END IF;
END $$;
CREATE OR REPLACE FUNCTION public.set_weekly_xp_goal(p_user uuid,p_goal integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_goal NOT IN (100,200,300) THEN RAISE EXCEPTION 'invalid goal'; END IF;
 INSERT INTO public.student_xp(user_id,weekly_goal) VALUES(p_user,p_goal) ON CONFLICT(user_id) DO UPDATE SET weekly_goal=p_goal,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.reward_student_once(uuid,text,text,integer,text), public.progress_daily_mission(uuid,text,integer), public.start_daily_run(uuid,jsonb,jsonb), public.submit_daily_answer(uuid,integer,text), public.review_daily_error(uuid,date,text), public.set_weekly_xp_goal(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reward_student_once(uuid,text,text,integer,text), public.progress_daily_mission(uuid,text,integer), public.start_daily_run(uuid,jsonb,jsonb), public.submit_daily_answer(uuid,integer,text), public.review_daily_error(uuid,date,text), public.set_weekly_xp_goal(uuid,integer) TO service_role;
REVOKE ALL ON FUNCTION public.advance_daily_path(integer,date) FROM authenticated;
COMMENT ON FUNCTION public.advance_daily_path(integer,date) IS 'DEPRECATED: progression is awarded by submit_daily_answer from server-graded daily runs.';
REVOKE ALL ON FUNCTION public.import_browser_xp(uuid,integer,integer,integer,date,text,date[]) FROM service_role;
COMMENT ON FUNCTION public.import_browser_xp(uuid,integer,integer,integer,date,text,date[]) IS 'DEPRECATED: browser imports retired; rewards and streak are server authoritative.';