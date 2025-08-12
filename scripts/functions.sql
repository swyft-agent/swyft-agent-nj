-- Create helper functions for setup page

-- Function to check if required tables exist
CREATE OR REPLACE FUNCTION check_tables_exist()
RETURNS boolean AS $$
DECLARE
  tables_count integer;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('company_accounts', 'users', 'buildings', 'units', 'tenants', 'notices', 'inquiries', 'transactions');
  
  RETURN tables_count = 8;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if RLS policies exist
CREATE OR REPLACE FUNCTION check_policies_exist()
RETURNS boolean AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RETURN policy_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to these functions
GRANT EXECUTE ON FUNCTION check_tables_exist TO authenticated;
GRANT EXECUTE ON FUNCTION check_tables_exist TO anon;
GRANT EXECUTE ON FUNCTION check_policies_exist TO authenticated;
GRANT EXECUTE ON FUNCTION check_policies_exist TO anon;
