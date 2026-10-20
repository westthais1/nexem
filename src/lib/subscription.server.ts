import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { activeTier } from './subscription';

export async function readSubscription(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from('nexem_subscriptions').select('tier,status,current_period_end').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Não conseguimos verificar sua assinatura. Tente novamente.');
  return activeTier(data);
}
export async function requirePremium(client: SupabaseClient<Database>, userId: string) {
  if (await readSubscription(client, userId) !== 'premium') throw new Error('Este treino está disponível no Nexem Pro.');
}