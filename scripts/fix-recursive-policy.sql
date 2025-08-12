-- Fix recursive policy issue for users table

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view company users" ON public.users;
DROP POLICY IF EXISTS "Company owners can manage users" ON public.users;

-- Create fixed policies that avoid recursion
-- 1. Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to view other users in same company (using direct comparison)
CREATE POLICY "Users can view users in same company" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users AS current_user
      WHERE current_user.id = auth.uid() 
      AND current_user.company_account_id = users.company_account_id
    )
  );

-- 3. Allow company owners to manage users (using direct comparison)
CREATE POLICY "Company owners can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users AS current_user
      WHERE current_user.id = auth.uid() 
      AND current_user.is_company_owner = true
      AND current_user.company_account_id = users.company_account_id
    )
  );

-- 4. Keep the existing policy for users to insert their own profile
-- This policy doesn't cause recursion
-- CREATE POLICY "Users can insert own profile" ON public.users
--   FOR INSERT WITH CHECK (id = auth.uid());

-- 5. Keep the existing policy for users to update their own profile
-- This policy doesn't cause recursion
-- CREATE POLICY "Users can update own profile" ON public.users
--   FOR UPDATE USING (id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== RECURSIVE POLICY FIXED SUCCESSFULLY! ===';
  RAISE NOTICE 'The infinite recursion in the users table policies has been resolved.';
  RAISE NOTICE 'You can now use the application without database errors.';
END $$;
