CREATE TABLE public.enem_config (id text PRIMARY KEY DEFAULT 'current', exam_date date, second_day date, source_url text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.enem_config TO authenticated; GRANT ALL ON public.enem_config TO service_role;
ALTER TABLE public.enem_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read exam config" ON public.enem_config FOR SELECT TO authenticated USING (true);
CREATE TABLE public.topics (id text PRIMARY KEY, area text NOT NULL, subject text NOT NULL, title text NOT NULL, exam_weight numeric NOT NULL DEFAULT 1 CHECK (exam_weight > 0), estimated_minutes integer NOT NULL DEFAULT 50 CHECK (estimated_minutes BETWEEN 25 AND 300), language text, active boolean NOT NULL DEFAULT true);
GRANT SELECT ON public.topics TO authenticated; GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read topics" ON public.topics FOR SELECT TO authenticated USING (true);
CREATE TABLE public.study_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, week_start date NOT NULL, summary text NOT NULL DEFAULT '', insights jsonb NOT NULL DEFAULT '{}', generated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,week_start));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.study_plans TO authenticated; GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plans" ON public.study_plans TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE TABLE public.study_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, plan_id uuid NOT NULL REFERENCES public.study_plans(id), topic_id text NOT NULL REFERENCES public.topics(id), date date NOT NULL, start_minutes integer NOT NULL CHECK (start_minutes BETWEEN 0 AND 1439), duration integer NOT NULL CHECK (duration BETWEEN 25 AND 50), type text NOT NULL CHECK (type IN ('Teoria','Exercícios','Revisão','Redação','Simulado')), status text NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','concluida','pulada')), format text NOT NULL DEFAULT 'Exercícios', actual_minutes integer NOT NULL DEFAULT 0 CHECK (actual_minutes BETWEEN 0 AND 720), correct integer NOT NULL DEFAULT 0, total integer NOT NULL DEFAULT 0, completed_at timestamptz, started_at timestamptz, UNIQUE(plan_id,date,start_minutes));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.study_sessions TO authenticated; GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions" ON public.study_sessions TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE INDEX study_sessions_owner_date ON public.study_sessions(user_id,date);
CREATE TABLE public.topic_mastery (user_id uuid NOT NULL, topic_id text NOT NULL REFERENCES public.topics(id), mastery numeric NOT NULL DEFAULT 0 CHECK(mastery BETWEEN 0 AND 100), last_reviewed date, next_review date, review_stage integer NOT NULL DEFAULT 0, accuracy numeric, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,topic_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.topic_mastery TO authenticated; GRANT ALL ON public.topic_mastery TO service_role;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own topic mastery" ON public.topic_mastery TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE TABLE public.study_activity_days (user_id uuid NOT NULL, day date NOT NULL, PRIMARY KEY(user_id,day));
GRANT SELECT,INSERT ON public.study_activity_days TO authenticated; GRANT ALL ON public.study_activity_days TO service_role;
ALTER TABLE public.study_activity_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own study days" ON public.study_activity_days FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Write own study days" ON public.study_activity_days FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.record_study_completion() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE cur numeric; stage integer; BEGIN
IF NEW.status='concluida' AND OLD.status<>'concluida' THEN
 IF NEW.correct<0 OR NEW.total<NEW.correct THEN RAISE EXCEPTION 'Invalid accuracy'; END IF;
 SELECT mastery,review_stage INTO cur,stage FROM public.topic_mastery WHERE user_id=NEW.user_id AND topic_id=NEW.topic_id;
 cur := COALESCE(cur,0); stage := COALESCE(stage,0);
 INSERT INTO public.topic_mastery(user_id,topic_id,mastery,last_reviewed,next_review,review_stage,accuracy) VALUES(NEW.user_id,NEW.topic_id,CASE WHEN NEW.total>0 THEN GREATEST(0,LEAST(100,cur*0.7+100.0*NEW.correct/NEW.total*0.3)) ELSE cur END,NEW.date,NEW.date+CASE WHEN stage=0 THEN 1 WHEN stage=1 THEN 7 ELSE 21 END,LEAST(stage+1,3),CASE WHEN NEW.total>0 THEN 100.0*NEW.correct/NEW.total ELSE NULL END)
 ON CONFLICT(user_id,topic_id) DO UPDATE SET mastery=excluded.mastery,last_reviewed=excluded.last_reviewed,next_review=excluded.next_review,review_stage=excluded.review_stage,accuracy=COALESCE(excluded.accuracy,topic_mastery.accuracy),updated_at=now();
 INSERT INTO public.study_activity_days(user_id,day) VALUES(NEW.user_id,(now() AT TIME ZONE 'America/Sao_Paulo')::date) ON CONFLICT DO NOTHING;
END IF; RETURN NEW; END $$;
CREATE TRIGGER record_study_completion AFTER UPDATE ON public.study_sessions FOR EACH ROW EXECUTE FUNCTION public.record_study_completion();
REVOKE EXECUTE ON FUNCTION public.record_study_completion() FROM PUBLIC,anon,authenticated;