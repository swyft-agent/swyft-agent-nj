-- Drop existing policies if they exist to allow re-running the script
DROP POLICY IF EXISTS "Users can view tenants from their company" ON tenants;
DROP POLICY IF EXISTS "Users can insert tenants for their company" ON tenants;
DROP POLICY IF EXISTS "Users can update tenants from their company" ON tenants;
DROP POLICY IF EXISTS "Users can delete tenants from their company" ON tenants;

-- Enable RLS on tenants table (idempotent)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can only see tenants from their company
CREATE POLICY "Users can view tenants from their company" ON tenants
    FOR SELECT
    USING (
        company_account_id IN (
            SELECT company_account_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Policy for INSERT: Users can only insert tenants for their company
CREATE POLICY "Users can insert tenants for their company" ON tenants
    FOR INSERT
    WITH CHECK (
        company_account_id IN (
            SELECT company_account_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Policy for UPDATE: Users can only update tenants from their company
CREATE POLICY "Users can update tenants from their company" ON tenants
    FOR UPDATE
    USING (
        company_account_id IN (
            SELECT company_account_id
            FROM users
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        company_account_id IN (
            SELECT company_account_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Policy for DELETE: Users can only delete tenants from their company
CREATE POLICY "Users can delete tenants from their company" ON tenants
    FOR DELETE
    USING (
        company_account_id IN (
            SELECT company_account_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Create storage policies for documents bucket
-- Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload documents for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;

-- Policy for storage: Users can upload documents for their company
CREATE POLICY "Users can upload documents for their company" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL
    );

-- Policy for storage: Users can view documents they uploaded
CREATE POLICY "Users can view their documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL
    );

-- Policy for storage: Users can update their documents
CREATE POLICY "Users can update their documents" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL
    );

-- Policy for storage: Users can delete their documents
CREATE POLICY "Users can delete their documents" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents' AND
        auth.uid() IS NOT NULL
    );
