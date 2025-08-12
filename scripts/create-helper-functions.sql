-- Create helper functions to avoid recursion in policies

-- Function to create company account (bypasses RLS)
CREATE OR REPLACE FUNCTION create_company_account(
  p_company_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_company_size TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, company_name TEXT, contact_name TEXT, email TEXT) AS $$
DECLARE
  new_company_id UUID;
BEGIN
  INSERT INTO public.company_accounts (
    company_name, contact_name, email, phone, company_size, 
    address, description, subscription_plan, owner_id
  ) VALUES (
    p_company_name, p_contact_name, p_email, p_phone, p_company_size,
    p_address, p_description, 'free', p_owner_id
  ) RETURNING company_accounts.id INTO new_company_id;
  
  RETURN QUERY 
  SELECT company_accounts.id, company_accounts.company_name, 
         company_accounts.contact_name, company_accounts.email
  FROM public.company_accounts 
  WHERE company_accounts.id = new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_company_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_role TEXT DEFAULT 'admin',
  p_is_owner BOOLEAN DEFAULT true
)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
  INSERT INTO public.users (
    id, company_account_id, email, full_name, phone, role, is_company_owner
  ) VALUES (
    p_user_id, p_company_id, p_email, p_full_name, p_phone, p_role, p_is_owner
  );
  
  RETURN QUERY 
  SELECT users.id, users.email, users.full_name
  FROM public.users 
  WHERE users.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_company_account TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== HELPER FUNCTIONS CREATED! ===';
  RAISE NOTICE 'Functions created to bypass RLS during signup.';
  RAISE NOTICE 'These functions will prevent recursion errors.';
END $$;
