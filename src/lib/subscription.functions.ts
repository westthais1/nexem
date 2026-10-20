import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readSubscription } = await import('./subscription.server');
    return { userId: context.userId, tier: await readSubscription(context.supabase, context.userId) };
  });

export const getPremiumQuestionPool = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requirePremium } = await import('./subscription.server');
    await requirePremium(context.supabase, context.userId);
    const { questionsSupabase } = await import('./external-supabase');
    const { data, error } = await questionsSupabase.from('enem_provas')
      .select('id,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,explicacao,dificuldade,materia,area_conhecimento,imagem_url')
      .eq('nome_prova', 'Banco Geral Nexem');
    if (error) throw new Error('Não conseguimos carregar o banco de questões.');
    return data ?? [];
  });