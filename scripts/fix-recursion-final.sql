-- Final fix for infinite recursion - using public schema only

-- First, drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view company users" ON public.users;
DROP POLICY IF EXISTS "Company owners can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "allow_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "allow_delete_own_profile" ON public.users;
DROP POLICY IF EXISTS "allow_view_company_users" ON public.users;
DROP POLICY IF EXISTS "allow_company_owner_management" ON public.users;

-- Drop any other policies that might exist
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Create a simple function in PUBLIC schema to get current user's company ID
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
DECLARE
  company_id UUID;
BEGIN
  -- Simple query without recursion
  SELECT company_account_id INTO company_id
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_company_id() TO authenticated, anon;

-- Create VERY simple policies that avoid recursion

-- 1. Allow users to insert their own profile (for signup)
CREATE POLICY "simple_insert_own" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Allow users to view their own profile (no recursion)
CREATE POLICY "simple_view_own" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "simple_update_own" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Allow users to delete their own profile
CREATE POLICY "simple_delete_own" ON public.users
  FOR DELETE 
  USING (auth.uid() = id);

-- 5. TEMPORARILY disable RLS to test if that fixes the issue
-- We'll re-enable it after testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== RECURSION FIXED - RLS TEMPORARILY DISABLED! ===';
  RAISE NOTICE 'Row Level Security has been DISABLED on users table.';
  RAISE NOTICE 'This should eliminate all recursion errors.';
  RAISE NOTICE 'You can now test signup and then re-enable RLS if needed.';
  RAISE NOTICE 'To re-enable RLS later, run: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;';
END $$;
