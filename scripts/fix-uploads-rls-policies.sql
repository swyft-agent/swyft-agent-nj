-- Fix RLS policies for uploads table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view uploads from their company" ON uploads;
DROP POLICY IF EXISTS "Users can insert uploads for their company" ON uploads;
DROP POLICY IF EXISTS "Users can update uploads from their company" ON uploads;

-- Create proper RLS policies for uploads table
CREATE POLICY "Users can view uploads from their company" ON uploads
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert uploads for their company" ON uploads
  FOR INSERT WITH CHECK (
    company_account_id IN (
      SELECT company_account_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update uploads from their company" ON uploads
  FOR UPDATE USING (
    company_account_id IN (
      SELECT company_account_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON uploads TO authenticated;
GRANT USAGE ON SEQUENCE uploads_id_seq TO authenticated;
