-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('building-images', 'building-images', true),
  ('unit-images', 'unit-images', true),
  ('user-avatars', 'user-avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for building images
CREATE POLICY "Users can view building images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can upload building images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update building images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete building images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'building-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- Create storage policies for unit images
CREATE POLICY "Users can view unit images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'unit-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can upload unit images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'unit-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update unit images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'unit-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete unit images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'unit-images' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- Create storage policies for user avatars
CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- Create storage policies for documents
CREATE POLICY "Users can view company documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT company_account_id::text FROM public.users WHERE id = auth.uid()
    )
  );
