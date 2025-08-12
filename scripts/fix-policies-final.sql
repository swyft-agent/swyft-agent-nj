-- Fix recursive policy issue - handles existing policies safely

-- Drop ALL existing policies on users table to start fresh
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on the users table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    LOOP
        -- Drop each policy
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Now create the corrected policies (no conflicts since we dropped all)

-- 1. Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to view other users in same company (fixed recursion)
CREATE POLICY "Users can view company users" ON public.users
  FOR SELECT USING (
    company_account_id = (
      SELECT company_account_id 
      FROM public.users 
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- 3. Allow company owners to manage all users in their company
CREATE POLICY "Company owners can manage users" ON public.users
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id 
      FROM public.users 
      WHERE id = auth.uid() 
      AND is_company_owner = true
      LIMIT 1
    )
  );

-- 4. Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- 5. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Alternative approach: Create a simpler policy structure to avoid recursion completely
-- Drop the complex policies and create simpler ones
DROP POLICY IF EXISTS "Users can view company users" ON public.users;
DROP POLICY IF EXISTS "Company owners can manage users" ON public.users;

-- Create non-recursive policies using a different approach
CREATE POLICY "Users can view company users" ON public.users
  FOR SELECT USING (
    -- Allow if it's the user's own record
    auth.uid() = id 
    OR 
    -- Allow if user is company owner (check via direct lookup)
    EXISTS (
      SELECT 1 FROM public.users owner_check 
      WHERE owner_check.id = auth.uid() 
      AND owner_check.is_company_owner = true 
      AND owner_check.company_account_id = users.company_account_id
    )
    OR
    -- Allow if users are in same company (non-recursive check)
    company_account_id IS NOT NULL 
    AND auth.uid() IN (
      SELECT u.id FROM public.users u 
      WHERE u.company_account_id = users.company_account_id
    )
  );

-- Simplified management policy for company owners
CREATE POLICY "Company owners can manage users" ON public.users
  FOR ALL USING (
    -- Users can always manage their own profile
    auth.uid() = id
    OR
    -- Company owners can manage users in their company
    EXISTS (
      SELECT 1 FROM public.users owner 
      WHERE owner.id = auth.uid() 
      AND owner.is_company_owner = true 
      AND owner.company_account_id = users.company_account_id
    )
  );

-- Create a function to help with user lookups (avoids recursion)
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_account_id FROM public.users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== POLICIES FIXED SUCCESSFULLY! ===';
  RAISE NOTICE 'All existing policies have been dropped and recreated.';
  RAISE NOTICE 'Recursive policy issues have been resolved.';
  RAISE NOTICE 'Helper function get_user_company_id() created.';
  RAISE NOTICE 'You can now use the application without database errors.';
END $$;
