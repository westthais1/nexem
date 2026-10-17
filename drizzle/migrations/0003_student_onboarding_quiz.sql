ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_grade text,
  ADD COLUMN IF NOT EXISTS learning_goal text,
  ADD COLUMN IF NOT EXISTS target_score integer,
  ADD COLUMN IF NOT EXISTS quiz_completed_at timestamptz;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_target_score_range CHECK (target_score IS NULL OR target_score BETWEEN 0 AND 1000);
COMMENT ON COLUMN public.profiles.quiz_completed_at IS 'Completion of the student onboarding quiz, independent from first challenge onboarding.';