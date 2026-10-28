import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StudentOnboarding, PersonalSchedule } from '@/components/StudentOnboarding';
import { fetchStudentProfile, type StudentProfile } from '@/lib/student-profile';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, CalendarDays } from 'lucide-react';

export const Route = createFileRoute('/perfil')({
  head: () => ({ meta: [{ title: 'Seu perfil e cronograma — Nexem' }, { name: 'description', content: 'Revise suas metas, disponibilidade e preferências e personalize seu cronograma para o ENEM.' }, { property: 'og:title', content: 'Seu perfil e cronograma — Nexem' }, { property: 'og:description', content: 'Sua preparação para o ENEM, no seu ritmo e com suas metas.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: ProfilePage,
});
function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    supabase.auth.getUser().then(async ({ data }) => { if (!data.user) return; const p = await fetchStudentProfile(data.user.id); if (active) setProfile(p); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [retry]);
  if (error) return <main className="p-6"><p role="alert">Não conseguimos carregar seu perfil.</p><Button className="mt-4" onClick={() => setRetry(retry + 1)}>Tentar novamente</Button></main>;
  if (!profile) return <p role="status" className="p-6 text-muted-foreground">Carregando seu perfil…</p>;
  if (editing) return <StudentOnboarding profile={profile} editing onComplete={() => { setEditing(false); setRetry(retry + 1); }} />;
  return <main className="mx-auto w-full max-w-4xl px-5 py-8"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-normal">Seu perfil Nexem</h1><p className="mt-2 text-muted-foreground">{profile.answers.name} · Meta: {profile.answers.targetScore} pontos</p></div><Button onClick={() => setEditing(true)}><Pencil />Editar meu perfil</Button></div>{profile.needsRegeneration && <div role="status" className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4"><p>Seu perfil mudou. Quer ajustar o cronograma às novas respostas?</p><Button variant="outline" className="mt-3" onClick={() => setEditing(true)}><CalendarDays />Revisar e regenerar</Button></div>}{profile.schedule && <PersonalSchedule schedule={profile.schedule} />}<Button variant="ghost" className="mt-8" onClick={() => navigate({ to: '/' })}>Voltar ao início</Button></main>;
}