import { createClient } from "@supabase/supabase-js";

/**
 * Cliente dedicado para leitura pública da tabela `public.enem_tutor`
 * no projeto Supabase externo do usuário.
 *
 * A chave `anon` é pública por design (role anon, RLS de leitura) e pode
 * ficar no bundle do navegador — não é a chave de serviço.
 */
const EXTERNAL_SUPABASE_URL = "https://taguoozbkpecfdjkmdbh.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ3Vvb3pia3BlY2ZkamttZGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTA2MTksImV4cCI6MjEwMzkyNjYxOX0.dhkVHuv7yfwbTAZvvxcuciS3pHV1cBJ49jq-j8YoyXE";

export const questionsSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: undefined,
    persistSession: false,
    autoRefreshToken: false,
  },
});
