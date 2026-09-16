-- 1. Ownership column for essays
ALTER TABLE public.enem_essays ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. User-scoped policies (service_role policies remain for server writes)
GRANT SELECT, INSERT ON public.enem_essays TO authenticated;
CREATE POLICY "Users read own essays" ON public.enem_essays
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own essays" ON public.enem_essays
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.enem_exam_attempts TO authenticated;
CREATE POLICY "Users read own exam attempts" ON public.enem_exam_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exam attempts" ON public.enem_exam_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.enem_user_attempts TO authenticated;
CREATE POLICY "Users read own question attempts" ON public.enem_user_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own question attempts" ON public.enem_user_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. TRI profiles: remove public read, scope to owner
DROP POLICY IF EXISTS "Public read access to tri profiles" ON public.user_tri_profiles;
REVOKE ALL ON public.user_tri_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.user_tri_profiles TO authenticated;
CREATE POLICY "Users read own tri profile" ON public.user_tri_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tri profile" ON public.user_tri_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tri profile" ON public.user_tri_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Storage: essay photos scoped to the uploader's own folder
DROP POLICY IF EXISTS "Leitura publica de fotos de redacao" ON storage.objects;
DROP POLICY IF EXISTS "Envio publico de fotos de redacao" ON storage.objects;
CREATE POLICY "Users read own essay photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'redacao-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own essay photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'redacao-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own essay photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'redacao-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. SECURITY DEFINER trigger functions must not be callable from the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;