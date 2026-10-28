import { supabase } from '@/integrations/supabase/client';
import { onboardingAnswersSchema, type OnboardingAnswers, type StudyDay } from './student-onboarding';

export type StudentProfile = { userId: string; answers: OnboardingAnswers; step: number; completed: boolean; schedule: StudyDay[] | null; needsRegeneration: boolean };
export async function fetchStudentProfile(userId: string): Promise<StudentProfile> {
  const { data, error } = await supabase.from('student_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { userId, answers: onboardingAnswersSchema.parse(data?.answers ?? {}), step: data?.onboarding_step ?? 0, completed: data?.onboarding_completed ?? false, schedule: data?.schedule as StudyDay[] | null ?? null, needsRegeneration: data?.schedule_needs_regeneration ?? false };
}