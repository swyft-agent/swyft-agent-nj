-- Fix Supabase Storage RLS policies for documents bucket

-- First, check if storage policies exist and drop them
DO $$
BEGIN
    -- Drop existing storage policies if they exist
    DROP POLICY IF EXISTS "Users can upload files to their company folder" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view files from their company folder" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete files from their company folder" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view uploaded files" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Create storage policies for the documents bucket
CREATE POLICY "Users can upload files to their company folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'uploads'
  );

CREATE POLICY "Users can view files from their company folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete files from their company folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'uploads'
  );

-- Alternative: Make the bucket public (simpler approach)
-- Uncomment the line below if you want to make the bucket public instead
-- UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- Ensure the documents bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
